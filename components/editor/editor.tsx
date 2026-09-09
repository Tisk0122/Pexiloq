'use client'

import React, { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Check, Eye, GripVertical, Layers, Link2, Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { useI18n } from '@/components/i18n-provider'
import { checkUsernameAvailable, saveItems, saveProfile } from '@/lib/firebase'
import { PageHeader } from '../dashboard/overview'
import { LivePreview } from '../preview/live-preview'
import { CardImg } from '../preview/profile-card'
import {
  linkDisplayStyles,
  linkEmojis,
  socialPlatforms,
  type LinkItem,
  type Project,
  type SocialPlatform,
} from '../types'
import { faviconFor, socialMeta } from '../ui/helpers'
import { deleteStoredImage, Field, ImageUploader } from '../ui/image-uploader'
import { useWorkspace } from '../workspace-provider'
import { AppearanceControls } from './appearance-controls'

export function Editor({ kind }: { kind: 'profile' | 'links' | 'projects' | 'appearance' }) {
  const { profile, links, projects, persistProfile, persistLinks, persistProjects, uid } = useWorkspace()
  const { t } = useI18n()
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [draftProfile, setDraftProfile] = useState(profile)
  const [draftLinks, setDraftLinks] = useState(links)
  const [draftProjects, setDraftProjects] = useState(projects)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor')
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')

  useEffect(() => {
    if (kind !== 'profile') return
    const candidate = draftProfile.username?.trim().toLowerCase()

    if (!candidate || candidate.length < 2) {
      setUsernameStatus('invalid')
      return
    }

    if (candidate === profile.username) {
      setUsernameStatus('idle')
      return
    }

    setUsernameStatus('checking')
    const checkTimer = window.setTimeout(async () => {
      try {
        const res = await checkUsernameAvailable(candidate, uid || undefined)
        if (res.available) {
          setUsernameStatus('available')
        } else {
          setUsernameStatus('taken')
        }
      } catch {
        setUsernameStatus('available')
      }
    }, 500)

    return () => window.clearTimeout(checkTimer)
  }, [draftProfile.username, profile.username, uid, kind])

  function reorder<T>(list: T[], setList: (next: T[]) => void, targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return
    const next = [...list]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(targetIndex, 0, moved)
    setList(next)
    setDragIndex(null)
  }

  function moveItem<T>(list: T[], setList: (next: T[]) => void, index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= list.length) return
    const next = [...list]
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    setList(next)
  }

  useEffect(() => {
    setDraftProfile(profile)
    setDraftLinks(links)
    setDraftProjects(projects)
  }, [profile, links, projects])

  const persistNow = async () => {
    setSaving(true)
    try {
      if (kind === 'profile' || kind === 'appearance') {
        const candidate = draftProfile.username?.trim().toLowerCase()
        if (candidate !== profile.username) {
          if (usernameStatus === 'taken' || !candidate || candidate.length < 2) {
            setDraftProfile((prev) => ({ ...prev, username: profile.username }))
            setNotice(t('usernameTaken'))
            window.setTimeout(() => setNotice(''), 3000)
            await persistProfile({ ...draftProfile, username: profile.username })
            return
          }
        }
        await persistProfile(draftProfile)
      }
      if (kind === 'links') await persistLinks(draftLinks)
      if (kind === 'projects') await persistProjects(draftProjects)
    } catch (err: any) {
      if (err?.message === 'USERNAME_TAKEN' || String(err).includes('USERNAME_TAKEN')) {
        setDraftProfile((prev) => ({ ...prev, username: profile.username }))
        setNotice(t('usernameTaken'))
        window.setTimeout(() => setNotice(''), 3000)
      } else {
        throw err
      }
    } finally {
      setSaving(false)
    }
  }

  const showSaved = () => {
    setNotice(t('saved'))
    window.setTimeout(() => setNotice(''), 2000)
  }

  const flushNow = async () => {
    if (timer.current) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
    await persistNow()
  }

  const firstRun = useRef(true)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(async () => {
      timer.current = null
      await persistNow()
      showSaved()
    }, 600)
  }, [draftProfile, draftLinks, draftProjects])

  const latest = useRef({ profile: draftProfile, links: draftLinks, projects: draftProjects })
  useEffect(() => {
    latest.current = { profile: draftProfile, links: draftLinks, projects: draftProjects }
  })

  useEffect(
    () => () => {
      if (timer.current) {
        window.clearTimeout(timer.current)
        timer.current = null
      }
      const { profile: p, links: l, projects: pr } = latest.current
      if (uid && (kind === 'profile' || kind === 'appearance')) void saveProfile(uid, p as Record<string, unknown>)
      if (uid && kind === 'links') void saveItems(uid, 'links', l)
      if (uid && kind === 'projects') void saveItems(uid, 'projects', pr)
    },
    [uid, kind]
  )

  async function save() {
    await flushNow()
    showSaved()
  }

  const addLink = () => setDraftLinks([...draftLinks, { id: crypto.randomUUID(), title: '', url: 'https://', visible: true }])
  const addProject = () => setDraftProjects([...draftProjects, { id: crypto.randomUUID(), title: '', description: '', url: 'https://', technologies: [], visible: true }])

  const titles = { profile: t('yourProfile'), links: t('yourLinks'), projects: t('yourProjects'), appearance: t('yourAppearance') }
  const descriptions = { profile: t('introduce'), links: t('important'), projects: t('considered'), appearance: t('tune') }

  return (
    <>
      <PageHeader
        eyebrow={t('customize')}
        title={titles[kind]}
        description={descriptions[kind]}
        action={
          <div className="flex flex-col items-end gap-1.5">
            <button
              onClick={save}
              disabled={saving}
              className="flex min-h-[44px] items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t('saving')}
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  {notice || t('save')}
                </>
              )}
            </button>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {saving ? (
                <>
                  <Loader2 className="size-3 animate-spin" />
                  {t('autosaving')}
                </>
              ) : notice ? (
                <>
                  <Check className="size-3" />
                  {t('autosaved')}
                </>
              ) : (
                t('autosaveHint')
              )}
            </span>
          </div>
        }
      />

      {/* Mobile Tab Switcher (Editor vs Live Preview) */}
      <div className="mb-6 flex rounded-full border bg-card p-1 shadow-xs lg:hidden">
        <button
          type="button"
          onClick={() => setMobileTab('editor')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-xs font-semibold transition ${
            mobileTab === 'editor' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('edit')}
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('preview')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-xs font-semibold transition ${
            mobileTab === 'preview' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Eye className="size-3.5" />
          {t('preview')}
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_0.75fr] lg:items-start">
        {/* Editor Content Area */}
        <div className={mobileTab === 'preview' ? 'hidden lg:block' : 'block'}>
          {kind === 'profile' && (
            <div className="space-y-6 rounded-2xl border bg-card p-6 shadow-xs">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('stepBasics')}</p>
                <div className="mt-4 space-y-4">
                  <Field label={t('displayName')} value={draftProfile.displayName} onChange={(v) => setDraftProfile({ ...draftProfile, displayName: v })} />
                  <div className="space-y-1.5">
                    <Field
                      label={t('username')}
                      value={draftProfile.username}
                      onChange={(v) => setDraftProfile({ ...draftProfile, username: v.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    />
                    {usernameStatus === 'checking' && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Loader2 className="size-3 animate-spin" />
                        {t('usernameChecking')}
                      </p>
                    )}
                    {usernameStatus === 'available' && draftProfile.username !== profile.username && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                        <Check className="size-3" />
                        {t('usernameAvailable')}
                      </p>
                    )}
                    {usernameStatus === 'taken' && (
                      <p role="alert" className="text-xs text-destructive font-medium flex items-center gap-1.5">
                        <span>✕</span>
                        {t('usernameTaken')}
                      </p>
                    )}
                    {usernameStatus === 'invalid' && draftProfile.username.length > 0 && draftProfile.username !== profile.username && (
                      <p role="alert" className="text-xs text-destructive font-medium flex items-center gap-1.5">
                        <span>✕</span>
                        {t('usernameInvalid')}
                      </p>
                    )}
                  </div>
                  <Field label={t('headline')} value={draftProfile.headline} onChange={(v) => setDraftProfile({ ...draftProfile, headline: v })} />
                  <Field label={t('bio')} value={draftProfile.bio} onChange={(v) => setDraftProfile({ ...draftProfile, bio: v })} area />
                  <Field label={t('website')} value={draftProfile.website} onChange={(v) => setDraftProfile({ ...draftProfile, website: v })} />
                </div>
              </div>
              <div className="border-t pt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('profilePhoto')}</p>
                <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-full bg-secondary text-lg font-medium">
                    {draftProfile.photoURL ? <CardImg src={draftProfile.photoURL} alt="" className="size-full rounded-full" /> : (draftProfile.displayName || '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="grid flex-1 gap-2">
                    <ImageUploader uid={uid} maxDimension={512} value={draftProfile.photoURL} shape="circle" aspect={1} onUploaded={(url) => setDraftProfile({ ...draftProfile, photoURL: url })} />
                    <details className="text-xs text-muted-foreground">
                      <summary className="cursor-pointer select-none">{t('orPasteUrl')}</summary>
                      <input
                        value={draftProfile.photoURL || ''}
                        onChange={(e) => setDraftProfile({ ...draftProfile, photoURL: e.target.value.trim() })}
                        className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-base sm:text-sm"
                        placeholder="https://…"
                      />
                    </details>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{t('photoFitHint')}</p>
              </div>
              <div className="border-t pt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('socialLinks')}</p>
                <div className="mt-4 space-y-3">
                  {socialPlatforms.map((platform) => (
                    <div key={platform} className="grid items-center gap-2 sm:grid-cols-[140px_1fr]">
                      <span className="text-xs font-medium text-muted-foreground">{socialMeta[platform].label}</span>
                      <Field
                        label=""
                        value={draftProfile.socials?.[platform] || ''}
                        onChange={(v) => setDraftProfile({ ...draftProfile, socials: { ...draftProfile.socials, [platform]: v } })}
                        placeholder={`${socialMeta[platform].label} — ${socialMeta[platform].placeholder}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {kind === 'appearance' && (
            <div className="rounded-2xl border bg-card p-6 shadow-xs">
              <AppearanceControls draft={draftProfile} onChange={setDraftProfile} savedProfile={profile} uid={uid} />
            </div>
          )}

          {kind === 'links' && (
            <div className="space-y-3">
              {draftLinks.length === 0 && (
                <div className="rounded-2xl border border-dashed bg-card/50 px-6 py-10 text-center">
                  <Link2 className="mx-auto size-6 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium">{t('noLinksYet')}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t('noLinksYetHint')}</p>
                  <button
                    type="button"
                    onClick={addLink}
                    className="mt-4 inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90"
                  >
                    <Plus className="size-3.5" />
                    {t('addLink')}
                  </button>
                </div>
              )}
              {draftLinks.map((item, index) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => reorder(draftLinks, setDraftLinks, index)}
                  onDragEnd={() => setDragIndex(null)}
                  className={`flex flex-col gap-3 rounded-2xl border bg-card p-4 transition ${dragIndex === index ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2 border-b pb-2 sm:border-b-0 sm:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="hidden cursor-grab select-none text-muted-foreground active:cursor-grabbing md:block" title={t('dragToReorder')}>
                        <GripVertical className="size-4" />
                      </span>
                      <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-xs font-semibold text-muted-foreground">
                        #{index + 1}
                      </span>
                      {/* Movement buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveItem(draftLinks, setDraftLinks, index, -1)}
                          aria-label="Move link up"
                          className="grid size-8 place-items-center rounded-md border text-muted-foreground transition hover:text-foreground disabled:opacity-30"
                        >
                          <ArrowUp className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === draftLinks.length - 1}
                          onClick={() => moveItem(draftLinks, setDraftLinks, index, 1)}
                          aria-label="Move link down"
                          className="grid size-8 place-items-center rounded-md border text-muted-foreground transition hover:text-foreground disabled:opacity-30"
                        >
                          <ArrowDown className="size-3.5" />
                        </button>
                      </div>
                      {faviconFor(item.url) && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={faviconFor(item.url)} alt="" className="hidden size-5 rounded-sm sm:block" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setDraftLinks(draftLinks.map((x) => (x.id === item.id ? { ...x, visible: !x.visible } : x)))}
                        className={`min-h-[36px] rounded-full px-3 py-1 text-xs transition ${item.visible ? 'bg-secondary font-medium' : 'border text-muted-foreground'}`}
                      >
                        {item.visible ? t('visible') : t('hidden')}
                      </button>
                      <button
                        className="grid size-9 place-items-center text-muted-foreground transition hover:text-destructive"
                        onClick={() => {
                          void deleteStoredImage(uid, item.imageURL)
                          setDraftLinks(draftLinks.filter((x) => x.id !== item.id))
                        }}
                        aria-label={t('deleteLink')}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid flex-1 gap-2">
                    <div className="grid gap-2 md:grid-cols-2">
                      <input
                        value={item.title}
                        onChange={(e) => setDraftLinks(draftLinks.map((x) => (x.id === item.id ? { ...x, title: e.target.value } : x)))}
                        className="rounded-lg border bg-background px-3 py-2 text-base sm:text-sm"
                        placeholder={t('linkTitle')}
                      />
                      <input
                        value={item.url}
                        onChange={(e) => setDraftLinks(draftLinks.map((x) => (x.id === item.id ? { ...x, url: e.target.value } : x)))}
                        className="rounded-lg border bg-background px-3 py-2 text-base sm:text-sm"
                        placeholder="https://"
                      />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto py-1">
                      <input
                        value={item.icon || ''}
                        maxLength={4}
                        onChange={(e) => setDraftLinks(draftLinks.map((x) => (x.id === item.id ? { ...x, icon: e.target.value.trim() } : x)))}
                        className="w-14 rounded-lg border bg-background px-2 py-2 text-center text-lg shrink-0"
                        placeholder={t('emoji')}
                        aria-label={t('emoji')}
                      />
                      <div className="flex gap-1 overflow-x-auto">
                        {linkEmojis.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setDraftLinks(draftLinks.map((x) => (x.id === item.id ? { ...x, icon: x.icon === emoji ? '' : emoji } : x)))}
                            aria-pressed={item.icon === emoji}
                            className={`min-h-[36px] min-w-[36px] shrink-0 rounded-md p-1.5 text-base transition ${item.icon === emoji ? 'bg-secondary ring-1 ring-foreground/20' : 'hover:bg-secondary/60'}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 border-t pt-2">
                      <span className="text-xs text-muted-foreground">{t('linkDisplayStyle')}</span>
                      {linkDisplayStyles.map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => setDraftLinks(draftLinks.map((x) => (x.id === item.id ? { ...x, displayStyle: style } : x)))}
                          aria-pressed={(item.displayStyle || 'default') === style}
                          className={`min-h-[36px] rounded-full border px-3 py-1 text-xs capitalize transition ${
                            (item.displayStyle || 'default') === style ? 'border-foreground bg-secondary font-medium' : 'hover:border-foreground/40'
                          }`}
                        >
                          {t(`linkStyle${style.charAt(0).toUpperCase()}${style.slice(1)}`)}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex min-h-[36px] items-center gap-2 rounded-full border px-3 py-1.5 text-xs text-muted-foreground">
                        <input
                          type="color"
                          value={item.bgColor || '#ffffff'}
                          onChange={(e) => setDraftLinks(draftLinks.map((x) => (x.id === item.id ? { ...x, bgColor: e.target.value } : x)))}
                          className="size-4 cursor-pointer appearance-none rounded-full border border-border p-0"
                          aria-label={t('linkBgColor')}
                        />
                        <span>{t('linkBgColor')}</span>
                      </label>
                      {item.bgColor && (
                        <button type="button" onClick={() => setDraftLinks(draftLinks.map((x) => (x.id === item.id ? { ...x, bgColor: '' } : x)))} className="text-xs text-muted-foreground underline underline-offset-4">
                          {t('bgDefault')}
                        </button>
                      )}
                      <label className="inline-flex min-h-[36px] items-center gap-2 rounded-full border px-3 py-1.5 text-xs text-muted-foreground">
                        <input
                          type="color"
                          value={item.iconColor || '#171717'}
                          onChange={(e) => setDraftLinks(draftLinks.map((x) => (x.id === item.id ? { ...x, iconColor: e.target.value } : x)))}
                          className="size-4 cursor-pointer appearance-none rounded-full border border-border p-0"
                          aria-label={t('linkIconColor')}
                        />
                        <span>{t('linkIconColor')}</span>
                      </label>
                      {item.iconColor && (
                        <button type="button" onClick={() => setDraftLinks(draftLinks.map((x) => (x.id === item.id ? { ...x, iconColor: '' } : x)))} className="text-xs text-muted-foreground underline underline-offset-4">
                          {t('bgDefault')}
                        </button>
                      )}
                    </div>
                    {item.displayStyle === 'thumbnail' && (
                      <div className="grid gap-2 border-t pt-2 md:grid-cols-2">
                        <input
                          value={item.imageURL || ''}
                          onChange={(e) => setDraftLinks(draftLinks.map((x) => (x.id === item.id ? { ...x, imageURL: e.target.value.trim() } : x)))}
                          className="rounded-lg border bg-background px-3 py-2 text-base sm:text-sm"
                          placeholder={t('linkThumbnailUrl')}
                        />
                        <ImageUploader uid={uid} maxDimension={512} value={item.imageURL} shape="rect" aspect={1} onUploaded={(url) => setDraftLinks(draftLinks.map((x) => (x.id === item.id ? { ...x, imageURL: url } : x)))} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <button onClick={addLink} className="flex min-h-[44px] items-center rounded-full border px-5 py-2.5 text-sm font-medium transition hover:border-foreground/40">
                <Plus className="mr-1.5 size-4" />
                {t('addLink')}
              </button>
            </div>
          )}

          {kind === 'projects' && (
            <div className="space-y-3">
              {draftProjects.length === 0 && (
                <div className="rounded-2xl border border-dashed bg-card/50 px-6 py-10 text-center">
                  <Layers className="mx-auto size-6 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium">{t('noProjectsYet')}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t('noProjectsYetHint')}</p>
                  <button
                    type="button"
                    onClick={addProject}
                    className="mt-4 inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90"
                  >
                    <Plus className="size-3.5" />
                    {t('addProject')}
                  </button>
                </div>
              )}
              {draftProjects.map((item, index) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => reorder(draftProjects, setDraftProjects, index)}
                  onDragEnd={() => setDragIndex(null)}
                  className={`rounded-2xl border bg-card p-5 transition ${dragIndex === index ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="hidden cursor-grab select-none text-muted-foreground active:cursor-grabbing md:block" title={t('dragToReorder')}>
                        <GripVertical className="size-4" />
                      </span>
                      <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-xs font-semibold text-muted-foreground">
                        #{index + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveItem(draftProjects, setDraftProjects, index, -1)}
                          aria-label="Move project up"
                          className="grid size-8 place-items-center rounded-md border text-muted-foreground transition hover:text-foreground disabled:opacity-30"
                        >
                          <ArrowUp className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === draftProjects.length - 1}
                          onClick={() => moveItem(draftProjects, setDraftProjects, index, 1)}
                          aria-label="Move project down"
                          className="grid size-8 place-items-center rounded-md border text-muted-foreground transition hover:text-foreground disabled:opacity-30"
                        >
                          <ArrowDown className="size-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-medium">{t('project')}</span>
                    </div>
                    <button
                      onClick={() => {
                        void deleteStoredImage(uid, item.imageURL)
                        setDraftProjects(draftProjects.filter((x) => x.id !== item.id))
                      }}
                      aria-label={t('deleteProject')}
                      className="grid size-9 place-items-center text-muted-foreground transition hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <input
                      value={item.title}
                      onChange={(e) => setDraftProjects(draftProjects.map((x) => (x.id === item.id ? { ...x, title: e.target.value } : x)))}
                      className="rounded-lg border bg-background px-3 py-2 text-base sm:text-sm"
                      placeholder={t('projectTitle')}
                    />
                    <input
                      value={item.url}
                      onChange={(e) => setDraftProjects(draftProjects.map((x) => (x.id === item.id ? { ...x, url: e.target.value } : x)))}
                      className="rounded-lg border bg-background px-3 py-2 text-base sm:text-sm"
                      placeholder={t('projectUrl')}
                    />
                    <textarea
                      value={item.description}
                      onChange={(e) => setDraftProjects(draftProjects.map((x) => (x.id === item.id ? { ...x, description: e.target.value } : x)))}
                      className="min-h-24 rounded-lg border bg-background px-3 py-2 text-base sm:text-sm md:col-span-2"
                      placeholder={t('description')}
                    />
                    <input
                      value={item.imageURL || ''}
                      onChange={(e) => setDraftProjects(draftProjects.map((x) => (x.id === item.id ? { ...x, imageURL: e.target.value.trim() } : x)))}
                      className="rounded-lg border bg-background px-3 py-2 text-base sm:text-sm md:col-span-2"
                      placeholder="Image URL (optional) — https://"
                    />
                    <ImageUploader
                      uid={uid}
                      maxDimension={1024}
                      value={item.imageURL}
                      shape="rect"
                      aspect={16 / 9}
                      onUploaded={(url) => setDraftProjects(draftProjects.map((x) => (x.id === item.id ? { ...x, imageURL: url } : x)))}
                      className="md:col-span-2"
                    />
                  </div>
                </div>
              ))}
              <button onClick={addProject} className="flex min-h-[44px] items-center rounded-full border px-5 py-2.5 text-sm font-medium transition hover:border-foreground/40">
                <Plus className="mr-1.5 size-4" />
                {t('addProject')}
              </button>
            </div>
          )}
        </div>

        {/* Live Preview Column (desktop sticky, mobile when tab active) */}
        <div className={`lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:self-start ${mobileTab === 'preview' ? 'block' : 'hidden lg:block'}`}>
          <LivePreview profile={draftProfile} links={draftLinks} projects={draftProjects} />
        </div>
      </div>
    </>
  )
}
