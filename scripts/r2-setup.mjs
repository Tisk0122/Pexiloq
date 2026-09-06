import { readFileSync, existsSync } from 'node:fs'
import { S3Client, CreateBucketCommand, PutBucketCorsCommand, HeadBucketCommand } from '@aws-sdk/client-s3'

function loadEnv() {
  const env = { ...process.env }
  if (existsSync('.env')) {
    for (const line of readFileSync('.env', 'utf8').split('\n')) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (match && env[match[1]] === undefined) env[match[1]] = match[2].replace(/^["']|["']$/g, '')
    }
  }
  return env
}

const env = loadEnv()
const required = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET']
const missing = required.filter((key) => !env[key])
if (missing.length) {
  console.error(`Missing env vars: ${missing.join(', ')}`)
  console.error('Add them to your .env file, for example:')
  console.error('R2_ACCOUNT_ID=<cloudflare-account-id>')
  console.error('R2_ACCESS_KEY_ID=<r2-api-token-access-key-id>')
  console.error('R2_SECRET_ACCESS_KEY=<r2-api-token-secret-access-key>')
  console.error('R2_BUCKET=<your-bucket-name>')
  console.error('R2_PUBLIC_URL=<public-base-url, e.g. https://pub-xxxxxxxxxxxxxxx.r2.dev or a custom domain>')
  process.exit(1)
}

const { R2_ACCOUNT_ID: accountId, R2_ACCESS_KEY_ID: accessKeyId, R2_SECRET_ACCESS_KEY: secretAccessKey, R2_BUCKET: bucket, R2_PUBLIC_URL: publicUrl } = env

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
})

async function ensureBucket() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }))
    console.log(`Bucket "${bucket}" already exists.`)
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: bucket }))
    console.log(`Bucket "${bucket}" created.`)
  }
}

async function applyCors() {
  try {
    await s3.send(new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: {
        CORSRules: [{
          AllowedOrigins: ['*'],
          AllowedMethods: ['GET', 'PUT', 'POST', 'HEAD'],
          AllowedHeaders: ['*'],
          ExposeHeaders: ['ETag'],
          MaxAgeSeconds: 3600,
        }],
      },
    }))
    console.log('CORS rules applied (GET/PUT/HEAD allowed from any origin, ETag exposed).')
  } catch (err) {
    console.error('Could not apply CORS. Make sure this API token has "Admin Read & Write" permission for this bucket.')
    throw err
  }
}

async function main() {
  await ensureBucket()
  await applyCors()
  if (!publicUrl) {
    console.warn('---')
    console.warn('R2_PUBLIC_URL is not set. To serve images, enable public access on the bucket:')
    console.warn('1. Open R2 -> <bucket> -> Settings -> Public access -> Allow Access.') 
    console.warn('2. Use the "r2.dev" subdomain OR add a custom domain.')
    console.warn('3. Set R2_PUBLIC_URL in .env, e.g. R2_PUBLIC_URL=https://pub-xxxxxxxxxxxxxxx.r2.dev')
  } else {
    console.log(`Public URL base is ${publicUrl} — image URLs will look like ${publicUrl}/users/<uid>/<file>.png`)
  }
  console.log('Done. Run `npx tsc --noEmit && npm run build` to verify, then `npm run dev`.')
}

main().catch((err) => { console.error(err); process.exit(1) })