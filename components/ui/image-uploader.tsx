'use client'

import React, { useEffect, useRef, useState } from 'react'
import { CircleAlert, Loader2, Upload, X, ZoomIn } from 'lucide-react'
import { auth } from '@/lib/firebase'
import { useI18n } from '@/components/i18n-provider'

const R2_MAX_BYTES = 10 * 1024 * 1024
const IMAGE_QUALITY = 0.82

export async function getIdToken(): Promise<string | null> {
  try {
    return (await auth?.currentUser?.getIdToken()) || null
  } catch {
    return null
  }
}

export async function deleteStoredImage(uid: string | null | undefined, url?: string | null) {
  if (!uid || !url) return
  try {
    const idToken = await getIdToken()
    await fetch('/api/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: uid, url, idToken }),
    })
  } catch {
    /* best effort */
  }
}

export async function purgeAllStoredImages(uid: string, idToken?: string | null) {
  try {
    await fetch('/api/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: uid, purgeAll: true, idToken }),
    })
  } catch {
    /* best effort */
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, mime, quality))
}

async function compressImage(file: File, maxDimension: number): Promise<{ blob: Blob; type: string } | null> {
  const mime = file.type
  if (mime === 'image/svg+xml' || mime === 'image/gif' || mime === 'image/avif') return null
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return null
  }
  try {
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))
    if (w >= bitmap.width && h >= bitmap.height) return null
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(bitmap, 0, 0, w, h)
    let best: { blob: Blob; type: string } | null = null
    for (const m of ['image/webp', 'image/jpeg']) {
      const blob = await canvasToBlob(canvas, m, IMAGE_QUALITY)
      if (blob && blob.type.startsWith('image/') && (!best || blob.size < best.blob.size)) best = { blob, type: m }
    }
    if (!best || best.blob.size >= file.size) return null
    return best
  } finally {
    bitmap.close()
  }
}

const UNCROPPABLE_TYPES = new Set(['image/svg+xml', 'image/gif', 'image/avif'])

export type CropShape = 'circle' | 'rect'

export function ImageCropModal({
  file,
  shape,
  aspect = 1,
  maxDimension,
  title,
  onCancel,
  onConfirm,
}: {
  file: File
  shape: CropShape
  aspect?: number
  maxDimension: number
  title: string
  onCancel: () => void
  onConfirm: (blob: Blob, type: string) => void
}) {
  const { t } = useI18n()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bitmapRef = useRef<ImageBitmap | null>(null)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [zoom, setZoom] = useState(1)
  const [aspectPreset, setAspectPreset] = useState<number>(aspect || 0)
  const center = useRef({ x: 0, y: 0 })
  const dragState = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    createImageBitmap(file)
      .then((bitmap) => {
        if (cancelled) {
          bitmap.close()
          return
        }
        bitmapRef.current = bitmap
        center.current = { x: bitmap.width / 2, y: bitmap.height / 2 }
        setReady(true)
      })
      .catch(() => {
        if (!cancelled) setError(t('uploadFailed'))
      })
    return () => {
      cancelled = true
      bitmapRef.current?.close()
    }
  }, [file, t])

  const effectiveAspect =
    shape === 'circle'
      ? 1
      : aspectPreset > 0
        ? aspectPreset
        : bitmapRef.current
          ? bitmapRef.current.width / bitmapRef.current.height
          : 1

  const frameW = 320
  const frameH = shape === 'circle' ? 320 : Math.min(320, Math.max(80, Math.round(320 / effectiveAspect)))

  function minScale() {
    const bitmap = bitmapRef.current
    if (!bitmap) return 1
    return Math.max(frameW / bitmap.width, frameH / bitmap.height)
  }

  function sourceRect() {
    const bitmap = bitmapRef.current
    if (!bitmap) return { sx: 0, sy: 0, sw: 1, sh: 1 }
    const scale = minScale() * zoom
    const sw = Math.min(bitmap.width, frameW / scale)
    const sh = Math.min(bitmap.height, frameH / scale)
    const sx = Math.min(Math.max(center.current.x - sw / 2, 0), bitmap.width - sw)
    const sy = Math.min(Math.max(center.current.y - sh / 2, 0), bitmap.height - sh)
    return { sx, sy, sw, sh }
  }

  function draw() {
    const canvas = canvasRef.current
    const bitmap = bitmapRef.current
    if (!canvas || !bitmap) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { sx, sy, sw, sh } = sourceRect()
    ctx.clearRect(0, 0, frameW, frameH)
    ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, frameW, frameH)
  }

  useEffect(() => {
    if (ready) draw()
  }, [ready, zoom, aspectPreset])

  function panBy(dx: number, dy: number) {
    const bitmap = bitmapRef.current
    if (!bitmap) return
    const scale = minScale() * zoom
    center.current.x -= dx / scale
    center.current.y -= dy / scale
    draw()
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!ready) return
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    dragState.current = { x: e.clientX, y: e.clientY }
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!dragState.current) return
    const dx = e.clientX - dragState.current.x
    const dy = e.clientY - dragState.current.y
    dragState.current = { x: e.clientX, y: e.clientY }
    panBy(dx, dy)
  }

  function onPointerUp() {
    dragState.current = null
  }

  async function confirm() {
    const bitmap = bitmapRef.current
    if (!bitmap) return
    setBusy(true)
    setError('')
    try {
      const { sx, sy, sw, sh } = sourceRect()
      let outW = maxDimension
      let outH = Math.round(maxDimension / effectiveAspect)
      if (shape !== 'circle' && (aspect <= 0 || aspectPreset === 0)) {
        const scale = Math.min(1, maxDimension / Math.max(sw, sh))
        outW = Math.max(1, Math.round(sw * scale))
        outH = Math.max(1, Math.round(sh * scale))
      }
      const canvas = document.createElement('canvas')
      canvas.width = outW
      canvas.height = outH
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('canvas unavailable')
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, outW, outH)
      let best: { blob: Blob; type: string } | null = null
      for (const m of ['image/webp', 'image/jpeg']) {
        const blob = await canvasToBlob(canvas, m, IMAGE_QUALITY)
        if (blob && (!best || blob.size < best.blob.size)) best = { blob, type: m }
      }
      if (!best) throw new Error('export failed')
      onConfirm(best.blob, best.type)
    } catch {
      setError(t('uploadFailed'))
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-xl">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t('cropHint')}</p>
        <div className="mt-4 flex justify-center">
          <canvas
            ref={canvasRef}
            width={frameW}
            height={frameH}
            className={`touch-none bg-secondary ${shape === 'circle' ? 'rounded-full' : 'rounded-xl'}`}
            style={{ width: frameW, height: frameH, cursor: ready ? 'grab' : 'default' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <ZoomIn className="size-4 shrink-0 text-muted-foreground" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            disabled={!ready}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full h-8 min-h-[32px] cursor-pointer"
            aria-label={t('cropZoom')}
          />
        </div>
        {shape === 'rect' && aspect <= 0 && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-xs">
            {([
              { label: t('aspectFree'), value: 0 },
              { label: '3:1', value: 3 },
              { label: '16:9', value: 16 / 9 },
              { label: '4:3', value: 4 / 3 },
              { label: '1:1', value: 1 },
            ] as const).map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => setAspectPreset(opt.value)}
                className={`min-h-[36px] min-w-[36px] rounded-full border px-3 py-1.5 transition ${aspectPreset === opt.value ? 'border-foreground bg-secondary font-medium' : 'text-muted-foreground hover:border-foreground/40'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
        {error && <p role="alert" className="mt-3 flex items-center gap-1.5 text-xs text-destructive"><CircleAlert className="size-3.5" />{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={busy} className="min-h-[44px] min-w-[44px] rounded-full border px-5 py-2.5 text-sm font-medium transition hover:border-foreground/40 disabled:opacity-40">{t('cancel')}</button>
          <button type="button" onClick={confirm} disabled={!ready || busy} className="min-h-[44px] min-w-[44px] flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">{busy ? <Loader2 className="size-4 animate-spin" /> : null}{t('cropApply')}</button>
        </div>
      </div>
    </div>
  )
}

export function ImageUploader({
  uid,
  onUploaded,
  label,
  accept = 'image/*',
  className = '',
  maxDimension = 1600,
  value,
  shape = 'rect',
  aspect = 1,
  onRemove,
}: {
  uid: string | null
  onUploaded: (url: string) => void
  label?: string
  accept?: string
  className?: string
  maxDimension?: number
  value?: string
  shape?: CropShape
  aspect?: number
  onRemove?: () => void
}) {
  const { t } = useI18n()
  const [busy, setBusy] = useState(false)
  const [phase, setPhase] = useState<'compress' | 'upload'>('upload')
  const [error, setError] = useState('')
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function upload(uploadFile: Blob, contentType: string) {
    setBusy(true)
    setError('')
    try {
      setPhase('upload')
      const idToken = await getIdToken()
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid, contentType, size: uploadFile.size, idToken }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'upload error')
      const put = await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=31536000, immutable' },
        body: uploadFile,
      })
      if (!put.ok) throw new Error('upload error')
      onUploaded(data.publicUrl)
      if (value && value !== data.publicUrl) void deleteStoredImage(uid, value)
    } catch {
      setError(t('uploadFailed'))
    } finally {
      setBusy(false)
      setPhase('upload')
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleFile(file: File) {
    setError('')
    if (!file.type.startsWith('image/')) {
      setError(t('uploadFailed'))
      return
    }
    if (file.size > R2_MAX_BYTES) {
      setError(t('fileTooLarge'))
      return
    }
    if (UNCROPPABLE_TYPES.has(file.type)) {
      setBusy(true)
      setPhase('compress')
      const compressed = await compressImage(file, maxDimension)
      await upload(compressed?.blob ?? file, compressed?.type ?? file.type)
      return
    }
    setCropFile(file)
  }

  function removeImage() {
    if (onRemove) onRemove()
    else onUploaded('')
    void deleteStoredImage(uid, value)
  }

  const busyLabel = busy ? (phase === 'compress' ? t('compressing') : t('uploading')) : (label ?? t('uploadImage'))

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <label
        onDragOver={(e) => {
          e.preventDefault()
          if (!busy) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (busy) return
          const f = e.dataTransfer.files?.[0]
          if (f) void handleFile(f)
        }}
        className={`inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition hover:border-foreground/40 ${busy ? 'pointer-events-none opacity-60' : ''} ${dragOver ? 'border-foreground bg-secondary ring-2 ring-foreground/15' : ''}`}
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        {dragOver ? t('dropToUpload') : busyLabel}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleFile(f)
          }}
        />
      </label>
      {value && (
        <button
          type="button"
          onClick={removeImage}
          disabled={busy}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium text-muted-foreground transition hover:border-destructive/50 hover:text-destructive disabled:opacity-40"
        >
          <X className="size-3.5" />
          {t('removeImage')}
        </button>
      )}
      {error && <p role="alert" className="flex w-full items-center gap-1.5 text-xs text-destructive"><CircleAlert className="size-3.5" />{error}</p>}
      {cropFile && (
        <ImageCropModal
          file={cropFile}
          shape={shape}
          aspect={aspect}
          maxDimension={maxDimension}
          title={label ?? t('uploadImage')}
          onCancel={() => {
            setCropFile(null)
            if (inputRef.current) inputRef.current.value = ''
          }}
          onConfirm={(blob, type) => {
            setCropFile(null)
            void upload(blob, type)
          }}
        />
      )}
    </div>
  )
}

export function Field({ label, value, onChange, area, prefix, placeholder }: { label: string; value: string; onChange: (value: string) => void; area?: boolean; prefix?: string; placeholder?: string }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <div className="mt-2 flex">
        {prefix && <span className="shrink-0 rounded-l-lg border border-r-0 bg-secondary px-3 py-2 text-xs text-muted-foreground">{prefix}</span>}
        {area ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-28 w-full min-w-0 rounded-lg border bg-background px-3 py-2 text-base sm:text-sm text-foreground outline-none transition focus:border-foreground/50"
          />
        ) : (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full min-w-0 rounded-lg border bg-background px-3 py-2 text-base sm:text-sm text-foreground outline-none transition focus:border-foreground/50 ${prefix ? 'rounded-l-none' : ''}`}
            placeholder={placeholder}
          />
        )}
      </div>
    </label>
  )
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex min-h-[44px] w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition ${checked ? 'border-foreground bg-secondary' : 'hover:border-foreground/40'}`}
    >
      <span>{label}</span>
      <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${checked ? 'bg-foreground' : 'bg-border'}`}>
        <span className={`inline-block size-4 rounded-full bg-background shadow transition ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </span>
    </button>
  )
}
