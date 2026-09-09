'use client'

import * as React from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children?: React.ReactNode
  className?: string
}

export function Modal({ isOpen, onClose, title, description, children, className }: ModalProps) {
  const modalRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      modalRef.current?.focus()
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-desc' : undefined}
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={modalRef}
        tabIndex={-1}
        className={cn(
          'relative z-10 w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl transition-all animate-in zoom-in-95 duration-200 outline-none',
          className,
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border bg-secondary/50 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        {title && (
          <h2 id="modal-title" className="text-xl font-medium tracking-tight text-foreground pr-8">
            {title}
          </h2>
        )}
        {description && (
          <p id="modal-desc" className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}

        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

export interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'destructive' | 'default'
  loading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'destructive',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'grid size-10 shrink-0 place-items-center rounded-full',
            variant === 'destructive' ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-foreground',
          )}
        >
          <AlertTriangle className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-medium tracking-tight text-foreground">{title}</h2>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t pt-4">
        <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          type="button"
          variant={variant === 'destructive' ? 'destructive' : 'default'}
          size="sm"
          loading={loading}
          onClick={async () => {
            await onConfirm()
            onClose()
          }}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  )
}
