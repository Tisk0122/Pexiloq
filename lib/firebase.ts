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

export async function saveProfile(uid: string, profile: Record<string, unknown>) {
  const { db: firestore } = requireFirebase()
  const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')
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

export const rules = `rules_version = '2';\nservice cloud.firestore { match /databases/{database}/documents { match /users/{userId} { allow read: if true; allow write: if request.auth != null && request.auth.uid == userId; match /{sub=**} { allow read: if true; allow write: if request.auth != null && request.auth.uid == userId; } } match /analytics/{userId} { allow read: if request.auth != null && request.auth.uid == userId; allow create: if true; allow update: if request.resource.data.keys().hasOnly(['views', 'links', 'projects', 'socials']); allow delete: if false; match /{sub=**} { allow read: if request.auth != null && request.auth.uid == userId; allow create: if true; allow update: if request.resource.data.keys().hasOnly(['views', 'links', 'projects', 'socials']); allow delete: if false; } } } }`

export const storageRules = `rules_version = '2';\nservice firebase.storage { match /b/{bucket}/o { match /users/{userId}/{allPaths=**} { allow read: if true; allow write: if request.auth != null && request.auth.uid == userId; } } }`
