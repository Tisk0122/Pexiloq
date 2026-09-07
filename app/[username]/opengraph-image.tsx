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
  } catch (err) {
    console.error('[og-image] logoDataUri failed:', err)
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
    const contentType = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
    // satori/resvg (the renderer behind ImageResponse) can only decode PNG,
    // JPEG, GIF, and SVG. Anything else it's handed — WebP and BMP are the
    // common real-world cases, since browsers/CDNs auto-convert uploads to
    // WebP by default — throws deep inside its Rust image decoder *while
    // the response body is being streamed*, not while ImageResponse is
    // constructed. That means the route's own try/catch around
    // `new ImageResponse(...)` never sees it: Next.js reports it as an
    // opaque "failed to pipe response" / "is not iterable" error with no
    // usable stack trace, and the request 500s. Filtering to formats we
    // know satori can actually decode keeps an unsupported avatar/cover
    // format a harmless "no image" fallback instead of a crash.
    if (!['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml'].includes(contentType)) return null
    const buffer = await res.arrayBuffer()
    if (buffer.byteLength === 0) return null
    return `data:${contentType};base64,${Buffer.from(buffer).toString('base64')}`
  } catch (err) {
    console.error('[og-image] safeImageDataUri failed:', url, err)
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
// profile's text and load a matching font to cover them.
//
// These fonts used to be downloaded from Google Fonts on every cold request
// (CSS lookup, then the actual font file — two chained network calls, each
// with its own timeout). That round trip to a third-party host was the real
// cause of missing OG image previews on Discord/Slack/etc: even when every
// individual fetch "degraded gracefully" on failure, the *combined* latency
// of a Firestore read plus multiple sequential font/image fetches routinely
// pushed total response time past what link-unfurling crawlers wait for
// (Discord's embed fetcher gives up in well under 5 seconds), so the crawler
// simply gave up and showed no image at all — with nothing logged as an
// error on our side, because nothing actually threw.
//
// Fonts are static assets that don't change per-request, so there's no
// reason to fetch them over the network at all: they're bundled directly
// into the deployment and read from local disk, which takes single-digit
// milliseconds instead of seconds and has no external failure mode.
const SCRIPT_FONT_FILE: Record<string, string> = {
  ja: 'NotoSansJP-SemiBold.ttf',
  ko: 'NotoSansKR-SemiBold.ttf',
  zh: 'NotoSansSC-SemiBold.ttf',
  hi: 'NotoSansDevanagari-SemiBold.ttf',
}
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

type FontEntry = { name: string; data: Buffer; weight: 600; style: 'normal' }

const FONTS_DIR = path.join(process.cwd(), 'assets', 'fonts')

// Local disk reads are fast and reliable, but the file is still read once per
// cold serverless instance rather than per-request: the module stays warm
// across requests on the same instance, so cache each family's bytes in
// memory the first time it's needed.
const fontCache = new Map<string, Promise<FontEntry | null>>()

function getFont(family: string, filename: string): Promise<FontEntry | null> {
  const cached = fontCache.get(family)
  if (cached) return cached
  const promise = readFile(path.join(FONTS_DIR, filename))
    .then((data) => ({ name: family, data, weight: 600 as const, style: 'normal' as const }))
    .catch((err) => {
      console.error('[og-image] getFont failed:', family, filename, err)
      return null
    })
  fontCache.set(family, promise)
  return promise
}

async function loadFonts(text: string): Promise<{ fonts: FontEntry[]; families: string[] }> {
  const scripts = detectScripts(text)
  const entries = await Promise.all([
    getFont('Noto Sans', 'NotoSans-SemiBold.ttf'),
    ...scripts.map((script) => getFont(SCRIPT_FONT_FAMILY[script], SCRIPT_FONT_FILE[script])),
  ])
  const fonts = entries.filter((f): f is FontEntry => f !== null)
  const families = ['Noto Sans', ...scripts.map((script) => SCRIPT_FONT_FAMILY[script])]
  return { fonts, families }
}

// Hard ceiling on the whole data-gathering phase. Font loading is now a fast,
// reliable local disk read (see above), but the Firestore profile lookup and
// the user-supplied avatar/cover image URLs are still genuine network calls
// that can hang or run slow — this keeps their combined worst case bounded
// well inside what link-unfurling crawlers and the hosting platform allow,
// instead of two independent budgets that could previously add up to several
// seconds each.
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

  // Fonts are a local disk read (fast, no external failure mode) so they're
  // awaited on their own rather than racing against the network-bound image
  // fetches below — there's no reason to ever fall back to the "no fonts"
  // case just because a user's avatar host was slow.
  const { fonts, families } = await loadFonts(allText)

  const [logo, cover, avatar] = await withOverallTimeout(
    Promise.all([
      logoDataUri(),
      safeImageDataUri(meta?.coverImageURL),
      safeImageDataUri(meta?.showAvatar === false ? null : meta?.photoURL),
    ]),
    2200,
    [null, null, null] as [string | null, string | null, string | null]
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
    // ImageResponse's constructor never throws by itself — satori/resvg do
    // their actual rendering lazily, while the response body is streamed
    // out by Next.js. That means a decode/layout failure surfaces *after*
    // this function has already returned, inside Next's own internal
    // pipe-to-response code, completely outside any try/catch we write here
    // — it shows up as an opaque "failed to pipe response" 500 with no
    // usable stack trace on our side. Forcing full consumption of the body
    // ourselves (via arrayBuffer()) moves that failure back inside this
    // try/catch, so we can actually fall back instead of 500ing.
    const rendered = new ImageResponse(image, { ...size, fonts: fonts.length ? fonts : undefined })
    const bytes = await rendered.arrayBuffer()
    return new Response(bytes, { headers: rendered.headers })
  } catch (err) {
    // Last-resort fallback: if rendering still fails for some unforeseen
    // reason, still return a valid, branded PNG instead of a 500 — a plain
    // preview beats social platforms showing no image or a stale one.
    console.error('[og-image] ImageResponse render failed, falling back:', err)
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
