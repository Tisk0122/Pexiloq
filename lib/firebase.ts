'use client'

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'pexiloq.firebaseapp.com',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'pexiloq',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'pexiloq.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '44563563707',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:44563563707:web:4294e5bd7bae2eda33d59e',
}

export const firebaseEnabled = Boolean(config.apiKey)
export const app: FirebaseApp | null = firebaseEnabled ? (getApps()[0] || initializeApp(config)) : null
export const auth = app ? getAuth(app) : null
export const db = app ? getFirestore(app) : null
export const storage = app ? getStorage(app) : null

export function requireFirebase() {
  if (!app || !auth || !db) throw new Error('Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_API_KEY to enable persistence.')
  return { app, auth, db, storage }
}

export type AppConfig = typeof config
export const firebaseConfig = config

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

export async function saveCollection(uid: string, collection: 'links' | 'projects', items: unknown[]) {
  const { db: firestore } = requireFirebase()
  const { collection: collectionRef, doc, getDocs, writeBatch, serverTimestamp } = await import('firebase/firestore')
  const batch = writeBatch(firestore)
  const parent = collectionRef(firestore, 'users', uid, collection)
  const existing = await getDocs(collectionRef(firestore, 'users', uid, collection))
  const ids = new Set((items as { id: string }[]).map((item) => item.id))
  existing.forEach((d) => { if (!ids.has(d.id)) batch.delete(d.ref) })
  items.forEach((item: any, index) => batch.set(doc(parent, item.id), { ...item, order: index, updatedAt: serverTimestamp() }))
  await batch.commit()
}

export async function loadCollection(uid: string, collection: 'links' | 'projects') {
  const { db: firestore } = requireFirebase()
  const { collection: collectionRef, getDocs, orderBy, query } = await import('firebase/firestore')
  const snap = await getDocs(query(collectionRef(firestore, 'users', uid, collection), orderBy('order')))
  return snap.docs.map((item) => item.data())
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
