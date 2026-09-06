import { S3Client } from '@aws-sdk/client-s3'

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