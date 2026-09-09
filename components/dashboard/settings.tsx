'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteUser, EmailAuthProvider, GoogleAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup } from 'firebase/auth'
import { Loader2 } from 'lucide-react'
import { useI18n } from '@/components/i18n-provider'
import { auth, deleteAccount, firebaseEnabled } from '@/lib/firebase'
import { siteHost } from '@/lib/site'
import { getIdToken, purgeAllStoredImages, Toggle } from '../ui/image-uploader'
import { useWorkspace } from '../workspace-provider'
import { PageHeader } from './overview'

export function SettingsPage() {
  const { profile, persistProfile } = useWorkspace()
  const { t } = useI18n()
  const router = useRouter()
  const [notice, setNotice] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [busy, setBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [needReauth, setNeedReauth] = useState(false)
  const [reauthPassword, setReauthPassword] = useState('')
  const [r2, setR2] = useState<{ configured: boolean; maxBytes: number } | null>(null)

  useEffect(() => {
    fetch('/api/upload')
      .then((res) => res.json())
      .then(setR2)
      .catch(() => setR2(null))
  }, [])

  async function removeAccount() {
    const user = auth?.currentUser
    if (!user) {
      router.push('/')
      return
    }
    const uidToPurge = user.uid
    const idToken = await getIdToken()
    await deleteUser(user)
    try {
      await deleteAccount(uidToPurge)
    } catch {
      /* best effort */
    }
    void purgeAllStoredImages(uidToPurge, idToken)
    router.push('/')
  }

  async function confirmDelete() {
    setBusy(true)
    setError('')
    try {
      await removeAccount()
    } catch (err: unknown) {
      const authErr = err as { code?: string; message?: string }
      if (authErr?.code === 'auth/requires-recent-login') setNeedReauth(true)
      else setError(String(authErr?.message || err).replace('Firebase: ', '') || t('somethingWrong'))
      setBusy(false)
    }
  }

  async function submitReauth(e?: React.FormEvent) {
    e?.preventDefault()
    setBusy(true)
    setError('')
    const user = auth?.currentUser
    if (!user) {
      router.push('/')
      return
    }
    try {
      if (isGoogle) await reauthenticateWithPopup(user, new GoogleAuthProvider())
      else await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email || '', reauthPassword))
      await removeAccount()
    } catch (err: unknown) {
      const authErr = err as { code?: string; message?: string }
      if (authErr?.code === 'auth/popup-closed-by-user') {
        setBusy(false)
        return
      }
      setError(String(authErr?.message || err).replace('Firebase: ', '') || t('somethingWrong'))
      setBusy(false)
    }
  }

  const isGoogle = auth?.currentUser?.providerData.some((p) => p.providerId === 'google.com') ?? false

  const resetDelete = () => {
    setConfirming(false)
    setConfirmText('')
    setError('')
    setNeedReauth(false)
    setReauthPassword('')
  }

  return (
    <>
      <PageHeader eyebrow={t('accountLabel')} title={t('settings')} description={t('settingsDesc')} />
      <div className="max-w-2xl rounded-2xl border bg-card p-6 shadow-xs">
        <p className="text-sm font-medium">{t('publicUrl')}</p>
        <p className="mt-2 font-mono text-sm text-muted-foreground">{siteHost}/{profile.username}</p>
        <div className="my-8 border-t" />
        <p className="text-sm font-medium">{t('stepPrivacy')}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{profile.isPublic === false ? t('privateProfileText') : t('publicProfileText')}</p>
        <div className="mt-4">
          <Toggle
            label={t('publicProfile')}
            checked={profile.isPublic !== false}
            onChange={(v) => {
              setSaving(true)
              void persistProfile({ ...profile, isPublic: v }).finally(() => setSaving(false))
            }}
          />
        </div>
        {saving && (
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            {t('saving')}
          </p>
        )}
        <div className="my-8 border-t" />
        <p className="text-sm font-medium">{t('firebaseConnection')}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{firebaseEnabled ? t('firebaseConnected') : t('firebasePreview')}</p>
        {!firebaseEnabled && <pre className="mt-4 overflow-auto rounded-xl bg-secondary p-4 text-xs font-mono">NEXT_PUBLIC_FIREBASE_API_KEY=...</pre>}
        <div className="my-8 border-t" />
        <p className="text-sm font-medium">{t('imageStorage')}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r2 === null ? '…' : r2.configured ? t('r2Ready') : t('r2Missing')}</p>
        {r2 !== null && !r2.configured && (
          <pre className="mt-4 overflow-auto rounded-xl bg-secondary p-4 text-xs font-mono">
            R2_ACCOUNT_ID=…<br />
            R2_ACCESS_KEY_ID=…<br />
            R2_SECRET_ACCESS_KEY=…<br />
            R2_BUCKET=…<br />
            R2_PUBLIC_URL=…
          </pre>
        )}
        <button
          onClick={() => {
            setSaving(true)
            void persistProfile(profile).finally(() => {
              setSaving(false)
              setNotice(t('saved'))
            })
          }}
          disabled={saving}
          className="mt-8 flex min-h-[44px] items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t('saving')}
            </>
          ) : (
            notice || t('saveSettings')
          )}
        </button>
      </div>

      <div className="mt-8 max-w-2xl rounded-2xl border border-destructive/40 bg-card p-6 shadow-xs">
        <p className="text-sm font-medium text-destructive">{t('dangerZone')}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t('deleteAccountDesc')}</p>
        <p className="mt-1 text-xs text-destructive/80">{t('deleteWarning')}</p>
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="mt-4 flex min-h-[44px] items-center rounded-full border border-destructive/40 px-5 py-3 text-sm font-medium text-destructive transition hover:bg-destructive/10"
          >
            {t('deleteAccount')}
          </button>
        ) : (
          <div className="mt-4 rounded-2xl border border-destructive/40 bg-destructive/5 p-5">
            {needReauth ? (
              <form onSubmit={submitReauth} className="space-y-3">
                <p className="text-sm text-destructive">{t('reauthTitle')}</p>
                <p className="text-xs text-muted-foreground">{auth?.currentUser?.email || ''}</p>
                {!isGoogle && (
                  <input
                    required
                    type="password"
                    value={reauthPassword}
                    onChange={(e) => setReauthPassword(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-base sm:text-sm"
                    placeholder={t('password')}
                    autoFocus
                  />
                )}
                {error && <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={busy || (!isGoogle && !reauthPassword)}
                    className="flex min-h-[44px] items-center rounded-full bg-destructive px-5 py-3 text-sm font-medium text-white disabled:opacity-40"
                  >
                    {busy ? t('wait') : isGoogle ? t('reauthGoogle') : t('reauthSubmit')}
                  </button>
                  <button
                    type="button"
                    onClick={resetDelete}
                    disabled={busy}
                    className="flex min-h-[44px] items-center rounded-full border px-5 py-3 text-sm font-medium transition hover:border-foreground/40 disabled:opacity-40"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <p className="text-sm text-destructive">{t('typeToConfirm')}</p>
                <input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="mt-3 w-full rounded-lg border bg-background px-3 py-2 text-base sm:text-sm"
                  placeholder="DELETE"
                />
                {error && <p className="mt-3 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={confirmDelete}
                    disabled={confirmText.trim() !== 'DELETE' || busy}
                    className="flex min-h-[44px] items-center rounded-full bg-destructive px-5 py-3 text-sm font-medium text-white disabled:opacity-40"
                  >
                    {busy ? t('wait') : t('confirmDelete')}
                  </button>
                  <button
                    onClick={resetDelete}
                    disabled={busy}
                    className="flex min-h-[44px] items-center rounded-full border px-5 py-3 text-sm font-medium transition hover:border-foreground/40 disabled:opacity-40"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}
