import { S3Client, DeleteObjectCommand, DeleteObjectsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'

export function r2Config() {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucket = process.env.R2_BUCKET
  const publicUrl = process.env.R2_PUBLIC_URL
  const configured = Boolean(accountId && accessKeyId && secretAccessKey && bucket && publicUrl)
  return { accountId, accessKeyId, secretAccessKey, bucket, publicUrl, configured }
}

export function getS3() {
  const { accountId, accessKeyId, secretAccessKey } = r2Config()
  if (!accountId || !accessKeyId || !secretAccessKey) throw new Error('Cloudflare R2 is not configured')
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  })
}

export function publicUrlFor(key: string) {
  const { publicUrl } = r2Config()
  return `${(publicUrl || '').replace(/\/$/, '')}/${key}`
}

// Recovers the storage key from a public URL previously produced by publicUrlFor().
// Returns null when the URL doesn't belong to this bucket (e.g. an externally hosted
// image the user pasted a link to) so callers can safely no-op instead of deleting.
export function keyFromPublicUrl(url: string): string | null {
  const { publicUrl } = r2Config()
  if (!publicUrl || !url) return null
  const base = publicUrl.replace(/\/$/, '') + '/'
  if (!url.startsWith(base)) return null
  const key = url.slice(base.length)
  return key || null
}

export async function deleteObject(key: string) {
  const s3 = getS3()
  const bucket = r2Config().bucket!
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
}

// Deletes every object stored under a user's prefix (users/{userId}/...). Used when an
// account is deleted so orphaned avatars, cover images, link/project thumbnails, etc.
// never linger in the bucket.
export async function deleteAllObjectsForUser(userId: string) {
  const s3 = getS3()
  const bucket = r2Config().bucket!
  const prefix = `users/${userId.replace(/[^a-zA-Z0-9_-]/g, '')}/`
  let continuationToken: string | undefined
  do {
    const list = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: continuationToken }))
    const objects = (list.Contents || []).flatMap((o) => (o.Key ? [{ Key: o.Key }] : []))
    if (objects.length) await s3.send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: objects, Quiet: true } }))
    continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined
  } while (continuationToken)
}