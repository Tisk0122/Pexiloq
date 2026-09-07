// Central place for the canonical site URL so metadataBase, sitemap.ts, robots.ts
// and the dynamic OG image routes all agree on the same absolute origin.
// NEXT_PUBLIC_SITE_URL lets preview/staging deployments (Vercel, etc.) override
// the production default without code changes.
function resolveSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL
  if (explicit) return explicit.replace(/\/$/, '')
  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl) return `https://${vercelUrl}`
  return 'https://pexiloq.vercel.app'
}

export const siteUrl = resolveSiteUrl()
export const siteName = 'Pexiloq'
export const defaultTitle = 'Pexiloq — Everything you share, in one place.'
export const defaultDescription = 'Create a beautiful personal home for your links, projects, and everything that represents you.'
export const defaultOgImage = '/ogp.png'
