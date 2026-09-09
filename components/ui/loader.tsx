'use client'

import { useI18n } from '@/components/i18n-provider'

export function Loader({ className = 'size-6' }: { className?: string }) {
  return <span role="status" aria-label="Loading" className={`inline-block animate-spin rounded-full border-2 border-foreground/20 border-t-foreground ${className}`} />
}

export function LoadingScreen({ label }: { label?: string }) {
  const { t } = useI18n()
  return (
    <div role="status" aria-live="polite" className="fixed inset-0 z-[999] flex flex-col items-center justify-center overflow-hidden bg-background">
      <div className="pointer-events-none absolute -left-28 -top-32 size-80 rounded-full bg-secondary opacity-70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-36 -right-24 size-96 rounded-full bg-secondary opacity-70 blur-3xl" />
      <div className="relative flex flex-col items-center px-6 text-center">
        <img
          src="/Pexiloq_Icon.png"
          alt="Pexiloq"
          width={110}
          height={110}
          className="h-24 w-24 object-contain drop-shadow-[0_10px_30px_rgba(35,35,30,0.16)]"
          style={{ animation: 'pexiloq-pulse 2.1s ease-in-out infinite' }}
        />
        <h1 className="mt-6 text-4xl font-medium tracking-[-0.05em] text-foreground">Pexiloq</h1>
        <div className="mt-9 h-1.5 w-64 max-w-[70vw] overflow-hidden rounded-full bg-secondary">
          <div className="h-full w-1/3 rounded-full bg-foreground" style={{ animation: 'pexiloq-loadbar 1.5s ease-in-out infinite' }} />
        </div>
        <p className="mt-5 text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">{label ?? t('loadingLabel')}</p>
      </div>
    </div>
  )
}
