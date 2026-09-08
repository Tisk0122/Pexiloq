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
// Bare host (no protocol) derived from the same siteUrl, e.g. "pexiloq.vercel.app".
// Use this instead of hardcoding the domain anywhere it's shown to users (share
// labels, QR codes, copy-link buttons, OG image text) so a future domain change
// only ever has to happen in one place — see git history for the last time the
// domain moved and every hardcoded copy of it had to be tracked down by hand.
export const siteHost = siteUrl.replace(/^https?:\/\//, '')
export const siteName = 'Pexiloq'
export const defaultTitle = 'Pexiloq — Everything you share, in one place.'
export const defaultDescription = 'Create a beautiful personal home for your links, projects, and everything that represents you.'
export const defaultOgImage = '/ogp.png'
