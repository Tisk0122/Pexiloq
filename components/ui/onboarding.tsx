'use client'

import React, { useState } from 'react'
import { ArrowUpRight, Check, Loader2, Plus, Trash2 } from 'lucide-react'
import { useI18n } from '@/components/i18n-provider'
import { siteHost } from '@/lib/site'
import { AppearanceControls } from '../editor/appearance-controls'
import { LivePreview } from '../preview/live-preview'
import { CardImg } from '../preview/profile-card'
import type { LinkItem, Profile, Project } from '../types'
import { useWorkspace } from '../workspace-provider'
import { deleteStoredImage, Field, ImageUploader } from './image-uploader'

export function Onboarding() {
  const { profile, links, projects, persistProfile, persistLinks, persistProjects, uid } = useWorkspace()
  const { t } = useI18n()
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Profile>(profile)
  const [draftLinks, setDraftLinks] = useState<LinkItem[]>(
    links.length ? links : [
      { id: '1', title: t('website'), url: 'https://', visible: true },
      { id: '2', title: 'X / Twitter', url: 'https://x.com/', visible: true },
    ]
  )
  const [draftProjects, setDraftProjects] = useState<Project[]>(
    projects.length ? projects : [
      { id: '1', title: t('projectTitle'), description: t('description'), url: 'https://', imageURL: '', technologies: [], visible: true },
    ]
  )
  const [busy, setBusy] = useState(false)
  const [finishError, setFinishError] = useState('')

  const steps = [
    { label: t('stepBasics'), hint: t('stepBasicsHint') },
    { label: t('stepAbout'), hint: t('stepAboutHint') },
    { label: t('stepLinks'), hint: t('stepLinksHint') },
    { label: t('stepProjects'), hint: t('stepProjectsHint') },
    { label: t('stepStyle'), hint: t('stepStyleHint') },
    { label: t('stepPrivacy'), hint: t('stepPrivacyHint') },
  ]

  const setField = (patch: Partial<Profile>) => setDraft({ ...draft, ...patch })
  const isLast = step === steps.length - 1

  async function finish() {
    setBusy(true)
    setFinishError('')
    try {
      await persistProfile({ ...draft, onboarded: true })
      await persistLinks(draftLinks)
      await persistProjects(draftProjects)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setFinishError(msg.replace('Firebase: ', '') || t('somethingWrong'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{t('workspace')}</p>
      <h2 className="mt-3 text-3xl font-medium tracking-[-0.05em] sm:text-4xl">{t('onboardingTitle')}</h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{t('onboardingSubtitle')}</p>
      <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <div
            key={s.label}
            className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
              i === step ? 'border-foreground bg-secondary font-medium' : i < step ? 'text-muted-foreground' : 'border-transparent text-muted-foreground/60'
            }`}
          >
            <span className={`grid size-4 place-items-center rounded-full text-[10px] ${i < step ? 'bg-foreground text-background' : i === step ? 'bg-foreground/15' : ''}`}>
              {i < step ? <Check className="size-3" /> : i + 1}
            </span>
            {s.label}
          </div>
        ))}
      </div>
      <div className={`mt-6 grid gap-6 ${isLast ? '' : 'lg:grid-cols-[1fr_0.75fr]'}`}>
        <div className="rounded-2xl border bg-card p-6 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{steps[step].label}</p>
          <p className="mt-2 text-sm text-muted-foreground">{steps[step].hint}</p>
          {step === 0 && (
            <div className="mt-6 space-y-4">
              <Field label={t('displayName')} value={draft.displayName} onChange={(v) => setField({ displayName: v })} />
              <Field
                label={t('username')}
                value={draft.username}
                prefix={`${siteHost}/`}
                onChange={(v) => setField({ username: v.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
              />
              <Field label={t('headline')} value={draft.headline} onChange={(v) => setField({ headline: v })} />
            </div>
          )}
          {step === 1 && (
            <div className="mt-6 space-y-4">
              <Field label={t('bio')} value={draft.bio} onChange={(v) => setField({ bio: v })} area />
              <Field label={t('website')} value={draft.website} onChange={(v) => setField({ website: v })} />
              <div className="block text-sm">
                <span className="font-medium">{t('profilePhoto')}</span>
                <div className="mt-2 flex items-center gap-4">
                  <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-secondary text-sm font-medium">
                    {draft.photoURL ? <CardImg src={draft.photoURL} alt="" className="size-full rounded-full" /> : (draft.displayName || '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="grid flex-1 gap-2">
                    <ImageUploader uid={uid} maxDimension={512} value={draft.photoURL} shape="circle" aspect={1} onUploaded={(url) => setField({ photoURL: url })} />
                    <details className="text-xs text-muted-foreground">
                      <summary className="cursor-pointer select-none">{t('orPasteUrl')}</summary>
                      <input
                        value={draft.photoURL || ''}
                        onChange={(e) => setField({ photoURL: e.target.value.trim() })}
                        className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-base sm:text-sm"
                        placeholder="https://…"
                      />
                    </details>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{t('photoFitHint')}</p>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="mt-6 space-y-3">
              {draftLinks.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 rounded-xl border bg-background p-4 sm:flex-row sm:items-center">
                  <button
                    className="min-h-[44px] min-w-[44px] grid place-items-center text-muted-foreground transition hover:text-destructive"
                    onClick={() => {
                      void deleteStoredImage(uid, item.imageURL)
                      setDraftLinks(draftLinks.filter((x) => x.id !== item.id))
                    }}
                    aria-label={t('deleteLink')}
                  >
                    <Trash2 className="size-4" />
                  </button>
                  <input
                    value={item.title}
                    onChange={(e) => setDraftLinks(draftLinks.map((x) => (x.id === item.id ? { ...x, title: e.target.value } : x)))}
                    className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-base sm:text-sm"
                    placeholder={t('linkTitle')}
                  />
                  <input
                    value={item.url}
                    onChange={(e) => setDraftLinks(draftLinks.map((x) => (x.id === item.id ? { ...x, url: e.target.value } : x)))}
                    className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-base sm:text-sm"
                    placeholder="https://"
                  />
                  <button
                    onClick={() => setDraftLinks(draftLinks.map((x) => (x.id === item.id ? { ...x, visible: !x.visible } : x)))}
                    className={`min-h-[44px] rounded-full px-4 py-2 text-xs transition ${item.visible ? 'bg-secondary font-medium' : 'border text-muted-foreground'}`}
                  >
                    {item.visible ? t('visible') : t('hidden')}
                  </button>
                </div>
              ))}
              <button
                onClick={() => setDraftLinks([...draftLinks, { id: crypto.randomUUID(), title: '', url: 'https://', visible: true }])}
                className="min-h-[44px] rounded-full border px-4 py-2.5 text-sm font-medium transition hover:border-foreground/40"
              >
                <Plus className="mr-1 inline size-4" />
                {t('addLink')}
              </button>
            </div>
          )}
          {step === 3 && (
            <div className="mt-6 space-y-3">
              {draftProjects.map((item) => (
                <div key={item.id} className="rounded-xl border bg-background p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{t('project')}</p>
                    <button
                      onClick={() => {
                        void deleteStoredImage(uid, item.imageURL)
                        setDraftProjects(draftProjects.filter((x) => x.id !== item.id))
                      }}
                      aria-label={t('deleteProject')}
                      className="min-h-[44px] min-w-[44px] grid place-items-center text-muted-foreground transition hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
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
                      className="min-h-20 rounded-lg border bg-background px-3 py-2 text-base sm:text-sm md:col-span-2"
                      placeholder={t('description')}
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={() => setDraftProjects([...draftProjects, { id: crypto.randomUUID(), title: '', description: '', url: 'https://', imageURL: '', technologies: [], visible: true }])}
                className="min-h-[44px] rounded-full border px-4 py-2.5 text-sm font-medium transition hover:border-foreground/40"
              >
                <Plus className="mr-1 inline size-4" />
                {t('addProject')}
              </button>
            </div>
          )}
          {step === 4 && (
            <div className="mt-6">
              <AppearanceControls draft={draft} onChange={setDraft} uid={uid} />
            </div>
          )}
          {step === 5 && (
            <div className="mt-6">
              <div className="grid gap-3 md:grid-cols-2">
                <button
                  onClick={() => setField({ isPublic: true })}
                  className={`rounded-2xl border p-5 text-left transition ${draft.isPublic === false ? 'hover:border-foreground/40' : 'border-foreground bg-secondary'}`}
                >
                  <p className="text-sm font-medium">{t('publicProfile')}</p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{t('publicProfileText')}</p>
                </button>
                <button
                  onClick={() => setField({ isPublic: false })}
                  className={`rounded-2xl border p-5 text-left transition ${draft.isPublic === false ? 'border-foreground bg-secondary' : 'hover:border-foreground/40'}`}
                >
                  <p className="text-sm font-medium">{t('privateProfile')}</p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{t('privateProfileText')}</p>
                </button>
              </div>
              <div className="mt-8 border-t pt-6">
                <LivePreview profile={draft} links={draftLinks.filter((i) => i.visible)} projects={draftProjects.filter((i) => i.visible)} />
              </div>
            </div>
          )}
          {finishError && <p role="alert" className="mt-6 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{finishError}</p>}
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => setStep((s) => Math.max(s - 1, 0))}
              disabled={step === 0}
              className="min-h-[44px] rounded-full border px-5 py-3 text-sm font-medium transition hover:border-foreground/40 disabled:opacity-40"
            >
              {t('stepBack')}
            </button>
            {isLast ? (
              <button
                onClick={finish}
                disabled={busy}
                className="flex min-h-[44px] items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : t('stepLaunch')}
                <ArrowUpRight className="size-4" />
              </button>
            ) : (
              <button
                onClick={() => setStep((s) => Math.min(s + 1, steps.length - 1))}
                className="flex min-h-[44px] items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
              >
                {t('stepNext')}
                <ArrowUpRight className="size-4" />
              </button>
            )}
          </div>
        </div>
        {!isLast && (
          <div className="hidden lg:block lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:self-start">
            <LivePreview profile={draft} links={draftLinks.filter((i) => i.visible)} projects={draftProjects.filter((i) => i.visible)} />
          </div>
        )}
      </div>
    </div>
  )
}
