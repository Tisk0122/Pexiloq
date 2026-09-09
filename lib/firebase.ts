'use client'

import type { FirebaseApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { firebaseApp, firebaseEnabled, firebaseConfig, type AppConfig } from '@/lib/firebase-app'

export { firebaseEnabled, firebaseConfig }
export type { AppConfig }
export const app: FirebaseApp | null = firebaseApp
export const auth = app ? getAuth(app) : null
export const db = app ? getFirestore(app) : null
export const storage = app ? getStorage(app) : null

export function requireFirebase() {
  if (!app || !auth || !db) throw new Error('Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_API_KEY to enable persistence.')
  return { app, auth, db, storage }
}

export async function uploadImage(file: File, path: string) {
  const { storage: bucket } = requireFirebase()
  if (!bucket) throw new Error('Firebase Storage is not configured')
  const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage')
  const snapshot = await uploadBytes(ref(bucket, path), file)
  return getDownloadURL(snapshot.ref)
}

export async function checkUsernameAvailable(rawUsername: string, currentUid?: string): Promise<{ available: boolean; ownedBySelf: boolean }> {
  if (!firebaseEnabled || !db) return { available: true, ownedBySelf: true }
  const username = rawUsername.toLowerCase().trim()
  if (!username) return { available: false, ownedBySelf: false }

  try {
    const { doc, getDoc } = await import('firebase/firestore')
    const snap = await getDoc(doc(db, 'usernames', username))
    if (!snap.exists()) {
      return { available: true, ownedBySelf: false }
    }
    const data = snap.data()
    if (currentUid && data.uid === currentUid) {
      return { available: true, ownedBySelf: true }
    }
    return { available: false, ownedBySelf: false }
  } catch {
    return { available: true, ownedBySelf: false }
  }
}

export async function claimUsername(uid: string, newUsernameRaw: string, oldUsernameRaw?: string) {
  if (!firebaseEnabled || !db) return
  const newUsername = newUsernameRaw.toLowerCase().trim()
  const oldUsername = oldUsernameRaw ? oldUsernameRaw.toLowerCase().trim() : undefined
  if (!newUsername) throw new Error('USERNAME_INVALID')

  const { doc, runTransaction, serverTimestamp } = await import('firebase/firestore')

  await runTransaction(db, async (transaction) => {
    const newDocRef = doc(db, 'usernames', newUsername)
    const userDocRef = doc(db, 'users', uid)
    const oldDocRef = oldUsername && oldUsername !== newUsername ? doc(db, 'usernames', oldUsername) : null

    const newSnap = await transaction.get(newDocRef)
    const userSnap = await transaction.get(userDocRef)
    const oldSnap = oldDocRef ? await transaction.get(oldDocRef) : null

    if (newSnap.exists()) {
      const data = newSnap.data()
      if (data.uid !== uid) {
        throw new Error('USERNAME_TAKEN')
      }
    }

    const createdAt = newSnap.exists() && newSnap.data()?.createdAt ? newSnap.data().createdAt : serverTimestamp()
    transaction.set(newDocRef, { uid, createdAt, updatedAt: serverTimestamp() }, { merge: true })
    transaction.set(userDocRef, { username: newUsername, uid, updatedAt: serverTimestamp() }, { merge: true })

    if (oldDocRef && oldSnap && oldSnap.exists()) {
      if (oldSnap.data()?.uid === uid) {
        transaction.delete(oldDocRef)
      }
    }
  })
}

export async function claimUniqueUsername(uid: string, baseRaw: string): Promise<string> {
  const base = baseRaw.toLowerCase().replace(/[^a-z0-9-]/g, '') || 'creator'
  let candidate = base
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      await claimUsername(uid, candidate)
      return candidate
    } catch (err: any) {
      if (err?.message === 'USERNAME_TAKEN') {
        candidate = `${base}${Math.floor(1000 + Math.random() * 9000)}`
      } else {
        throw err
      }
    }
  }
  candidate = `${base}${crypto.randomUUID().slice(0, 6)}`
  await claimUsername(uid, candidate)
  return candidate
}

export async function saveProfile(uid: string, profile: Record<string, unknown>) {
  const { db: firestore } = requireFirebase()
  const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')

  if (typeof profile.username === 'string' && profile.username) {
    const newUsername = profile.username.toLowerCase().trim()
    const userSnap = await loadProfile(uid)
    const oldUsername = userSnap?.username ? String(userSnap.username).toLowerCase().trim() : undefined
    if (newUsername !== oldUsername) {
      await claimUsername(uid, newUsername, oldUsername)
    } else {
      try {
        await claimUsername(uid, newUsername)
      } catch { /* best effort */ }
    }
  }

  await setDoc(doc(firestore, 'users', uid), { ...profile, uid, updatedAt: serverTimestamp() }, { merge: true })
}

export async function loadProfile(uid: string) {
  const { db: firestore } = requireFirebase()
  const { doc, getDoc } = await import('firebase/firestore')
  const snap = await getDoc(doc(firestore, 'users', uid))
  return snap.exists() ? snap.data() : null
}

export async function loadProfileByUsername(username: string) {
  const { db: firestore } = requireFirebase()
  const { collection, query, where, limit, getDocs } = await import('firebase/firestore')
  const snap = await getDocs(query(collection(firestore, 'users'), where('username', '==', username), limit(1)))
  return snap.docs[0]?.data() || null
}

// --- links & projects storage -------------------------------------------------
// These used to live in per-item subcollections (users/{uid}/links/{id}, .../projects/{id}).
// That meant a single page view or save could cost N+1 Firestore reads/writes (one per item),
// which burns through the Spark (free) plan's daily quota fast under real traffic.
// Now the whole array is stored as one field on the users/{uid} document, so loading or
// saving links/projects is always exactly 1 read / 1 write, no matter how many items there are.

export async function saveItems(uid: string, kind: 'links' | 'projects', items: unknown[]) {
  const { db: firestore } = requireFirebase()
  const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')
  await setDoc(doc(firestore, 'users', uid), { [kind]: items, updatedAt: serverTimestamp() }, { merge: true })
}

// Back-compat: reads the old per-item subcollection. Only ever hit for accounts created
// before this change, and only until they've been migrated (see loadUserBundle below).
async function legacyLoadCollection(uid: string, kind: 'links' | 'projects') {
  const { db: firestore } = requireFirebase()
  const { collection: collectionRef, getDocs, orderBy, query } = await import('firebase/firestore')
  try {
    const snap = await getDocs(query(collectionRef(firestore, 'users', uid, kind), orderBy('order')))
    return snap.docs.map((item) => item.data())
  } catch { return [] }
}

// Fetches profile + links + projects for the signed-in owner in a single document read.
// If the account predates this change (no `links`/`projects` fields yet), it falls back to the
// legacy subcollections just this once and writes the migrated arrays back onto the doc so every
// subsequent load (by the owner, or by any public visitor) costs a single read from then on.
export async function loadUserBundle(uid: string) {
  const data = await loadProfile(uid)
  if (!data) return null

  if (data.username) {
    try {
      const avail = await checkUsernameAvailable(data.username, uid)
      if (avail.available && !avail.ownedBySelf) {
        await claimUsername(uid, data.username)
      }
    } catch { /* best effort */ }
  }

  let links = (data as any).links
  let projects = (data as any).projects
  let needsMigration = false
  if (!Array.isArray(links)) { links = await legacyLoadCollection(uid, 'links'); needsMigration = true }
  if (!Array.isArray(projects)) { projects = await legacyLoadCollection(uid, 'projects'); needsMigration = true }
  if (needsMigration) {
    try {
      const { db: firestore } = requireFirebase()
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')
      await setDoc(doc(firestore, 'users', uid), { links, projects, updatedAt: serverTimestamp() }, { merge: true })
    } catch { /* best effort; will just retry the fallback next load */ }
  }
  return { profile: data, links, projects }
}

// Fetches a public profile page by username in a single document read (the query itself).
// Falls back to the legacy subcollections for not-yet-migrated accounts (no write here, since
// an anonymous visitor isn't authenticated as the profile owner and Firestore rules disallow it —
// migration for those accounts completes the next time the owner opens their own dashboard).
export async function loadPublicBundle(username: string) {
  const data = await loadProfileByUsername(username)
  if (!data || !(data as any).uid) return null
  let links = (data as any).links
  let projects = (data as any).projects
  if (!Array.isArray(links)) links = await legacyLoadCollection((data as any).uid, 'links')
  if (!Array.isArray(projects)) projects = await legacyLoadCollection((data as any).uid, 'projects')
  return { profile: data, links, projects }
}

export type AnalyticsData = { views: number; links: Record<string, number>; projects: Record<string, number>; socials: Record<string, number> }

export async function recordAnalytics(uid: string, kind: 'views' | 'links' | 'projects' | 'socials', key?: string) {
  if (!key && kind !== 'views') return
  try {
    const { db: firestore } = requireFirebase()
    const { doc, setDoc, increment } = await import('firebase/firestore')
    const ref = doc(firestore, 'analytics', uid)
    if (kind === 'views') await setDoc(ref, { views: increment(1) }, { merge: true })
    else await setDoc(ref, { [kind]: { [key as string]: increment(1) } }, { merge: true })
  } catch { /* best effort */ }
}

export async function loadAnalytics(uid: string): Promise<AnalyticsData | null> {
  try {
    const { db: firestore } = requireFirebase()
    const { doc, getDoc } = await import('firebase/firestore')
    const snap = await getDoc(doc(firestore, 'analytics', uid))
    if (!snap.exists()) return null
    const d = snap.data()
    return { views: d.views || 0, links: d.links || {}, projects: d.projects || {}, socials: d.socials || {} }
  } catch { return null }
}

export async function deleteAccount(uid: string) {
  const { db: firestore } = requireFirebase()
  const { collection: collectionRef, doc, getDocs, writeBatch } = await import('firebase/firestore')
  const batch = writeBatch(firestore)
  for (const kind of ['links', 'projects'] as const) {
    const snap = await getDocs(collectionRef(firestore, 'users', uid, kind))
    snap.docs.forEach((d) => batch.delete(doc(firestore, 'users', uid, kind, d.id)))
  }
  batch.delete(doc(firestore, 'users', uid))
  await batch.commit()
}

export const firebaseSetup = `NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key\nNEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=pexiloq.firebaseapp.com\nNEXT_PUBLIC_FIREBASE_PROJECT_ID=pexiloq\nNEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=pexiloq.firebasestorage.app\nNEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=44563563707\nNEXT_PUBLIC_FIREBASE_APP_ID=1:44563563707:web:4294e5bd7bae2eda33d59e`

export const rules = `rules_version = '2';\nservice cloud.firestore { match /databases/{database}/documents { match /usernames/{username} { allow read: if true; allow create: if request.auth != null && request.resource.data.uid == request.auth.uid; allow update: if request.auth != null && resource.data.uid == request.auth.uid && request.resource.data.uid == request.auth.uid; allow delete: if request.auth != null && resource.data.uid == request.auth.uid; } match /users/{userId} { allow read: if true; allow write: if request.auth != null && request.auth.uid == userId && (!request.resource.data.keys().hasAny(['username']) || (resource != null && request.resource.data.username == resource.data.username) || get(/databases/$(database)/documents/usernames/$(request.resource.data.username)).data.uid == request.auth.uid); match /{sub=**} { allow read: if true; allow write: if request.auth != null && request.auth.uid == userId; } } match /analytics/{userId} { allow read: if request.auth != null && request.auth.uid == userId; allow create: if true; allow update: if request.resource.data.keys().hasOnly(['views', 'links', 'projects', 'socials']); allow delete: if false; match /{sub=**} { allow read: if request.auth != null && request.auth.uid == userId; allow create: if true; allow update: if request.resource.data.keys().hasOnly(['views', 'links', 'projects', 'socials']); allow delete: if false; } } } }`

export const storageRules = `rules_version = '2';\nservice firebase.storage { match /b/{bucket}/o { match /users/{userId}/{allPaths=**} { allow read: if true; allow write: if request.auth != null && request.auth.uid == userId; } } }`
