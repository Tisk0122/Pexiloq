// Isomorphic Firebase app initialization — safe to import from both the client
// ('use client' modules) and the server (Server Components, generateMetadata,
// route handlers, opengraph-image, sitemap). Deliberately has NO 'use client'
// directive so Next.js will run it on the server when imported from server code.
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'

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
export const firebaseApp: FirebaseApp | null = firebaseEnabled ? (getApps()[0] || initializeApp(config)) : null
export type AppConfig = typeof config
export const firebaseConfig = config
