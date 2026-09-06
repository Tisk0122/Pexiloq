import { readFileSync, existsSync } from 'node:fs'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'

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
const required = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET', 'R2_PUBLIC_URL']
const missing = required.filter((key) => !env[key])
if (missing.length) {
  console.error(`Missing env vars: ${missing.join(', ')}`)
  process.exit(1)
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
})

try {
  const result = await s3.send(new ListObjectsV2Command({ Bucket: env.R2_BUCKET, MaxKeys: 5 }))
  const count = result.Contents?.length ?? 0
  console.log(`OK — bucket "${env.R2_BUCKET}" reachable. Objects found: ${count}`)
  console.log(`Public URL base: ${env.R2_PUBLIC_URL}`)
  console.log(`Example object URL: ${env.R2_PUBLIC_URL}/users/<uid>/<file>.png`)
} catch (err) {
  console.error(`FAIL — ${err.message}`)
  process.exit(1)
}