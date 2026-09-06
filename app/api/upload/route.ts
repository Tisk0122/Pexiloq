import { NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { deleteAllObjectsForUser, deleteObject, getS3, keyFromPublicUrl, publicUrlFor, r2Config } from '@/lib/r2'

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

// Removes images from R2 so replaced or discarded uploads (old avatar, old cover image,
// a deleted link/project thumbnail, or an entire deleted account) never linger in the bucket.
export async function DELETE(req: Request) {
  if (!r2Config().configured) {
    return NextResponse.json({ error: 'R2 is not configured. Set the R2_* environment variables.' }, { status: 503 })
  }
  const body = await req.json().catch(() => null)
  const userId = body?.userId
  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ error: 'Missing userId.' }, { status: 400 })
  }
  const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '')
  try {
    if (body?.purgeAll) {
      await deleteAllObjectsForUser(safeUserId)
      return NextResponse.json({ ok: true })
    }
    const url: string = body?.url || ''
    const key = keyFromPublicUrl(url)
    // A missing/foreign key means the URL isn't one of our R2 objects (e.g. an externally
    // hosted image the user pasted a link to) or doesn't belong to this user — no-op rather
    // than error, since there's nothing unsafe or wrong about that from the client's view.
    if (!key || !key.startsWith(`users/${safeUserId}/`)) {
      return NextResponse.json({ ok: true, skipped: true })
    }
    await deleteObject(key)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Could not delete the image.' }, { status: 500 })
  }
}