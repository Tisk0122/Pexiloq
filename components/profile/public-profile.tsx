'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { useI18n } from '@/components/i18n-provider'
import { firebaseEnabled, loadPublicBundle, recordAnalytics } from '@/lib/firebase'
import { Logo } from '../logo'
import { pageBackgroundStyle } from '../preview/live-preview'
import { ProfileCard } from '../preview/profile-card'
import { normalizeProfile, type LinkItem, type Profile, type Project } from '../types'
import { LoadingScreen } from '../ui/loader'
import { useAuth } from '../workspace-provider'

const PUBLIC_PROFILE_CACHE_MS = 60_000

function readPublicProfileCache(username: string) {
  try {
    const raw = window.localStorage.getItem(`pxl_pub_${username}`)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > PUBLIC_PROFILE_CACHE_MS) return null
    return data as { profile: Profile; links: LinkItem[]; projects: Project[] }
  } catch {
    return null
  }
}

function writePublicProfileCache(username: string, data: unknown) {
  try {
    window.localStorage.setItem(`pxl_pub_${username}`, JSON.stringify({ data, ts: Date.now() }))
  } catch {
    /* skip caching */
  }
}

const VIEW_DEDUPE_MS = 30 * 60 * 1000

function shouldRecordView(uid: string) {
  try {
    const key = `pxl_view_${uid}`
    const last = Number(window.localStorage.getItem(key) || 0)
    if (Date.now() - last < VIEW_DEDUPE_MS) return false
    window.localStorage.setItem(key, String(Date.now()))
    return true
  } catch {
    return true
  }
}

export function PublicProfile({ username }: { username?: string }) {
  const { t } = useI18n()
  const { user } = useAuth()
  const [data, setData] = useState<{ profile: Profile; links: LinkItem[]; projects: Project[] } | null | 'missing'>(null)
  const viewRecorded = useRef<string | null>(null)
  const lastClick = useRef<string | null>(null)

  useEffect(() => {
    let live = true
    async function load() {
      if (!username || !firebaseEnabled) {
        setData('missing')
        return
      }
      const cached = readPublicProfileCache(username)
      if (cached) {
        setData(cached)
        return
      }
      try {
        const bundle = await loadPublicBundle(username)
        if (!live) return
        if (!bundle) {
          setData('missing')
          return
        }
        const p = bundle.profile as Profile
        const result = {
          profile: { ...normalizeProfile(p), isPublic: p.isPublic !== false },
          links: (bundle.links || []) as LinkItem[],
          projects: (bundle.projects || []) as Project[],
        }
        setData(result)
        writePublicProfileCache(username, result)
      } catch {
        if (live) setData('missing')
      }
    }
    void load()
    return () => {
      live = false
    }
  }, [username])

  const skin =
    data !== null && data !== 'missing'
      ? data.profile.theme === 'dark'
        ? 'bg-[#20221f] text-[#f5f5f2]'
        : 'bg-background text-foreground'
      : 'bg-background text-foreground'

  const pageStyle: React.CSSProperties | undefined = data !== null && data !== 'missing' ? pageBackgroundStyle(data.profile) : undefined
  const animated = data !== null && data !== 'missing' && data.profile.backgroundStyle === 'gradient' && data.profile.backgroundAnimated
  const overlay = Boolean(data !== null && data !== 'missing' && data.profile.backgroundStyle === 'image' && data.profile.backgroundImageURL && data.profile.backgroundOverlay > 0)
  const pageUid = data !== null && data !== 'missing' ? data.profile.uid : null
  const isPublicProfile = data !== null && data !== 'missing' && data.profile.isPublic !== false

  useEffect(() => {
    if (pageUid && isPublicProfile && viewRecorded.current !== pageUid && shouldRecordView(pageUid)) {
      viewRecorded.current = pageUid
      void recordAnalytics(pageUid, 'views')
    }
  }, [pageUid, isPublicProfile])

  if (data === null) return <LoadingScreen />

  const track = (type: 'links' | 'projects' | 'socials', key: string) => {
    if (!pageUid) return
    const fingerprint = `${type}:${key}`
    if (lastClick.current === fingerprint) return
    lastClick.current = fingerprint
    window.setTimeout(() => {
      if (lastClick.current === fingerprint) lastClick.current = null
    }, 2000)
    void recordAnalytics(pageUid, type, key)
  }

  const loaded = data !== 'missing' ? data : null
  const pageDark = loaded ? loaded.profile.theme === 'dark' : false
  const chromePill = pageDark
    ? 'border-white/15 bg-white/5 text-[#f5f5f2] hover:bg-white/10'
    : 'border-border bg-card/80 backdrop-blur-sm hover:bg-card'
  const noticeCard = pageDark ? 'border-white/10 bg-white/5' : 'border-border bg-card'
  const noticeSub = pageDark ? 'text-[#adb1a9]' : 'text-muted-foreground'

  return (
    <main className={`relative min-h-screen px-5 py-8 sm:py-10 pb-[calc(2rem+env(safe-area-inset-bottom))] ${skin} ${animated ? 'pexiloq-animated-gradient' : ''}`} style={pageStyle}>
      {overlay && loaded && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: loaded.profile.theme === 'dark' ? '#000000' : '#ffffff', opacity: Math.min(Math.max(loaded.profile.backgroundOverlay, 0), 1) }}
        />
      )}
      <div className="relative mx-auto max-w-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Logo />
          <Link href={user ? '/dashboard' : '/signup'} className={`inline-flex min-h-[44px] items-center whitespace-nowrap rounded-full border px-4 py-2 text-xs font-medium transition ${chromePill}`}>
            {t('createYours')} <ArrowUpRight className="ml-1 inline size-3" />
          </Link>
        </div>
        {data === 'missing' && (
          <div className={`mt-16 rounded-2xl border p-10 text-center ${noticeCard}`}>
            <p className="text-lg font-medium">{t('notFound')}</p>
          </div>
        )}
        {loaded && !loaded.profile.isPublic && (
          <div className={`mt-16 rounded-2xl border p-10 text-center ${noticeCard}`}>
            <p className="text-lg font-medium">{t('privateNotice')}</p>
            <p className={`mt-2 text-sm ${noticeSub}`}>{t('privateProfileText')}</p>
            <Link
              href={user ? '/dashboard' : '/signup'}
              className="mt-6 inline-flex min-h-[44px] items-center gap-1 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              {t('publishNow')} <ArrowUpRight className="size-4" />
            </Link>
          </div>
        )}
        {loaded && loaded.profile.isPublic && (
          <div className="mt-8 sm:mt-10">
            <ProfileCard profile={loaded.profile} links={loaded.links} projects={loaded.projects} onTrack={track} />
          </div>
        )}
      </div>
    </main>
  )
}
