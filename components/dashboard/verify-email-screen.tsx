'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { sendEmailVerification, signOut } from 'firebase/auth'
import { CheckCircle2, Loader2, Mail, RefreshCw } from 'lucide-react'
import { LanguageSwitcher, useI18n } from '@/components/i18n-provider'
import { auth } from '@/lib/firebase'
import { Logo } from '../logo'
import { useWorkspace } from '../workspace-provider'

function friendlyAuthError(err: any, t: (key: string) => string): string {
  const code: string = err?.code || ''
  switch (code) {
    case 'auth/too-many-requests':
      return t('authErrorTooManyRequests')
    case 'auth/network-request-failed':
      return t('authErrorNetwork')
    default:
      return t('somethingWrong')
  }
}

export function VerifyEmailScreen() {
  const router = useRouter()
  const { t } = useI18n()
  const { email, reloadUser } = useWorkspace()
  const [cooldown, setCooldown] = useState(0)
  const [sending, setSending] = useState(false)
  const [sentMessage, setSentMessage] = useState(false)
  const [error, setError] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)

  // Polling & visibility listener
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null

    const checkVerification = async () => {
      const verified = await reloadUser()
      if (verified) {
        if (timer) clearInterval(timer)
      }
    }

    // Poll every 3 seconds
    timer = setInterval(checkVerification, 3000)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVerification()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (timer) clearInterval(timer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [reloadUser])

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [cooldown])

  const resendEmail = async () => {
    if (cooldown > 0 || sending || !auth?.currentUser) return
    setSending(true)
    setError('')
    setSentMessage(false)
    try {
      await sendEmailVerification(auth.currentUser)
      setSentMessage(true)
      setCooldown(60)
    } catch (err: any) {
      setError(friendlyAuthError(err, t))
    } finally {
      setSending(false)
    }
  }

  const logout = async () => {
    setLoggingOut(true)
    if (auth) await signOut(auth)
    router.push('/login')
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b bg-background/95 px-6 py-4 backdrop-blur-md lg:px-10">
        <Logo />
        <LanguageSwitcher compact />
      </header>
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border bg-card p-8 shadow-xs sm:p-10 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6">
            <Mail className="size-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('verifyEmailTitle')}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t('verifyEmailDesc')}</p>
          {email && (
            <div className="mt-4 rounded-xl border bg-secondary/50 px-4 py-2.5 text-sm font-semibold font-mono text-foreground break-all">
              {email}
            </div>
          )}

          {sentMessage && (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{t('verifyEmailSent')}</span>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-xs font-medium text-destructive">
              {error}
            </div>
          )}

          <div className="mt-8 space-y-3">
            <button
              onClick={resendEmail}
              disabled={cooldown > 0 || sending}
              className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-xs transition hover:opacity-90 disabled:opacity-50"
            >
              {sending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t('wait')}
                </>
              ) : cooldown > 0 ? (
                t('resendCooldown').replace('{seconds}', cooldown.toString())
              ) : (
                <>
                  <RefreshCw className="size-4" />
                  {t('resendVerificationEmail')}
                </>
              )}
            </button>

            <button
              onClick={logout}
              disabled={loggingOut}
              className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-full border border-transparent text-xs font-medium text-muted-foreground transition hover:border-border hover:bg-secondary/60 hover:text-foreground disabled:opacity-50"
            >
              {loggingOut ? <Loader2 className="size-3.5 animate-spin" /> : null}
              {t('wrongEmailLogout')}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
