import type { Metadata } from 'next'
import { PublicProfile } from '@/components/pexiloq-app'
import { loadPublicProfileMeta } from '@/lib/firebase-server'
import { siteName } from '@/lib/site'

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) { const { username } = await params; return <PublicProfile username={username} /> }

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params
  const meta = await loadPublicProfileMeta(username)
  const isVisible = Boolean(meta) && meta?.isPublic !== false

  const displayName = meta?.displayName?.trim() || username
  const description = meta?.headline?.trim() || meta?.bio?.trim() || `A personal home for ${displayName}'s links, projects, and ideas.`
  const title = `${displayName} (@${username})`

  return {
    title,
    description,
    alternates: { canonical: `/${username}` },
    // Profiles that don't exist yet, or that the owner has kept private, should
    // never be indexed or show up in search results / social previews.
    robots: isVisible
      ? { index: true, follow: true }
      : { index: false, follow: false, googleBot: { index: false, follow: false } },
    openGraph: {
      type: 'profile',
      url: `/${username}`,
      siteName,
      title,
      description,
      // No images here on purpose — Next.js picks these up automatically from
      // opengraph-image.tsx in this route segment, which renders the user's
      // actual banner + avatar. Setting images here would override that.
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}
