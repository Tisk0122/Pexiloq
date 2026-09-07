import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site'
import { listPublicUsernames } from '@/lib/firebase-server'

export const revalidate = 3600 // refresh the profile list at most once an hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/signup`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteUrl}/login`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${siteUrl}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${siteUrl}/terms`, changeFrequency: 'yearly', priority: 0.2 },
  ]

  // Best-effort: if Firebase isn't configured or the read fails, this
  // resolves to [] and the sitemap simply falls back to the static routes
  // above rather than failing to build.
  const usernames = await listPublicUsernames()
  const profileRoutes: MetadataRoute.Sitemap = usernames.map((username) => ({
    url: `${siteUrl}/${username}`,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticRoutes, ...profileRoutes]
}
