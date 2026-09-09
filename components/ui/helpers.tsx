import React from 'react'
import type { SocialPlatform, TwitterIcon } from '../types'

export function faviconFor(url: string) {
  try {
    return `https://www.google.com/s2/favicons?sz=64&domain=${new URL(url).hostname}`
  } catch {
    return ''
  }
}

export function contrastColor(hex: string): string {
  const clean = hex.replace('#', '')
  if (clean.length !== 6 && clean.length !== 3) return '#ffffff'
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#151515' : '#ffffff'
}

export function qrCodeFor(url: string, size = 220) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(url)}`
}

export const socialMeta: Record<SocialPlatform, { label: string; placeholder: string; prefix?: string }> = {
  twitter: { label: 'X / Twitter', placeholder: 'yourhandle' },
  facebook: { label: 'Facebook', placeholder: 'yourname', prefix: 'https://facebook.com/' },
  instagram: { label: 'Instagram', placeholder: 'yourhandle', prefix: 'https://instagram.com/' },
  github: { label: 'GitHub', placeholder: 'yourhandle', prefix: 'https://github.com/' },
  linkedin: { label: 'LinkedIn', placeholder: 'yourhandle', prefix: 'https://linkedin.com/in/' },
  youtube: { label: 'YouTube', placeholder: '@yourchannel', prefix: 'https://youtube.com/' },
  tiktok: { label: 'TikTok', placeholder: '@yourhandle', prefix: 'https://tiktok.com/' },
  telegram: { label: 'Telegram', placeholder: 'yourhandle', prefix: 'https://t.me/' },
  whatsapp: { label: 'WhatsApp', placeholder: '+1 555 000 0000', prefix: 'https://wa.me/' },
  email: { label: 'Email', placeholder: 'you@example.com', prefix: 'mailto:' },
}

const TWITTER_X_PATH = 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z'
const TWITTER_BIRD_PATH = 'M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z'
const FACEBOOK_PATH = 'M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0 0 14.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.355H7.332v3.209h2.753v8.202h3.312z'
const TELEGRAM_PATH = 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z'
const WHATSAPP_PATH = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z'

export function SocialGlyph({ platform, twitterIcon = 'x', className = 'size-4' }: { platform: SocialPlatform; twitterIcon?: TwitterIcon; className?: string }) {
  const commonP = { className, 'aria-hidden': true as const }
  if (platform === 'twitter' && twitterIcon === 'bird') {
    return <svg viewBox="0 0 512 512" {...commonP}><path d={TWITTER_BIRD_PATH} fill="currentColor" /></svg>
  }
  if (platform === 'twitter') {
    return <svg viewBox="0 0 24 24" {...commonP}><path d={TWITTER_X_PATH} fill="currentColor" /></svg>
  }
  if (platform === 'facebook' || platform === 'telegram' || platform === 'whatsapp') {
    return <svg viewBox="0 0 24 24" {...commonP}><path d={platform === 'facebook' ? FACEBOOK_PATH : platform === 'telegram' ? TELEGRAM_PATH : WHATSAPP_PATH} fill="currentColor" /></svg>
  }
  const paths: Partial<Record<SocialPlatform, React.ReactNode>> = {
    instagram: <><rect x="3.5" y="3.5" width="17" height="17" rx="5" strokeWidth={1.7} /><circle cx="12" cy="12" r="4" strokeWidth={1.7} /><circle cx="17" cy="7" r="1.1" fill="currentColor" stroke="none" /></>,
    github: <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.1.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.93 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.53 9.53 0 0 1 5 0c1.9-1.29 2.74-1.02 2.74-1.02.56 1.38.21 2.4.1 2.65.65.7 1.03 1.59 1.03 2.68 0 3.83-2.34 4.68-4.57 4.92.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" strokeWidth={0.4} fill="currentColor" />,
    linkedin: <><rect x="3.5" y="3.5" width="17" height="17" rx="3" strokeWidth={1.7} /><line x1="7.5" y1="10" x2="7.5" y2="16.5" strokeWidth={1.7} strokeLinecap="round" /><circle cx="7.5" cy="7" r="1.1" fill="currentColor" stroke="none" /><path d="M11 16.5V10M11 12.7c0-1.5 1.2-2.7 2.7-2.7 1.5 0 2.3 1 2.3 2.9v3.6" strokeWidth={1.7} strokeLinecap="round" /></>,
    youtube: <><rect x="2.5" y="5.5" width="19" height="13" rx="4" strokeWidth={1.7} /><path d="M10.5 9.5l5 2.5-5 2.5v-5Z" fill="currentColor" stroke="none" /></>,
    tiktok: <path d="M14 3v10.2a2.8 2.8 0 1 1-2.2-2.74M14 3c.3 2 1.7 3.6 3.8 3.9M14 6.9c.9.8 2 1.3 3.2 1.4" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />,
    email: <><rect x="3" y="5.5" width="18" height="13" rx="2.5" strokeWidth={1.7} /><path d="M4 7l8 6 8-6" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" /></>,
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...commonP}>{paths[platform]}</svg>
}

export function socialHref(platform: SocialPlatform, value: string, twitterIcon: TwitterIcon): string {
  if (value.startsWith('http')) return value
  if (platform === 'email') return value.includes('@') ? `mailto:${value}` : value
  if (platform === 'twitter') return `${twitterIcon === 'bird' ? 'https://twitter.com/' : 'https://x.com/'}${value.replace(/^@/, '')}`
  if (platform === 'whatsapp') return `https://wa.me/${value.replace(/[^0-9]/g, '')}`
  return `${socialMeta[platform].prefix}${value.replace(/^@/, '')}`
}
