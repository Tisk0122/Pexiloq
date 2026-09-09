'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, loadUserBundle, saveItems, saveProfile } from '@/lib/firebase'
import { emptyProfile, normalizeProfile, type LinkItem, type Profile, type Project } from './types'

type Workspace = {
  profile: Profile
  links: LinkItem[]
  projects: Project[]
  loading: boolean
  persistProfile: (next: Profile) => Promise<void>
  persistLinks: (next: LinkItem[]) => Promise<void>
  persistProjects: (next: Project[]) => Promise<void>
  uid: string | null
}

const WorkspaceContext = createContext<Workspace | null>(null)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile>(emptyProfile)
  const [links, setLinks] = useState<LinkItem[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [uid, setUid] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }
    return onAuthStateChanged(auth, async (user) => {
      setUid(user?.uid || null)
      try {
        if (user) {
          const bundle = await loadUserBundle(user.uid)
          if (bundle?.profile) setProfile(normalizeProfile(bundle.profile as Partial<Profile>))
          if (bundle?.links && Array.isArray(bundle.links)) setLinks(bundle.links as LinkItem[])
          if (bundle?.projects && Array.isArray(bundle.projects)) setProjects(bundle.projects as Project[])
        } else {
          setProfile(emptyProfile)
          setLinks([])
          setProjects([])
        }
      } catch {
        if (!user) {
          setProfile(emptyProfile)
          setLinks([])
          setProjects([])
        }
      } finally {
        setLoading(false)
      }
    })
  }, [])

  const persistProfile = async (next: Profile) => {
    setProfile((prev) => (prev === next || JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
    if (uid) await saveProfile(uid, next as Record<string, unknown>)
  }

  const persistLinks = async (next: LinkItem[]) => {
    setLinks((prev) => (prev === next || JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
    if (uid) await saveItems(uid, 'links', next)
  }

  const persistProjects = async (next: Project[]) => {
    setProjects((prev) => (prev === next || JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
    if (uid) await saveItems(uid, 'projects', next)
  }

  return (
    <WorkspaceContext.Provider value={{ profile, links, projects, loading, persistProfile, persistLinks, persistProjects, uid }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within a WorkspaceProvider')
  return ctx
}

export function useAuth() {
  const [user, setUser] = useState<{ uid: string; displayName: string | null; email: string | null } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }
    return onAuthStateChanged(auth, (u) => {
      setUser(u ? { uid: u.uid, displayName: u.displayName, email: u.email } : null)
      setLoading(false)
    })
  }, [])

  return { user, loading }
}
