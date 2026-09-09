'use client'

import React, { useLayoutEffect, useRef, useState } from 'react'
import { Monitor, Smartphone, Sparkles } from 'lucide-react'
import { useI18n } from '@/components/i18n-provider'
import { siteHost } from '@/lib/site'
import { patternStyle, type LinkItem, type Profile, type Project } from '../types'
import { ProfileCard } from './profile-card'

export function pageBackgroundStyle(profile: Profile): React.CSSProperties | undefined {
  if (profile.backgroundStyle === 'pattern') {
    return patternStyle(profile.backgroundPattern || 'dots', profile.accentColor, profile.backgroundPatternDensity || 1, profile.backgroundPatternColor || undefined)
  }
  if (profile.backgroundStyle === 'gradient') {
    const bg = profile.backgroundGradient || 'radial-gradient(120% 120% at 50% 0%, var(--pexiloq-accent-30, rgba(23, 23, 23, 0.25)) 0%, transparent 70%)'
    return { backgroundImage: bg }
  }
  if (profile.backgroundStyle === 'image' && profile.backgroundImageURL) {
    return { backgroundImage: `url(${profile.backgroundImageURL})`, backgroundSize: 'cover', backgroundPosition: 'center' }
  }
  if (profile.backgroundColor) {
    return { backgroundColor: profile.backgroundColor }
  }
  return undefined
}

export function PageBackground({ profile, className, children }: { profile: Profile; className?: string; children: React.ReactNode }) {
  const animated = profile.backgroundStyle === 'gradient' && profile.backgroundAnimated
  const overlay = profile.backgroundStyle === 'image' && profile.backgroundImageURL && profile.backgroundOverlay > 0
  return (
    <div className={`relative ${className || ''} ${animated ? 'pexiloq-animated-gradient' : ''}`} style={pageBackgroundStyle(profile)}>
      {overlay && <div className="pointer-events-none absolute inset-0" style={{ backgroundColor: profile.theme === 'dark' ? '#000000' : '#ffffff', opacity: Math.min(Math.max(profile.backgroundOverlay, 0), 1) }} />}
      <div className="relative">{children}</div>
    </div>
  )
}

export function PreviewNote() {
  const { t } = useI18n()
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Sparkles className="size-3.5 text-primary" />
      <span>{t('livePreview')}</span>
    </div>
  )
}

export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setSize({ width: el.offsetWidth, height: el.offsetHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return { ref, ...size }
}

const PHONE_CONTENT_WIDTH = 390
const DESKTOP_CONTENT_WIDTH = 1280

export type PreviewDevice = 'phone' | 'desktop'

export function PhonePreviewFrame({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const { ref: screenRef, width: screenWidth } = useElementSize<HTMLDivElement>()
  const { ref: contentRef, height: contentHeight } = useElementSize<HTMLDivElement>()
  const scale = screenWidth > 0 ? screenWidth / PHONE_CONTENT_WIDTH : 1
  const skin = profile.theme === 'dark' ? 'bg-[#20221f] text-[#f5f5f2]' : 'bg-background text-foreground'
  return (
    <div className="pexiloq-phone-frame">
      <div className="pexiloq-phone-shell">
        <div className="pexiloq-phone-screen" ref={screenRef}>
          <div className="pexiloq-phone-scroll">
            <div style={{ position: 'relative', height: contentHeight ? contentHeight * scale : undefined }}>
              <div ref={contentRef} style={{ position: 'absolute', top: 0, left: 0, width: PHONE_CONTENT_WIDTH, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                <PageBackground profile={profile} className={`min-h-[844px] px-5 pb-8 pt-12 ${skin}`}>
                  {children}
                </PageBackground>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function DesktopPreviewFrame({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const { ref: screenRef, width: screenWidth } = useElementSize<HTMLDivElement>()
  const { ref: contentRef, height: contentHeight } = useElementSize<HTMLDivElement>()
  const scale = screenWidth > 0 ? screenWidth / DESKTOP_CONTENT_WIDTH : 1
  const skin = profile.theme === 'dark' ? 'bg-[#20221f] text-[#f5f5f2]' : 'bg-background text-foreground'
  const url = `${siteHost}/${profile.username || ''}`
  return (
    <div className="pexiloq-desktop-frame">
      <div className="pexiloq-desktop-shell">
        <div className="pexiloq-desktop-bar">
          <span className="pexiloq-desktop-dot" />
          <span className="pexiloq-desktop-dot" />
          <span className="pexiloq-desktop-dot" />
          <span className="pexiloq-desktop-url">{url}</span>
        </div>
        <div className="pexiloq-desktop-screen" ref={screenRef}>
          <div className="pexiloq-desktop-scroll">
            <div style={{ position: 'relative', height: contentHeight ? contentHeight * scale : undefined }}>
              <div ref={contentRef} style={{ position: 'absolute', top: 0, left: 0, width: DESKTOP_CONTENT_WIDTH, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                <PageBackground profile={profile} className={`min-h-[800px] px-5 py-10 ${skin}`}>
                  {children}
                </PageBackground>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function DeviceToggle({ device, onChange }: { device: PreviewDevice; onChange: (device: PreviewDevice) => void }) {
  const { t } = useI18n()
  return (
    <div className="pexiloq-device-toggle shadow-xs" role="group" aria-label={t('preview')}>
      <button type="button" aria-pressed={device === 'phone'} onClick={() => onChange('phone')} className="flex items-center gap-1.5 min-h-[36px] px-3 font-medium">
        <Smartphone className="size-3.5" />
        <span>{t('previewPhone')}</span>
      </button>
      <button type="button" aria-pressed={device === 'desktop'} onClick={() => onChange('desktop')} className="flex items-center gap-1.5 min-h-[36px] px-3 font-medium">
        <Monitor className="size-3.5" />
        <span>{t('previewDesktop')}</span>
      </button>
    </div>
  )
}

const MemoizedProfileCard = React.memo(ProfileCard)

export const LivePreview = React.memo(function LivePreview({ profile, links, projects, note = true }: { profile: Profile; links: LinkItem[]; projects: Project[]; note?: boolean }) {
  const [device, setDevice] = useState<PreviewDevice>('phone')
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {note ? <PreviewNote /> : <span />}
        <DeviceToggle device={device} onChange={setDevice} />
      </div>
      {device === 'phone' ? (
        <PhonePreviewFrame profile={profile}>
          <MemoizedProfileCard profile={profile} links={links} projects={projects} preview />
        </PhonePreviewFrame>
      ) : (
        <DesktopPreviewFrame profile={profile}>
          <MemoizedProfileCard profile={profile} links={links} projects={projects} preview />
        </DesktopPreviewFrame>
      )}
    </div>
  )
})
