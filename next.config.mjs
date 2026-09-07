/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner', 'aws-crt'],
  // The [username]/opengraph-image route reads local TTF files from
  // assets/fonts at request time via node:fs. Next's build-time file tracer
  // only bundles files it can see being imported/required directly, and it
  // doesn't follow the runtime path.join(process.cwd(), 'assets', 'fonts', …)
  // construction used there — so without this, the fonts would work in local
  // dev but silently go missing from the deployed serverless function,
  // making every profile with non-Latin text (or any request, once the font
  // read throws) fall back to broken/missing glyphs in production only.
  outputFileTracingIncludes: {
    '/[username]/opengraph-image': ['./assets/fonts/**'],
  },
}

export default nextConfig
