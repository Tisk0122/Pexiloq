// Server-only helpers for reading PUBLIC profile data during SSR — used by
// generateMetadata, opengraph-image.tsx and sitemap.ts. Deliberately does not
// import lib/firebase.ts (which is 'use client' and initializes Auth) since
// this only ever needs read-only Firestore access, and Firestore rules already
// allow anonymous reads of the `users` collection.
import { firebaseApp, firebaseEnabled } from '@/lib/firebase-app'

export type PublicProfileMeta = {
  uid?: string
  username: string
  displayName?: string
  headline?: string
  bio?: string
  photoURL?: string
  coverImageURL?: string
  accentColor?: string
  avatarShape?: 'circle' | 'rounded' | 'square'
  showAvatar?: boolean
  isPublic?: boolean
}

async function getDb() {
  if (!firebaseEnabled || !firebaseApp) return null
  const { getFirestore } = await import('firebase/firestore')
  return getFirestore(firebaseApp)
}

// Cache the Firestore lookup for a short window so a burst of crawler/social
// preview requests (metadata + OG image + twitter image, which all need the
// same data) doesn't cost multiple Firestore reads per profile view.
export const loadPublicProfileMeta = (() => {
  const cache = new Map<string, { at: number; data: PublicProfileMeta | null }>()
  const TTL = 60_000

  return async function loadPublicProfileMeta(username: string): Promise<PublicProfileMeta | null> {
    const key = username.toLowerCase()
    const cached = cache.get(key)
    if (cached && Date.now() - cached.at < TTL) return cached.data

    let result: PublicProfileMeta | null = null
    try {
      const firestore = await getDb()
      if (firestore) {
        const { collection, query, where, limit, getDocs } = await import('firebase/firestore')
        const snap = await getDocs(query(collection(firestore, 'users'), where('username', '==', username), limit(1)))
        const doc = snap.docs[0]
        if (doc) {
          const data = doc.data() as Record<string, unknown>
          result = {
            uid: (data.uid as string) || doc.id,
            username: (data.username as string) || username,
            displayName: data.displayName as string | undefined,
            headline: data.headline as string | undefined,
            bio: data.bio as string | undefined,
            photoURL: data.photoURL as string | undefined,
            coverImageURL: data.coverImageURL as string | undefined,
            accentColor: data.accentColor as string | undefined,
            avatarShape: data.avatarShape as PublicProfileMeta['avatarShape'],
            showAvatar: data.showAvatar as boolean | undefined,
            isPublic: data.isPublic as boolean | undefined,
          }
        }
      }
    } catch {
      result = null
    }

    cache.set(key, { at: Date.now(), data: result })
    return result
  }
})()

// Lists public usernames for the sitemap. Capped and best-effort: if Firebase
// isn't configured, or the read fails, callers should fall back to the static
// routes only rather than failing the whole sitemap.
export async function listPublicUsernames(max = 2000): Promise<string[]> {
  try {
    const firestore = await getDb()
    if (!firestore) return []
    const { collection, query, limit, getDocs } = await import('firebase/firestore')
    const snap = await getDocs(query(collection(firestore, 'users'), limit(max)))
    return snap.docs
      .map((doc) => doc.data() as Record<string, unknown>)
      .filter((data) => typeof data.username === 'string' && data.username && data.isPublic !== false)
      .map((data) => data.username as string)
  } catch {
    return []
  }
}
