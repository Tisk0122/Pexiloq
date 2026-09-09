'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Eye, Layers, Link2, Palette, UserRound, Zap } from 'lucide-react'
import { useI18n } from '@/components/i18n-provider'
import { loadAnalytics } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LivePreview } from '../preview/live-preview'
import { socialPlatforms } from '../types'
import { socialMeta } from '../ui/helpers'
import { Onboarding } from '../ui/onboarding'
import { useWorkspace } from '../workspace-provider'

export function Stat({ label, value, accent, icon: Icon }: { label: string; value: string; accent?: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <Card className="relative overflow-hidden p-5 transition-all duration-200 hover:border-foreground/20">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        {Icon && <Icon className="size-4 text-muted-foreground/60" />}
      </div>
      <p className="mt-3 text-3xl font-medium tracking-[-0.06em]" style={{ color: accent || 'currentColor' }}>{value}</p>
    </Card>
  )
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground/80">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-medium tracking-[-0.06em] sm:text-4xl">{title}</h1>
        <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function Overview() {
  const { profile, links, projects, uid } = useWorkspace()
  const { t } = useI18n()
  const [stats, setStats] = useState<{ views: number; links: Record<string, number>; projects: Record<string, number>; socials: Record<string, number> } | null>(null)

  useEffect(() => {
    if (!uid) {
      setStats(null)
      return
    }
    let live = true
    void loadAnalytics(uid).then((s) => {
      if (live) setStats(s)
    })
    return () => {
      live = false
    }
  }, [uid])

  if (!profile.onboarded && !(profile.displayName && profile.username)) return <Onboarding />

  const totalClicks = Math.max(
    0,
    Object.values(stats?.links || {}).reduce((a, b) => a + b, 0) +
      Object.values(stats?.projects || {}).reduce((a, b) => a + b, 0) +
      Object.values(stats?.socials || {}).reduce((a, b) => a + b, 0)
  )

  const clicks = [
    ...links.filter((l) => l.visible).map((l) => ({ label: l.title || t('linkTitle'), count: stats?.links?.[l.id] || 0 })),
    ...projects.filter((p) => p.visible).map((p) => ({ label: p.title || t('project'), count: stats?.projects?.[p.id] || 0 })),
    ...socialPlatforms.filter((p) => profile.socials?.[p]).map((p) => ({ label: socialMeta[p].label, count: stats?.socials?.[p] || 0 })),
  ]
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  const maxClicks = Math.max(1, ...clicks.map((c) => c.count))

  return (
    <>
      <PageHeader
        eyebrow={t('workspace')}
        title={`${t('goodToSee')}, ${profile.displayName.split(' ')[0] || 'Creator'}.`}
        description={t('calmPlace')}
        action={
          <Button asChild className="rounded-full min-h-[44px]">
            <Link href={`/${profile.username}`} target="_blank">
              {t('viewProfile')} <ArrowUpRight className="size-4 ml-1" />
            </Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label={t('liveLinks')} value={String(links.filter((i) => i.visible).length)} accent={profile.accentColor} icon={Link2} />
        <Stat label={t('projects')} value={String(projects.filter((i) => i.visible).length)} accent={profile.accentColor} icon={Layers} />
        <Stat label={t('profileStatus')} value={profile.username ? (profile.isPublic === false ? t('privateProfile') : t('live')) : t('draft')} accent={profile.accentColor} icon={UserRound} />
        <Stat label={t('pageViews')} value={String(stats?.views ?? 0)} accent={profile.accentColor} icon={Eye} />
        <Stat label={t('totalClicks')} value={String(totalClicks)} accent={profile.accentColor} icon={Zap} />
      </div>
      <section className="mt-8 rounded-2xl border bg-card p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">{t('insights')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('analyticsHint')}</p>
          </div>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-mono text-muted-foreground">{totalClicks} clicks</span>
        </div>
        {clicks.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl bg-secondary/40 px-4 py-8 text-center">
            <Zap className="size-8 text-muted-foreground/60" />
            <p className="mt-2 text-sm font-medium">{t('noClicksYet')}</p>
            <p className="mt-1 text-xs text-muted-foreground">Share your public link to start tracking profile analytics.</p>
            <Button asChild size="sm" className="mt-4 rounded-full">
              <Link href="/dashboard/links">
                <Link2 className="size-3.5 mr-1" />
                {t('addFirstLink')}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="mt-6 space-y-3.5">
            {clicks.map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <span className="w-44 shrink-0 truncate text-xs font-medium">{row.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(row.count / maxClicks) * 100}%`, backgroundColor: profile.accentColor }} />
                </div>
                <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums">{row.count}</span>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-2xl border bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">{t('livePreview')}</p>
              <h2 className="mt-1 text-lg font-medium tracking-[-0.03em]">{t('thisWorld')}</h2>
            </div>
            <Link href="/dashboard/profile" className="inline-flex min-h-[44px] items-center gap-1 text-xs font-medium underline underline-offset-4 hover:opacity-80">
              {t('edit')} <ArrowUpRight className="size-3" />
            </Link>
          </div>
          <div className="mt-6">
            <LivePreview profile={profile} links={links} projects={projects} note={false} />
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-2xl border bg-secondary/50 p-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">{t('nextSteps')}</p>
            <div className="mt-5 space-y-3">
              {(
                [
                  [t('completeProfile'), '/dashboard/profile', UserRound],
                  [t('addFirstLink'), '/dashboard/links', Link2],
                  [t('showcaseProject'), '/dashboard/projects', Layers],
                  [t('makeItYours'), '/dashboard/appearance', Palette],
                ] as const
              ).map(([label, href, Icon]) => (
                <Link
                  href={href}
                  key={href}
                  className="group flex min-h-[48px] items-center justify-between rounded-xl border bg-card p-3.5 transition hover:border-foreground/30 hover:shadow-xs"
                >
                  <span className="flex items-center gap-3 text-xs font-medium">
                    <Icon className="size-4 text-muted-foreground transition group-hover:text-foreground" />
                    {label}
                  </span>
                  <ArrowUpRight className="size-4 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-8 rounded-xl border bg-card p-4 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">{t('proTip')}</p>
            <p className="mt-1 leading-relaxed">{t('proTipBody')}</p>
          </div>
        </div>
      </section>
    </>
  )
}
