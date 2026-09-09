'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Check, Copy, ExternalLink } from 'lucide-react'
import { useI18n } from '@/components/i18n-provider'
import { siteHost } from '@/lib/site'
import {
  avatarShapeClass,
  defaultSectionOrder,
  fontClass,
  layoutTemplates,
  radiusClass,
  socialPlatforms,
  spacingConfig,
  type CardRadius,
  type LayoutTemplate,
  type LinkItem,
  type Profile,
  type Project,
  type SectionKind,
} from '../types'
import { contrastColor, faviconFor, qrCodeFor, SocialGlyph, socialHref, socialMeta } from '../ui/helpers'

const ASPECT_MISMATCH_THRESHOLD = 1.15

export function CardImg({
  src,
  alt,
  className,
  fit = 'auto',
  style,
}: {
  src: string
  alt: string
  className: string
  fit?: 'auto' | 'cover' | 'contain' | 'fill'
  style?: React.CSSProperties
}) {
  const [naturalAspect, setNaturalAspect] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerAspect, setContainerAspect] = useState<number | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry && entry.contentRect.height > 0) {
        setContainerAspect(entry.contentRect.width / entry.contentRect.height)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const fitMode =
    fit !== 'auto'
      ? fit
      : naturalAspect && containerAspect
        ? Math.max(naturalAspect / containerAspect, containerAspect / naturalAspect) > ASPECT_MISMATCH_THRESHOLD
          ? 'cover'
          : 'contain'
        : 'cover'

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="h-full w-full"
        style={{ ...style, objectFit: fitMode }}
        onLoad={(e) => {
          const img = e.currentTarget
          if (img.naturalWidth && img.naturalHeight) {
            setNaturalAspect(img.naturalWidth / img.naturalHeight)
          }
        }}
      />
    </div>
  )
}

export type Skin = { card: string; sub: string; bar: string; strip: string }
export type CardTrack = (type: 'links' | 'projects' | 'socials', key: string) => void

export function LinksSection({ profile, links, skin, layout, onTrack }: { profile: Profile; links: LinkItem[]; skin: Skin; layout: LayoutTemplate; onTrack?: CardTrack }) {
  const visibleLinks = links.filter((item) => item.visible)
  if (!visibleLinks.length) return null

  const spacing = spacingConfig[profile.spacing || 'cozy']
  const radius = radiusClass[profile.cardRadius]
  const isGhost = profile.buttonStyle === 'ghost'
  const isOutline = profile.buttonStyle === 'outline'

  const buttonClass = isGhost
    ? skin.strip
    : isOutline
      ? `border ${skin.bar}`
      : ''

  const ghostHover = isGhost
    ? 'hover:bg-secondary/80'
    : isOutline
      ? darkHoverClass(profile.theme)
      : 'hover:opacity-90'

  function darkHoverClass(theme: string) {
    return theme === 'dark' ? 'hover:border-white/40' : 'hover:border-foreground/40'
  }

  const baseLinkStyle = isGhost || isOutline
    ? {}
    : { backgroundColor: profile.accentColor, color: contrastColor(profile.accentColor) }

  function linkStyle(item: LinkItem, customClass: string) {
    if (item.bgColor) {
      return { className: `${customClass} ${radius} flex items-center justify-between text-left text-sm font-medium transition duration-200 hover:-translate-y-0.5 active:translate-y-0`, style: { backgroundColor: item.bgColor, color: contrastColor(item.bgColor) } }
    }
    return { className: `${customClass} ${radius} ${buttonClass} flex items-center justify-between text-left text-sm font-medium transition duration-200 hover:-translate-y-0.5 active:translate-y-0 ${ghostHover}`, style: baseLinkStyle }
  }

  const icon = (item: LinkItem, sizeClass = 'size-4') =>
    profile.showLinkIcons !== false &&
    (item.icon ? (
      <span className="shrink-0 text-base leading-none" style={item.iconColor ? { color: item.iconColor } : undefined}>
        {item.icon}
      </span>
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={faviconFor(item.url)}
        alt=""
        aria-hidden="true"
        className={`${sizeClass} shrink-0 rounded-sm opacity-90`}
        onError={(e) => {
          ;(e.currentTarget as HTMLImageElement).style.display = 'none'
        }}
      />
    ))

  function renderLink(item: LinkItem, fallback: LayoutTemplate | 'default') {
    const style = item.displayStyle && item.displayStyle !== 'default' ? item.displayStyle : null
    if (style === 'text') {
      return (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noreferrer"
          onClick={() => onTrack?.('links', item.id)}
          className="flex items-center gap-2 px-1 py-2 text-left text-sm font-medium underline underline-offset-4 transition hover:opacity-70 min-h-[44px]"
          style={{ color: item.bgColor || profile.accentColor }}
        >
          {icon(item, 'size-3.5')}
          <span className="truncate">{item.title}</span>
        </a>
      )
    }
    if (style === 'large') {
      return (
        <a key={item.id} href={item.url} target="_blank" rel="noreferrer" onClick={() => onTrack?.('links', item.id)} {...linkStyle(item, `${spacing.linkPad} min-h-16 text-base`)}>
          <span className="flex min-w-0 items-center gap-3">
            {icon(item, 'size-5')}
            <span className="truncate">{item.title}</span>
          </span>
          <ExternalLink className="size-4 shrink-0 opacity-70" />
        </a>
      )
    }
    if (style === 'thumbnail') {
      return (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noreferrer"
          onClick={() => onTrack?.('links', item.id)}
          className={`flex min-h-[56px] items-center gap-4 rounded-2xl border p-3 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 ${skin.bar}`}
          style={item.bgColor ? { backgroundColor: item.bgColor, color: contrastColor(item.bgColor) } : undefined}
        >
          {item.imageURL ? (
            <CardImg src={item.imageURL} alt={item.title} className="size-14 shrink-0 rounded-xl" />
          ) : (
            <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-secondary text-lg">{icon(item, 'size-6')}</span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{item.title}</span>
            <span className={`mt-0.5 block truncate text-xs ${item.bgColor ? 'opacity-70' : skin.sub}`}>{item.url.replace(/^https?:\/\//, '')}</span>
          </span>
          <ExternalLink className="size-4 shrink-0 opacity-50 transition group-hover:opacity-80" />
        </a>
      )
    }

    if (fallback === 'grid') {
      return (
        <a key={item.id} href={item.url} target="_blank" rel="noreferrer" onClick={() => onTrack?.('links', item.id)} {...linkStyle(item, `min-h-20 flex-col justify-center gap-2 px-3 py-4 text-center`)}>
          <span className="text-xl leading-none">
            {item.icon || (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={faviconFor(item.url)}
                alt=""
                aria-hidden="true"
                className="mx-auto size-5 rounded-sm opacity-90"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                }}
              />
            )}
          </span>
          <span className="line-clamp-2 w-full truncate text-xs leading-snug">{item.title}</span>
        </a>
      )
    }
    if (fallback === 'card') {
      return (
        <a key={item.id} href={item.url} target="_blank" rel="noreferrer" onClick={() => onTrack?.('links', item.id)} {...linkStyle(item, `${spacing.linkPad} shadow-[0_10px_30px_rgba(35,35,30,0.08)]`)}>
          <span className="flex min-w-0 items-center gap-3">
            {icon(item)}
            <span className="truncate">{item.title}</span>
          </span>
          <ExternalLink className="size-4 shrink-0 opacity-70" />
        </a>
      )
    }
    if (fallback === 'magazine') {
      return (
        <a key={item.id} href={item.url} target="_blank" rel="noreferrer" onClick={() => onTrack?.('links', item.id)} className={`flex items-center gap-4 rounded-2xl border p-3 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 ${skin.bar}`}>
          {item.imageURL ? (
            <CardImg src={item.imageURL} alt={item.title} className="size-14 shrink-0 rounded-xl" />
          ) : (
            <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-secondary text-lg">
              {item.icon || (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={faviconFor(item.url)}
                  alt=""
                  aria-hidden="true"
                  className="size-6 rounded-sm opacity-90"
                  onError={(e) => {
                    ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                  }}
                />
              )}
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{item.title}</span>
            <span className={`mt-0.5 block truncate text-xs ${skin.sub}`}>{item.url.replace(/^https?:\/\//, '')}</span>
          </span>
          <ExternalLink className="size-4 shrink-0 opacity-50" />
        </a>
      )
    }
    return (
      <a key={item.id} href={item.url} target="_blank" rel="noreferrer" onClick={() => onTrack?.('links', item.id)} {...linkStyle(item, `${spacing.linkPad} min-h-[48px]`)}>
        <span className="flex min-w-0 items-center gap-3">
          {icon(item)}
          <span className="truncate">{item.title}</span>
        </span>
        <ExternalLink className="size-4 shrink-0 opacity-60" />
      </a>
    )
  }

  if (layout === 'grid') {
    return <div className={`${spacing.sectionGap} grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3`}>{visibleLinks.map((item) => renderLink(item, 'grid'))}</div>
  }
  if (layout === 'card') {
    return <div className={`${spacing.sectionGap} ${spacing.linkGap}`}>{visibleLinks.map((item) => renderLink(item, 'card'))}</div>
  }
  if (layout === 'magazine') {
    return <div className={`${spacing.sectionGap} space-y-3`}>{visibleLinks.map((item) => renderLink(item, 'magazine'))}</div>
  }
  return <div className={`${spacing.sectionGap} ${spacing.linkGap}`}>{visibleLinks.map((item) => renderLink(item, 'default'))}</div>
}

export function ProjectsSection({ profile, projects, skin, layout, onTrack, t }: { profile: Profile; projects: Project[]; skin: Skin; layout: LayoutTemplate; onTrack?: CardTrack; t: (key: string) => string }) {
  const visibleProjects = projects.filter((item) => item.visible)
  if (!visibleProjects.length) return null
  const spacing = spacingConfig[profile.spacing || 'cozy']

  if (layout === 'magazine') {
    return (
      <div className={`${spacing.sectionGap} space-y-4`}>
        {visibleProjects.map((item, index) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            onClick={() => onTrack?.('projects', item.id)}
            className={`block overflow-hidden rounded-2xl text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 ${index === 0 ? '' : `border ${skin.bar}`}`}
            style={index === 0 ? { backgroundColor: profile.accentColor, color: '#ffffff' } : undefined}
          >
            {item.imageURL && <CardImg src={item.imageURL} alt={item.title} className="aspect-[16/9] w-full" />}
            <div className="p-4">
              <span className={`text-[10px] font-medium uppercase tracking-widest ${index === 0 ? 'text-white/75' : skin.sub}`}>{t('selectedWork')}</span>
              <p className="mt-2 text-base font-medium leading-snug">{item.title}</p>
              {item.description && <p className={`mt-1.5 line-clamp-2 text-xs leading-relaxed ${index === 0 ? 'text-white/75' : skin.sub}`}>{item.description}</p>}
            </div>
          </a>
        ))}
      </div>
    )
  }

  const cols = layout === 'grid' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
  return (
    <div className={`${spacing.sectionGap} grid gap-3 ${cols}`}>
      {visibleProjects.map((item, index) => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noreferrer"
          onClick={() => onTrack?.('projects', item.id)}
          className={`flex min-h-32 flex-col rounded-xl p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 ${index === 0 ? '' : skin.strip}`}
          style={index === 0 ? { backgroundColor: profile.accentColor, color: '#ffffff' } : undefined}
        >
          {item.imageURL && (
            <div className="mb-3">
              <CardImg src={item.imageURL} alt={item.title} className="aspect-[16/10] w-full rounded-lg" />
            </div>
          )}
          <span className={`text-[10px] font-medium uppercase tracking-widest ${index === 0 ? 'text-white/75' : skin.sub}`}>{t('selectedWork')}</span>
          <p className={`${item.imageURL ? 'mt-3' : 'mt-8'} text-sm font-medium leading-snug`}>{item.title}</p>
          {item.description && <p className={`mt-1.5 line-clamp-2 text-xs leading-relaxed ${index === 0 ? 'text-white/75' : skin.sub}`}>{item.description}</p>}
        </a>
      ))}
    </div>
  )
}

export function ProfileCard({ profile, links, projects, preview = false, onTrack }: { profile: Profile; links: LinkItem[]; projects: Project[]; preview?: boolean; onTrack?: CardTrack }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const dark = profile.theme === 'dark'
  const skin: Skin = dark
    ? { card: 'border-[#3a3d38] bg-[#262926] text-[#f5f5f2]', sub: 'text-[#adb1a9]', bar: 'border-[#3a3d38]', strip: 'bg-[#30332f] text-[#adb1a9]' }
    : { card: 'border-border bg-card text-foreground', sub: 'text-muted-foreground', bar: 'border-[#e3e3dd]', strip: 'bg-secondary text-muted-foreground' }
  const radius = radiusClass[profile.cardRadius]
  const font = fontClass[profile.fontStyle]

  async function share() {
    await navigator.clipboard?.writeText(`${window.location.host}/${profile.username}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const cardShadow = profile.cardShadow === false ? '' : 'shadow-[0_20px_60px_rgba(35,35,30,0.08)]'
  const socialFilled = profile.socialStyle === 'filled'
  const layout: LayoutTemplate = layoutTemplates.includes(profile.layoutTemplate) ? profile.layoutTemplate : 'classic'
  const sectionOrder: SectionKind[] = profile.sectionOrder?.length ? profile.sectionOrder : defaultSectionOrder
  const maxWidth = layout === 'magazine' ? 'max-w-md' : layout === 'card' ? 'max-w-2xl' : 'max-w-xl'
  const isNameCard = layout === 'card'

  const sections: Record<SectionKind, React.ReactNode> = {
    links: <LinksSection key="links" profile={profile} links={links} skin={skin} layout={layout} onTrack={onTrack} />,
    projects: <ProjectsSection key="projects" profile={profile} projects={projects} skin={skin} layout={layout} onTrack={onTrack} t={t} />,
  }

  return (
    <div className={`pexiloq-fade-in mx-auto ${maxWidth} ${font} overflow-hidden border ${cardShadow} ${radius} ${skin.card} ${preview ? '' : 'my-8'}`}>
      {profile.coverImageURL && (
        <div className="w-full" style={{ height: `${profile.coverImageHeight || 140}px` }}>
          <CardImg
            src={profile.coverImageURL}
            alt=""
            className="h-full w-full"
            fit={profile.coverImageFit || 'cover'}
            style={{ objectPosition: `${profile.coverImagePositionX ?? 50}% ${profile.coverImagePositionY ?? 50}%` }}
          />
        </div>
      )}
      <div className="p-5">
        <div className={`flex items-center justify-between gap-2 text-[11px] ${skin.sub}`}>
          <span className="min-w-0 truncate font-medium tracking-tight opacity-80">{siteHost}/{profile.username}</span>
          <span className="flex shrink-0 items-center gap-0.5">
            <button
              onClick={() => setShowQr((v) => !v)}
              aria-label={t('showQr')}
              aria-pressed={showQr}
              className={`min-h-[36px] min-w-[36px] grid place-items-center rounded-full p-2 transition ${showQr ? (dark ? 'bg-white/15' : 'bg-secondary/80') : dark ? 'hover:bg-white/10' : 'hover:bg-secondary/60'}`}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4"><rect x="3" y="3" width="7" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.6" /><rect x="14" y="3" width="7" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.6" /><rect x="3" y="14" width="7" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.6" /><rect x="14.5" y="14.5" width="2.5" height="2.5" fill="currentColor" /><rect x="18.5" y="14.5" width="2.5" height="2.5" fill="currentColor" /><rect x="14.5" y="18.5" width="2.5" height="2.5" fill="currentColor" /><rect x="18.5" y="18.5" width="2.5" height="2.5" fill="currentColor" /></svg>
            </button>
            <span className="relative">
              <button
                onClick={share}
                aria-label={t('shareButton')}
                className={`min-h-[36px] min-w-[36px] grid place-items-center rounded-full p-2 transition ${dark ? 'hover:bg-white/10' : 'hover:bg-secondary/60'}`}
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </button>
              {copied && (
                <span role="status" aria-live="polite" className={`pexiloq-fade-in pointer-events-none absolute right-0 top-full mt-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-medium shadow-sm ${dark ? 'bg-white text-[#151515]' : 'bg-[#151515] text-white'}`}>
                  {t('copied')}
                </span>
              )}
            </span>
          </span>
        </div>
        {showQr && !preview && (
          <div className={`mt-4 flex flex-col items-center gap-3 border-t pt-5 text-center ${skin.bar}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrCodeFor(`https://${typeof window !== 'undefined' ? window.location.host : siteHost}/${profile.username}`)} alt={t('qr')} width={148} height={148} className="rounded-xl border" />
            <a href={qrCodeFor(`https://${typeof window !== 'undefined' ? window.location.host : siteHost}/${profile.username}`, 512)} download={`${profile.username}-pexiloq-qr.png`} target="_blank" rel="noreferrer" className="text-xs font-medium underline underline-offset-4" style={{ color: profile.accentColor }}>{t('downloadQr')}</a>
          </div>
        )}
        <div className={`px-2 pb-6 pt-7 sm:px-6 ${isNameCard ? 'text-left sm:flex sm:items-start sm:gap-8' : 'text-center'} ${profile.coverImageURL ? '-mt-7' : ''}`}>
          <div className={isNameCard ? 'sm:w-64 sm:shrink-0 sm:text-left text-center' : ''}>
            {profile.showAvatar && (
              <div
                className={`${isNameCard ? 'mx-auto sm:mx-0' : 'mx-auto'} ${profile.coverImageURL ? '-mt-3' : ''} relative grid size-22 place-items-center overflow-hidden text-xl font-medium ${dark ? 'bg-white/10 text-[#f5f5f2]' : 'bg-secondary text-[#151515]'} ${avatarShapeClass[profile.avatarShape]} ${profile.avatarAnimation === 'pulse' ? 'pexiloq-avatar-pulse' : ''} ${profile.avatarAnimation === 'spin' ? 'pexiloq-avatar-spin' : ''} ${profile.avatarAnimation === 'glow' ? 'pexiloq-avatar-glow' : ''}`}
                style={{
                  ...(profile.avatarRing ? { outline: `3px solid ${profile.accentColor}`, outlineOffset: 2 } : undefined),
                  boxShadow: profile.coverImageURL ? `0 4px 16px rgba(0,0,0,0.18)` : undefined,
                  ...(profile.avatarAnimation === 'spin' || profile.avatarAnimation === 'glow' ? ({ '--pexiloq-avatar-ring-color': profile.accentColor } as React.CSSProperties) : undefined),
                }}
              >
                {profile.photoURL ? <CardImg src={profile.photoURL} alt={profile.displayName} className={`size-full ${avatarShapeClass[profile.avatarShape]}`} /> : profile.displayName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <h1 className={`${profile.showAvatar ? 'mt-5' : ''} flex items-center gap-1.5 text-[1.85rem] font-medium leading-[1.15] tracking-[-0.04em] ${font} ${isNameCard ? '' : 'justify-center'}`}>
              <span className="min-w-0 truncate">{profile.displayName}</span>
              {profile.showVerifiedBadge && (
                <span aria-label={t('verifiedBadge')} title={t('verifiedBadge')} className="inline-grid size-5 shrink-0 place-items-center rounded-full text-white" style={{ backgroundColor: profile.accentColor }}>
                  <Check className="size-3" strokeWidth={3} />
                </span>
              )}
            </h1>
            {profile.headline && <p className={`mt-1.5 text-sm font-medium ${skin.sub}`}>{profile.headline}</p>}
            {profile.bio && <p className={`mt-4 text-sm leading-6 ${skin.sub} ${isNameCard ? 'sm:max-w-none' : 'mx-auto max-w-sm'}`}>{profile.bio}</p>}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-medium underline decoration-current/30 underline-offset-4 transition hover:decoration-current/70" style={{ color: profile.accentColor }}>
                {profile.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>
            )}
            {Object.entries(profile.socials || {}).filter(([, v]) => v).length > 0 && (
              <div className={`mt-5 flex flex-wrap items-center gap-2 ${isNameCard ? 'justify-center sm:justify-start' : 'justify-center'}`}>
                {socialPlatforms.filter((p) => profile.socials?.[p]).map((p) => {
                  const value = profile.socials![p]!
                  const href = socialHref(p, value, profile.twitterIcon)
                  return (
                    <a
                      key={p}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={socialMeta[p].label}
                      onClick={() => onTrack?.('socials', p)}
                      className={`grid size-11 min-h-[44px] min-w-[44px] place-items-center rounded-full transition duration-200 hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 ${socialFilled ? '' : `border ${skin.bar}`}`}
                      style={socialFilled ? { backgroundColor: profile.accentColor, color: '#ffffff' } : undefined}
                    >
                      <SocialGlyph platform={p} twitterIcon={profile.twitterIcon} className="size-4" />
                    </a>
                  )
                })}
              </div>
            )}
          </div>
          <div className={isNameCard ? 'mt-8 min-w-0 flex-1 sm:mt-0' : ''}>
            {sectionOrder.map((key) => <div key={key}>{sections[key]}</div>)}
          </div>
        </div>
        {profile.showBadge && <div className={`mt-2 border-t pt-4 text-center text-[10px] opacity-70 ${skin.bar} ${skin.sub}`}>{t('made')} <span className={`font-semibold ${dark ? 'text-[#f5f5f2]' : 'text-[#151515]'}`}>pexiloq</span></div>}
      </div>
    </div>
  )
}
