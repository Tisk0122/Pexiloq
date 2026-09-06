import { NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getS3, publicUrlFor, r2Config } from '@/lib/r2'

export const runtime = 'nodejs'

export const maxBytes = 10 * 1024 * 1024

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg', 'heic']

export async function GET() {
  return NextResponse.json({ configured: r2Config().configured, maxBytes })
}

export async function POST(req: Request) {
  if (!r2Config().configured) {
    return NextResponse.json({ error: 'R2 is not configured. Set the R2_* environment variables.' }, { status: 503 })
  }
  const body = await req.json().catch(() => null)
  const userId = body?.userId
  const contentType: string = body?.contentType || ''
  const size: number = body?.size
  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ error: 'Missing userId.' }, { status: 400 })
  }
  if (!contentType.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image files are allowed.' }, { status: 400 })
  }
  if (typeof size !== 'number' || !Number.isFinite(size) || size <= 0 || size > maxBytes) {
    return NextResponse.json({ error: `File must be between 1 byte and ${Math.floor(maxBytes / 1024 / 1024)} MB.` }, { status: 400 })
  }
  const ext = (contentType.split('/')[1] || 'png').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'png'
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json({ error: `Unsupported image type: ${ext}` }, { status: 400 })
  }
  const bucket = r2Config().bucket!
  const { accountId } = r2Config()
  const key = `users/${userId.replace(/[^a-zA-Z0-9_-]/g, '')}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`
  const s3 = getS3()
  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
    { expiresIn: 300, signableHeaders: new Set(['content-type', 'cache-control']) },
  )
  return NextResponse.json({ uploadUrl, publicUrl: publicUrlFor(key), key, bucket, accountId })
}