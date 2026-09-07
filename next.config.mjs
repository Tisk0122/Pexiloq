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
  // The metadata-image machinery (opengraph-image.tsx) makes Next statically
  // trace next/dist/server/image-optimizer.js, which pulls in `sharp` even
  // though images.unoptimized:true means it's never actually called. That
  // drags in three redundant platform builds of libvips (~45MB total) into
  // this route's serverless function. Vercel's Node.js runtime is glibc
  // linux-x64, so the musl and wasm32 builds are dead weight — excluding
  // them cuts ~27MB from this function without touching any code path that
  // actually runs.
  outputFileTracingExcludes: {
    '/[username]/opengraph-image': [
      './node_modules/@img/sharp-libvips-linuxmusl-x64/**',
      './node_modules/@img/sharp-linuxmusl-x64/**',
      './node_modules/@img/sharp-wasm32/**',
    ],
    '/[username]': [
      './node_modules/@img/sharp-libvips-linuxmusl-x64/**',
      './node_modules/@img/sharp-linuxmusl-x64/**',
      './node_modules/@img/sharp-wasm32/**',
    ],
  },
}

export default nextConfig
