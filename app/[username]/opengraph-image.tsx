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

export default async function OpengraphImage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const [meta, logo] = await Promise.all([loadPublicProfileMeta(username), logoDataUri()])

  const displayName = meta?.displayName?.trim() || username
  const headline = meta?.headline?.trim() || meta?.bio?.trim() || ''
  const accent = meta?.accentColor || BRAND_INK
  const cover = meta?.coverImageURL || ''
  const avatar = meta?.showAvatar === false ? '' : meta?.photoURL || ''
  const avatarRadius = meta?.avatarShape === 'square' ? '0' : meta?.avatarShape === 'rounded' ? '40px' : '9999px'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          backgroundColor: BRAND_BG,
          fontFamily: 'sans-serif',
        }}
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" width={1200} height={630} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
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
                {initialsOf(displayName)}
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
              <div style={{ display: 'flex', marginTop: 10, fontSize: 26, color: cover ? 'rgba(255,255,255,0.82)' : BRAND_MUTED }}>
                @{username}
              </div>
              {headline && (
                <div
                  style={{
                    display: 'flex',
                    marginTop: 18,
                    fontSize: 28,
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
    ),
    { ...size }
  )
}
