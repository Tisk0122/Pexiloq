'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { ArrowUpRight, Eye, Layers, Link2, Loader2, LogOut, Menu, Palette, Settings, UserRound, X } from 'lucide-react'
import { LanguageSwitcher, useI18n } from '@/components/i18n-provider'
import { auth, firebaseEnabled } from '@/lib/firebase'
import { siteHost } from '@/lib/site'
import { Logo } from '../logo'
import { CardImg } from '../preview/profile-card'
import { LoadingScreen } from '../ui/loader'
import { useWorkspace } from '../workspace-provider'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobile, setMobile] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const { t } = useI18n()
  const { profile, loading, uid } = useWorkspace()

  const nav = [
    { href: '/dashboard', label: t('overview'), icon: Eye },
    { href: '/dashboard/profile', label: t('profile'), icon: UserRound },
    { href: '/dashboard/links', label: t('links'), icon: Link2 },
    { href: '/dashboard/projects', label: t('projects'), icon: Layers },
    { href: '/dashboard/appearance', label: t('appearance'), icon: Palette },
    { href: '/dashboard/settings', label: t('settings'), icon: Settings },
  ]

  async function logout() {
    setLoggingOut(true)
    if (auth) await signOut(auth)
    router.push('/')
  }

  const signedOut = !loading && firebaseEnabled && !uid

  useEffect(() => {
    if (signedOut) router.replace('/login')
  }, [signedOut, router])

  if (loading || signedOut) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/95 px-6 py-3.5 backdrop-blur-md lg:px-10">
        <div className="flex items-center gap-6">
          <Logo />
          {profile.username && (
            <div className="hidden items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground md:flex">
              <span className="size-2 rounded-full" style={{ backgroundColor: profile.isPublic === false ? '#eab308' : '#22c55e' }} />
              <span className="font-mono text-[11px]">{siteHost}/{profile.username}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher compact />
          <button
            className="grid size-10 min-h-[40px] min-w-[40px] place-items-center rounded-full border bg-card transition hover:border-foreground/30 lg:hidden"
            onClick={() => setMobile(!mobile)}
            aria-label={mobile ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobile}
          >
            {mobile ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <div className="hidden items-center gap-4 lg:flex">
            <Link
              href={`/${profile.username}`}
              target="_blank"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border bg-card px-3.5 py-1.5 text-xs font-medium transition hover:border-foreground/40 hover:bg-secondary"
            >
              {t('viewProfile')} <ArrowUpRight className="size-3.5 text-muted-foreground" />
            </Link>
            <button
              onClick={logout}
              disabled={loggingOut}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-transparent px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-border hover:bg-card hover:text-foreground disabled:opacity-50"
            >
              {loggingOut ? <Loader2 className="size-3.5 animate-spin" /> : <LogOut className="size-3.5" />} {t('logout')}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px]">
        {/* Mobile menu overlay */}
        {mobile && (
          <div className="fixed inset-0 top-[65px] z-30 flex flex-col justify-between overflow-y-auto bg-background/98 p-6 backdrop-blur-lg pb-[calc(1.5rem+env(safe-area-inset-bottom))] lg:hidden">
            <div>
              <div className="mb-6 flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-full bg-secondary font-medium">
                    {profile.photoURL ? <CardImg src={profile.photoURL} alt="" className="size-full rounded-full" /> : (profile.displayName || '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{profile.displayName || 'Pexiloq Creator'}</p>
                    <p className="text-xs font-mono text-muted-foreground">@{profile.username || 'creator'}</p>
                  </div>
                </div>
                <Link
                  href={`/${profile.username}`}
                  target="_blank"
                  onClick={() => setMobile(false)}
                  className="inline-flex min-h-[36px] items-center gap-1 rounded-full border bg-card px-3 py-1.5 text-xs font-medium"
                >
                  {t('viewProfile')} <ArrowUpRight className="size-3" />
                </Link>
              </div>
              <nav className="space-y-1.5">
                {nav.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    onClick={() => setMobile(false)}
                    href={href}
                    aria-current={pathname === href ? 'page' : undefined}
                    className={`flex min-h-[48px] items-center gap-3.5 rounded-2xl px-4 py-3.5 text-base font-medium transition ${
                      pathname === href ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
                    }`}
                  >
                    <Icon className="size-5 shrink-0" />
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="mt-8 border-t pt-6">
              <button
                onClick={logout}
                disabled={loggingOut}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border bg-card py-3 text-sm font-medium text-muted-foreground transition hover:text-foreground disabled:opacity-50"
              >
                {loggingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />} {t('logout')}
              </button>
            </div>
          </div>
        )}

        <aside className="hidden w-64 shrink-0 border-r p-6 lg:block lg:min-h-[calc(100vh-65px)]">
          <div className="mb-6 flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-xs">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-xs font-medium">
              {profile.photoURL ? <CardImg src={profile.photoURL} alt="" className="size-full rounded-full" /> : (profile.displayName || '?').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{profile.displayName || 'Pexiloq Creator'}</p>
              <p className="truncate font-mono text-[11px] text-muted-foreground">@{profile.username || 'creator'}</p>
            </div>
          </div>
          <p className="mb-3 px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">{t('workspace')}</p>
          <nav className="space-y-1">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                    active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </Link>
              )
            })}
          </nav>
          <div className="mt-10 rounded-2xl border bg-card/60 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold">{t('yourPublicPage')}</p>
              <span className="size-2 rounded-full" style={{ backgroundColor: profile.isPublic === false ? '#eab308' : '#22c55e' }} title={profile.isPublic === false ? t('privateProfile') : t('live')} />
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{t('shareOneLink')}</p>
            <Link
              href={`/${profile.username}`}
              target="_blank"
              className="mt-3.5 inline-flex items-center gap-1 text-xs font-medium text-foreground underline underline-offset-4 hover:opacity-80"
            >
              {t('openProfile')} <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </aside>
        <main className="min-w-0 flex-1 p-5 sm:p-6 lg:p-10">{children}</main>
      </div>
    </div>
  )
}
