import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { loadPublicProfileMeta } from '@/lib/firebase-server'

export const runtime = 'nodejs'
export const revalidate = 300 // regenerate at most every 5 minutes per profile
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Pexiloq profile preview'

const BRAND_BG = '#f5f5f2'
const BRAND_INK = '#171717'
const BRAND_MUTED = '#686864'

async function logoDataUri() {
  try {
    const file = await readFile(path.join(process.cwd(), 'public', 'Pexiloq_Icon.png'))
    return `data:image/png;base64,${file.toString('base64')}`
  } catch {
    return null
  }
}

function initialsOf(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('') || '?'
}

// Avatar/cover images are user-supplied (uploaded to R2, or an arbitrary URL
// someone pasted in "paste an image URL instead"). Handing that URL straight
// to satori's own <img> loader is fragile: if the host is slow, offline,
// returns a non-2xx status, or isn't actually an image, satori's fetch throws
// and takes the *entire* OG image render down with it — which is what was
// producing the missing/blank preview images. Fetching and validating the
// bytes ourselves means a broken image degrades to "no image" (falls back to
// the initials/gradient avatar, and no cover) instead of crashing the route.
async function safeImageDataUri(url: string | undefined | null): Promise<string | null> {
  if (!url) return null
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 1800)
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) return null
    const buffer = await res.arrayBuffer()
    if (buffer.byteLength === 0) return null
    return `data:${contentType};base64,${Buffer.from(buffer).toString('base64')}`
  } catch {
    return null
  }
}

// Satori (the renderer behind next/og's ImageResponse) ships with a minimal
// built-in font that only covers basic Latin. Any Japanese, Korean, Chinese,
// Devanagari, or even ordinary typographic characters (curly quotes, en/em
// dashes) that aren't in that built-in set render as blank "tofu" boxes —
// exactly the corrupted-looking glyph that used to show up in profile
// headlines. Pexiloq supports nine languages and free-form display
// names/headlines, so we detect which scripts actually appear in this
// profile's text and load real fonts to cover them, subsetted to just the
// characters used (via the `text` param) to keep each request tiny.
const SCRIPT_FONT_FAMILY: Record<string, string> = {
  ja: 'Noto Sans JP',
  ko: 'Noto Sans KR',
  zh: 'Noto Sans SC',
  hi: 'Noto Sans Devanagari',
}

function detectScripts(text: string): string[] {
  const scripts: string[] = []
  // Hiragana, Katakana, Kanji (CJK Unified Ideographs) -> Japanese font
  if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(text)) scripts.push('ja')
  if (/[\uac00-\ud7a3]/.test(text)) scripts.push('ko')
  if (/[\u4e00-\u9fff]/.test(text) && !scripts.includes('ja')) scripts.push('zh')
  if (/[\u0900-\u097f]/.test(text)) scripts.push('hi')
  return scripts
}

// Google Fonts serves woff/woff2 by default to modern browsers. Satori only
// supports ttf/otf. An older Safari User-Agent reliably forces Google Fonts to
// return format('truetype') font files.
const LEGACY_UA = 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1'

// A plain fetch() in Node has NO timeout by default. A dynamic OG image route
// that hangs waiting on a third-party font host (blocked egress, slow DNS,
// Google Fonts having a bad moment) will stall until the platform's own
// function timeout kills it — which looks to the requester (Discord, Slack,
// Twitter…) exactly like the image failed to load, because it never got a
// response in time. Every network call in this file is bounded so a slow or
// unreachable font host degrades to "render without that font" instead of
// taking the whole preview down with it.
async function fetchWithTimeout(url: string, ms: number, init?: RequestInit): Promise<Response | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ms)
  try {
    const res = await fetch(url, { ...init, signal: controller.signal })
    return res.ok ? res : null
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

async function loadGoogleFont(family: string, text: string): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@600&text=${encodeURIComponent(text)}`
    const cssRes = await fetchWithTimeout(cssUrl, 1500, { headers: { 'User-Agent': LEGACY_UA } })
    const css = cssRes ? await cssRes.text() : null
    if (!css) return null
    const fontUrl = css.match(/url\(([^)]+)\)\s*format\('truetype'\)/)?.[1] ?? css.match(/url\(([^)]+)\)/)?.[1]
    if (!fontUrl) return null
    const fontRes = await fetchWithTimeout(fontUrl, 1500)
    if (!fontRes) return null
    return await fontRes.arrayBuffer()
  } catch {
    return null
  }
}

type FontEntry = { name: string; data: ArrayBuffer; weight: 600; style: 'normal' }

// Fonts don't depend on request data beyond which scripts a profile's text
// happens to use, and this module stays warm across requests on the same
// serverless instance — so cache each family's bytes in memory the first
// time it's needed instead of re-downloading it on every single OG image
// request for that instance's lifetime.
const fontCache = new Map<string, Promise<FontEntry | null>>()

function getFont(family: string, text: string): Promise<FontEntry | null> {
  // Sort and deduplicate characters in `text` to maximize cache hits while
  // ensuring every required glyph is included in the Google Fonts subset.
  const uniqueChars = Array.from(new Set(text)).sort().join('')
  const cacheKey = `${family}:${uniqueChars}`
  const cached = fontCache.get(cacheKey)
  if (cached) return cached
  const promise = loadGoogleFont(family, uniqueChars).then((data) => (data ? { name: family, data, weight: 600 as const, style: 'normal' as const } : null))
  fontCache.set(cacheKey, promise)
  return promise
}

// Belt-and-suspenders: even with per-fetch timeouts above, cap the *entire*
// font-loading step so nothing about it can ever meaningfully delay the
// image response — worst case we just render with the families that made it
// back in time and fall back to the default font for the rest.
async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([promise, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))])
}

async function loadFonts(text: string): Promise<{ fonts: FontEntry[]; families: string[] }> {
  const families = ['Noto Sans', ...detectScripts(text).map((script) => SCRIPT_FONT_FAMILY[script])]
  const fonts = await withTimeout(
    Promise.all(families.map((family) => getFont(family, text))).then((list) => list.filter((f): f is FontEntry => f !== null)),
    1800,
    []
  )
  return { fonts, families }
}

// Hard ceiling on the whole data-gathering phase (profile lookup + cover/avatar
// fetch + font loading). Individual steps already have their own timeouts, but
// nothing previously bounded their *sum* — Firestore could take up to 4s and the
// font/image fetches up to another ~4s after it, so a route that "degraded
// gracefully" at every step could still take ~8s end to end. Social-media link
// crawlers (Discord, Slack, Twitter/X) generally give up well before that and
// show no preview image at all, which is what was happening here even though no
// individual request ever actually failed. Capping the combined phase keeps the
// whole route comfortably inside what crawlers and the hosting platform allow.
async function withOverallTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([promise, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))])
}

export default async function OpengraphImage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const meta = await withOverallTimeout(loadPublicProfileMeta(username), 2500, null)

  const displayName = meta?.displayName?.trim() || username
  const headline = meta?.headline?.trim() || meta?.bio?.trim() || ''
  const accent = meta?.accentColor || BRAND_INK
  const coverFit = meta?.coverImageFit || 'cover'
  const coverPositionX = typeof meta?.coverImagePositionX === 'number' ? meta.coverImagePositionX : 50
  const coverPositionY = typeof meta?.coverImagePositionY === 'number' ? meta.coverImagePositionY : 50
  const avatarRadius = meta?.avatarShape === 'square' ? '0' : meta?.avatarShape === 'rounded' ? '40px' : '9999px'
  const initials = initialsOf(displayName)

  const allText = `${displayName} @${username} ${headline} pexiloq.vercel.app ${initials}`

  const [logo, cover, avatar, { fonts, families }] = await withOverallTimeout(
    Promise.all([
      logoDataUri(),
      safeImageDataUri(meta?.coverImageURL),
      safeImageDataUri(meta?.showAvatar === false ? null : meta?.photoURL),
      loadFonts(allText),
    ]),
    2200,
    [null, null, null, { fonts: [], families: ['Noto Sans'] }] as [string | null, string | null, string | null, { fonts: FontEntry[]; families: string[] }]
  )

  const fontFamilyStack = [...families, 'sans-serif'].join(', ')

  const image = (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        backgroundColor: BRAND_BG,
        fontFamily: fontFamilyStack,
      }}
    >
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" width={1200} height={630} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: coverFit, objectPosition: `${coverPositionX}% ${coverPositionY}%` }} />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            background: `linear-gradient(135deg, ${accent}22 0%, ${BRAND_BG} 55%)`,
          }}
        />
      )}
      {cover && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            background: 'linear-gradient(0deg, rgba(15,15,13,0.82) 0%, rgba(15,15,13,0.15) 55%, rgba(15,15,13,0.35) 100%)',
          }}
        />
      )}

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', flex: 1, padding: '64px 72px', justifyContent: 'flex-end' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt=""
              width={128}
              height={128}
              style={{
                width: 128,
                height: 128,
                borderRadius: avatarRadius,
                objectFit: 'cover',
                border: `4px solid ${cover ? 'rgba(255,255,255,0.9)' : BRAND_BG}`,
                boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
              }}
            />
          ) : (
            <div
              style={{
                width: 128,
                height: 128,
                borderRadius: avatarRadius,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 48,
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: accent,
                border: `4px solid ${cover ? 'rgba(255,255,255,0.9)' : BRAND_BG}`,
              }}
            >
              {initials}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 880 }}>
            <div
              style={{
                fontSize: 56,
                fontWeight: 600,
                lineHeight: 1.05,
                letterSpacing: '-0.03em',
                color: cover ? '#ffffff' : BRAND_INK,
              }}
            >
              {displayName}
            </div>
            <div style={{ display: 'flex', marginTop: 10, fontSize: 26, fontWeight: 600, color: cover ? 'rgba(255,255,255,0.82)' : BRAND_MUTED }}>
              @{username}
            </div>
            {headline && (
              <div
                style={{
                  display: 'flex',
                  marginTop: 18,
                  fontSize: 28,
                  fontWeight: 600,
                  lineHeight: 1.4,
                  color: cover ? 'rgba(255,255,255,0.92)' : BRAND_INK,
                  maxWidth: 820,
                }}
              >
                {headline}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 48 }}>
          {logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" width={40} height={40} style={{ width: 40, height: 40, borderRadius: 10 }} />
          )}
          <div style={{ display: 'flex', fontSize: 24, fontWeight: 600, color: cover ? 'rgba(255,255,255,0.92)' : BRAND_INK, letterSpacing: '-0.02em' }}>
            pexiloq.vercel.app
          </div>
        </div>
      </div>
    </div>
  )

  try {
    return new ImageResponse(image, { ...size, fonts: fonts.length ? fonts : undefined })
  } catch {
    // Last-resort fallback: if rendering still fails for some unforeseen
    // reason, still return a valid, branded PNG instead of a 500 — a plain
    // preview beats social platforms showing no image or a stale one.
    return new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND_BG }}>
          <div style={{ fontSize: 56, fontWeight: 600, color: BRAND_INK }}>{displayName}</div>
        </div>
      ),
      { ...size }
    )
  }
}
