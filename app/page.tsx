'use client'

import Link from 'next/link'
import { ArrowUpRight, Menu, Play, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { LanguageSwitcher, useI18n } from '@/components/i18n-provider'
import { PhonePreviewFrame, ProfileCard, showcaseTemplates, useAuth, type ShowcaseStyle } from '@/components/pexiloq-app'

const features = [
  { title: 'together', text: 'togetherText', mark: '01' },
  { title: 'yours', text: 'yoursText', mark: '02' },
  { title: 'next', text: 'nextText', mark: '03' },
]

const patternLabelKey: Record<ShowcaseStyle, string> = { minimal: 'patternMinimal', afterHours: 'patternAfterHours', bright: 'patternBright' }

export default function Page() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { t, language } = useI18n()
  const { user, loading: authLoading } = useAuth()
  const showcase = showcaseTemplates(language)
  const hero = showcase[0]

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between px-6 py-4 lg:px-10">
          <Link href="#top" className="flex shrink-0 items-center" aria-label="Pexiloq home">
            <img src="/Pexiloq_Logo.png" alt="Pexiloq" width={1774} height={887} className="h-12 w-auto object-contain sm:h-14 md:h-16 lg:h-18" />
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <Link className="transition-colors hover:text-foreground" href="#features">{t('features')}</Link>
            <Link className="transition-colors hover:text-foreground" href="#how-it-works">{t('howItWorks')}</Link>
            <Link className="transition-colors hover:text-foreground" href="#profiles">{t('explore')}</Link>
          </nav>
          <div className="hidden items-center gap-4 md:flex">
            <LanguageSwitcher compact />
            {authLoading ? <div className="h-10 w-24 animate-pulse rounded-full bg-secondary" /> : user ? (
              <Link href="/dashboard" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-xs transition hover:opacity-90">{user.displayName || t('workspace')} <ArrowUpRight className="size-4" /></Link>
            ) : (
              <><Link href="/login" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">{t('login')}</Link><Link href="/signup" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-xs transition hover:opacity-90">{t('create')} <ArrowUpRight className="size-4" /></Link></>
            )}
          </div>
          <button className="flex size-9 items-center justify-center rounded-full border bg-card md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation" aria-expanded={menuOpen}>{menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}</button>
        </div>
      </header>
      {menuOpen && <nav className="mx-6 flex flex-col gap-4 border-t border-border py-5 text-sm md:hidden">{authLoading ? <div className="h-10 animate-pulse rounded-lg bg-secondary" /> : user ? <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="font-semibold">{t('workspace')} <ArrowUpRight className="inline size-4" /></Link> : <><Link href="#features" onClick={() => setMenuOpen(false)}>{t('features')}</Link><Link href="#how-it-works" onClick={() => setMenuOpen(false)}>{t('howItWorks')}</Link><Link href="#profiles" onClick={() => setMenuOpen(false)}>{t('explore')}</Link><LanguageSwitcher /><Link href="/login" onClick={() => setMenuOpen(false)}>{t('login')}</Link><Link href="/signup" onClick={() => setMenuOpen(false)} className="font-semibold">{t('create')} <ArrowUpRight className="inline size-4" /></Link></>}</nav>}

      <section id="top" className="mx-auto grid max-w-[1320px] gap-16 px-6 pb-24 pt-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-10 lg:pb-32 lg:pt-24">
        <div className="max-w-[650px]">
          <div className="mb-8 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"><span className="h-px w-8 bg-[#b7b7b0]" /> {t('heroKicker')}</div>
          <h1 className="max-w-[680px] text-balance text-[clamp(3.7rem,7.4vw,7.25rem)] font-medium leading-[0.9] tracking-[-0.085em]">{t('heroTitle')}</h1>
          <p className="mt-9 max-w-[500px] text-pretty text-lg leading-8 text-muted-foreground">{t('heroBody')}</p>
          <div className="mt-10 flex flex-wrap items-center gap-4"><Link href={user ? '/dashboard' : '/signup'} className="rounded-full bg-primary px-6 py-4 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5">{user ? t('workspace') : t('create')} <ArrowUpRight className="ml-2 inline size-4" /></Link><Link href="#profiles" className="group flex items-center gap-2 px-2 py-4 text-sm font-medium text-muted-foreground">{t('seeFeels')} <span className="transition-transform group-hover:translate-x-1">→</span></Link></div>
        </div>
        <div className="relative lg:pl-8">
          <div className="relative mx-auto max-w-[380px] rotate-[2deg] transition-transform duration-500 hover:rotate-0">
            <PhonePreviewFrame profile={hero.bundle.profile}>
              <ProfileCard profile={hero.bundle.profile} links={hero.bundle.links} projects={hero.bundle.projects} preview />
            </PhonePreviewFrame>
          </div>
          <div className="absolute -bottom-6 -left-2 hidden rounded-2xl border border-border bg-card px-4 py-3 text-xs shadow-[0_12px_35px_rgba(35,35,30,0.08)] sm:block"><Sparkles className="mr-2 inline size-3 text-[#a7926f]" /> {t('shareOneLink')}</div>
        </div>
      </section>

      <section id="profiles" className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <div className="mx-auto mb-14 max-w-[560px] text-center">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{t('explore')}</p>
          <h2 className="mt-4 text-4xl font-medium leading-tight tracking-[-0.06em] sm:text-5xl">{t('patternsHeading')}</h2>
          <p className="mx-auto mt-4 max-w-[420px] text-sm leading-6 text-muted-foreground">{t('patternsBody')}</p>
        </div>
        <div className="grid gap-10 sm:grid-cols-3">
          {showcase.map(({ style, bundle }) => (
            <div key={style} className="flex flex-col items-center">
              <PhonePreviewFrame profile={bundle.profile}>
                <ProfileCard profile={bundle.profile} links={bundle.links} projects={bundle.projects} preview />
              </PhonePreviewFrame>
              <span className="mt-5 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">{t(patternLabelKey[style])}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="border-y border-border bg-secondary px-6 py-20 lg:px-10 lg:py-28"><div className="mx-auto max-w-[1320px]"><div className="mb-14 flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{t('why')}</p><h2 className="mt-4 max-w-[600px] text-4xl font-medium leading-tight tracking-[-0.06em] sm:text-5xl">{t('quiet')}</h2></div><p className="max-w-[290px] text-sm leading-6 text-muted-foreground">{t('lessNoise')}</p></div><div className="grid gap-px overflow-hidden rounded-2xl border border-[#d7d7d0] bg-[#d7d7d0] md:grid-cols-3">{features.map((feature) => <article key={feature.mark} className="bg-background p-7 lg:p-9"><span className="text-xs text-muted-foreground">{feature.mark}</span><h3 className="mt-20 text-xl font-medium tracking-[-0.04em]">{t(feature.title)}</h3><p className="mt-4 text-sm leading-6 text-muted-foreground">{t(feature.text)}</p></article>)}</div></div></section>

      <section id="how-it-works" className="mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-32"><div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]"><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{t('steps')}</p><h2 className="mt-4 text-4xl font-medium leading-tight tracking-[-0.06em] sm:text-5xl">{t('start')}</h2><Link href={user ? '/dashboard' : '/signup'} className="mt-8 inline-flex items-center gap-2 text-sm font-medium underline decoration-muted-foreground/60 underline-offset-8 hover:decoration-foreground">{user ? t('workspace') : t('createYours')} <ArrowUpRight className="size-4" /></Link></div><div className="divide-y divide-[#deded8] border-y border-border">{[t('account'), t('world'), t('share')].map((step, index) => <div className="flex items-center justify-between py-7" key={step}><div className="flex items-center gap-7"><span className="text-sm text-muted-foreground">0{index + 1}</span><span className="text-xl tracking-[-0.04em]">{step}</span></div><Play className="size-4 fill-current text-muted-foreground" /></div>)}</div></div></section>

      <section className="mx-6 mb-8 overflow-hidden rounded-[1.75rem] bg-[#20221f] px-6 py-16 text-primary-foreground sm:px-12 lg:mx-10 lg:px-20 lg:py-20"><div className="mx-auto flex max-w-[1180px] flex-col justify-between gap-10 md:flex-row md:items-end"><div><p className="text-xs uppercase tracking-[0.18em] text-[#a7aca4]">{t('chapter')}</p><h2 className="mt-4 max-w-[650px] text-4xl font-medium leading-[0.95] tracking-[-0.065em] sm:text-6xl">{t('deserves')}</h2></div><Link href={user ? '/dashboard' : '/signup'} className="shrink-0 rounded-full bg-primary-foreground px-6 py-4 text-center text-sm font-medium text-[#20221f] transition-transform hover:-translate-y-0.5">{user ? t('workspace') : t('create')} <ArrowUpRight className="ml-2 inline size-4" /></Link></div></section>

      <footer className="mx-auto flex max-w-[1320px] flex-col gap-8 px-6 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-10"><Link href="#top" className="font-semibold tracking-[-0.04em] text-foreground">pexiloq<span className="text-muted-foreground">.</span></Link><div className="flex flex-wrap gap-6"><Link href="#features" className="hover:text-foreground">{t('features')}</Link><Link href="#how-it-works" className="hover:text-foreground">{t('howItWorks')}</Link>{user ? <Link href="/dashboard" className="hover:text-foreground">{t('workspace')}</Link> : <><Link href="/login" className="hover:text-foreground">{t('login')}</Link><Link href="/signup" className="hover:text-foreground">{t('createYours')}</Link></>}</div><span>© 2026 Pexiloq</span></footer>
    </main>
  )
}

