/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner', 'aws-crt'],
  // The [username]/opengraph-image route reads two things from local disk at
  // request time via node:fs: the local TTF font files, and the Pexiloq logo
  // PNG from /public. Next's build-time file tracer only bundles files it
  // can see being imported/required directly, and it doesn't follow the
  // runtime path.join(process.cwd(), …) construction used for either of
  // these — so without explicitly listing them, they work in local dev but
  // can silently go missing from the deployed serverless function: fonts
  // missing means broken/missing glyphs, the logo missing means it just
  // never renders. (The logo happened to get swept in anyway by an
  // unrelated static reference elsewhere in the app, which is exactly the
  // kind of incidental, easy-to-lose behavior this makes explicit instead.)
  outputFileTracingIncludes: {
    '/[username]/opengraph-image': ['./assets/fonts/**', './public/Pexiloq_Icon.png'],
  },
  // The metadata-image machinery (opengraph-image.tsx) makes Next statically
  // trace next/dist/server/image-optimizer.js, which pulls in `sharp` even
  // though images.unoptimized:true means Next itself never actually calls
  // it. We now use sharp ourselves in that same route (to decode/normalize
  // user-supplied avatar and cover images), so the package is genuinely
  // needed here — but it still ships three redundant platform builds of
  // libvips (~45MB total). Vercel's Node.js runtime is glibc linux-x64, so
  // the musl and wasm32 builds are dead weight regardless of who's calling
  // sharp — excluding them cuts ~27MB from this function without touching
  // the one platform build that actually runs.
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
