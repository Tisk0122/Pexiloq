'use client'

import Link from 'next/link'
import { ArrowUpRight, Check, Copy, ExternalLink, Menu, Play, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { LanguageSwitcher, useI18n } from '@/components/i18n-provider'
import { fallbackTemplate, useAuth } from '@/components/pexiloq-app'

const linkIcons = ['✦', '▶', '◎']

const features = [
  { title: 'together', text: 'togetherText', mark: '01' },
  { title: 'yours', text: 'yoursText', mark: '02' },
  { title: 'next', text: 'nextText', mark: '03' },
]

export default function Page() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const { t, language } = useI18n()
  const { user, loading: authLoading } = useAuth()
  const template = fallbackTemplate(language)

  const copyProfile = async () => {
    await navigator.clipboard?.writeText('pexiloq.com/amira')
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

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
      {menuOpen && <nav className="mx-6 flex flex-col gap-4 border-t border-[#dcdcd6] py-5 text-sm md:hidden">{authLoading ? <div className="h-10 animate-pulse rounded-lg bg-[#e2e2db]" /> : user ? <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="font-semibold">{t('workspace')} <ArrowUpRight className="inline size-4" /></Link> : <><Link href="#features" onClick={() => setMenuOpen(false)}>{t('features')}</Link><Link href="#how-it-works" onClick={() => setMenuOpen(false)}>{t('howItWorks')}</Link><Link href="#profiles" onClick={() => setMenuOpen(false)}>{t('explore')}</Link><LanguageSwitcher /><Link href="/login" onClick={() => setMenuOpen(false)}>{t('login')}</Link><Link href="/signup" onClick={() => setMenuOpen(false)} className="font-semibold">{t('create')} <ArrowUpRight className="inline size-4" /></Link></>}</nav>}

      <section id="top" className="mx-auto grid max-w-[1320px] gap-16 px-6 pb-24 pt-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-10 lg:pb-32 lg:pt-24">
        <div className="max-w-[650px]">
          <div className="mb-8 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.18em] text-[#8c8c86]"><span className="h-px w-8 bg-[#b7b7b0]" /> {t('heroKicker')}</div>
          <h1 className="max-w-[680px] text-balance text-[clamp(3.7rem,7.4vw,7.25rem)] font-medium leading-[0.9] tracking-[-0.085em]">{t('heroTitle')}</h1>
          <p className="mt-9 max-w-[500px] text-pretty text-lg leading-8 text-[#686864]">{t('heroBody')}</p>
          <div className="mt-10 flex flex-wrap items-center gap-4"><Link href={user ? '/dashboard' : '/signup'} className="rounded-full bg-[#171717] px-6 py-4 text-sm font-medium text-[#f5f5f2] transition-transform hover:-translate-y-0.5">{user ? t('workspace') : t('create')} <ArrowUpRight className="ml-2 inline size-4" /></Link><Link href="#profiles" className="group flex items-center gap-2 px-2 py-4 text-sm font-medium text-[#686864]">{t('seeFeels')} <span className="transition-transform group-hover:translate-x-1">→</span></Link></div>
        </div>
        <div id="profiles" className="relative lg:pl-8">
          <div className="relative mx-auto max-w-[510px] rotate-[2.5deg] rounded-[2rem] border border-[#dadad3] bg-[#fbfbf8] p-4 shadow-[0_28px_80px_rgba(35,35,30,0.12)] transition-transform duration-500 hover:rotate-0 sm:p-6">
            <div className="flex items-center justify-between border-b border-[#e3e3dd] pb-4 text-[10px] uppercase tracking-[0.18em] text-[#a0a09a]"><span>pexiloq.com / {template.profile.username}</span><button onClick={copyProfile} className="flex items-center gap-1.5 hover:text-[#171717]" aria-label="Copy profile link">{copied ? <Check className="size-3" /> : <Copy className="size-3" />} {copied ? t('copied') : t('shareButton')}</button></div>
            <div className="px-4 pb-6 pt-9 text-center sm:px-10"><div className="mx-auto grid size-20 place-items-center rounded-full bg-[#d8d2c5] text-2xl font-medium text-[#5a554c]">{template.profile.displayName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}</div><h2 className="mt-5 text-2xl font-medium tracking-[-0.05em]">{template.profile.displayName}</h2><p className="mt-1 text-sm text-[#8a8a84]">{template.profile.headline}</p><p className="mx-auto mt-5 max-w-[310px] text-sm leading-6 text-[#686864]">{template.profile.bio}</p>
              <div className="mt-7 flex justify-center gap-4 text-xs font-medium text-[#8a8a84]" aria-label="Social profiles"><X className="size-4" /><span aria-hidden="true">ig</span><span aria-hidden="true">gh</span><span aria-hidden="true">in</span></div>
              <div className="mt-8 space-y-3">{template.links.map((link, i) => <a key={link.id} href="#" className="group flex items-center justify-between rounded-xl border border-[#e3e3dd] bg-white px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#b8b8b0] hover:shadow-sm"><span className="flex items-center gap-3"><span className="grid size-7 place-items-center rounded-lg bg-[#f0f0eb] text-xs text-[#74746d]">{linkIcons[i]}</span><span><span className="block text-sm font-medium">{link.title}</span><span className="mt-1 block text-[11px] text-[#a0a09a]">{link.url.replace(/^https?:\/\//, '').replace(/^www\./, '')} / pexiloq</span></span></span><ExternalLink className="size-4 text-[#b0b0a9] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></a>)}</div>
              <div className="mt-8 grid grid-cols-2 gap-3 text-left"><div className="h-24 rounded-xl bg-[#252525] p-3 text-[#f4f2ec]"><span className="text-[10px] uppercase tracking-widest text-[#aaa9a1]">{t('selectedWork')}</span><p className="mt-7 text-sm font-medium">{template.projects[0]?.title}</p></div><div className="h-24 rounded-xl bg-[#d9e2dc] p-3 text-[#31423a]"><span className="text-[10px] uppercase tracking-widest text-[#6e8176]">{t('nowExploring')}</span><p className="mt-7 text-sm font-medium">{template.projects[1]?.title}</p></div></div>
            </div><div className="flex items-center justify-center border-t border-[#e3e3dd] pt-4 text-[10px] text-[#aaa9a1]">{t('made')} <span className="mx-1 font-semibold text-[#686864]">pexiloq</span></div>
          </div>
          <div className="absolute -bottom-8 -left-2 hidden rounded-2xl border border-[#dcdcd6] bg-[#fbfbf8] px-4 py-3 text-xs shadow-[0_12px_35px_rgba(35,35,30,0.08)] sm:block"><Sparkles className="mr-2 inline size-3 text-[#a7926f]" /> {t('shareOneLink')}</div>
        </div>
      </section>

      <section id="features" className="border-y border-[#deded8] bg-[#eeeee9] px-6 py-20 lg:px-10 lg:py-28"><div className="mx-auto max-w-[1320px]"><div className="mb-14 flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-[#999991]">{t('why')}</p><h2 className="mt-4 max-w-[600px] text-4xl font-medium leading-tight tracking-[-0.06em] sm:text-5xl">{t('quiet')}</h2></div><p className="max-w-[290px] text-sm leading-6 text-[#777771]">{t('lessNoise')}</p></div><div className="grid gap-px overflow-hidden rounded-2xl border border-[#d7d7d0] bg-[#d7d7d0] md:grid-cols-3">{features.map((feature) => <article key={feature.mark} className="bg-[#f5f5f2] p-7 lg:p-9"><span className="text-xs text-[#aaa9a1]">{feature.mark}</span><h3 className="mt-20 text-xl font-medium tracking-[-0.04em]">{t(feature.title)}</h3><p className="mt-4 text-sm leading-6 text-[#777771]">{t(feature.text)}</p></article>)}</div></div></section>

      <section id="how-it-works" className="mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-32"><div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]"><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-[#999991]">{t('steps')}</p><h2 className="mt-4 text-4xl font-medium leading-tight tracking-[-0.06em] sm:text-5xl">{t('start')}</h2><Link href={user ? '/dashboard' : '/signup'} className="mt-8 inline-flex items-center gap-2 text-sm font-medium underline decoration-[#b6b6ae] underline-offset-8 hover:decoration-[#171717]">{user ? t('workspace') : t('createYours')} <ArrowUpRight className="size-4" /></Link></div><div className="divide-y divide-[#deded8] border-y border-[#deded8]">{[t('account'), t('world'), t('share')].map((step, index) => <div className="flex items-center justify-between py-7" key={step}><div className="flex items-center gap-7"><span className="text-sm text-[#aaa9a1]">0{index + 1}</span><span className="text-xl tracking-[-0.04em]">{step}</span></div><Play className="size-4 fill-current text-[#aaa9a1]" /></div>)}</div></div></section>

      <section className="mx-6 mb-8 overflow-hidden rounded-[1.75rem] bg-[#20221f] px-6 py-16 text-[#f5f5f2] sm:px-12 lg:mx-10 lg:px-20 lg:py-20"><div className="mx-auto flex max-w-[1180px] flex-col justify-between gap-10 md:flex-row md:items-end"><div><p className="text-xs uppercase tracking-[0.18em] text-[#a7aca4]">{t('chapter')}</p><h2 className="mt-4 max-w-[650px] text-4xl font-medium leading-[0.95] tracking-[-0.065em] sm:text-6xl">{t('deserves')}</h2></div><Link href={user ? '/dashboard' : '/signup'} className="shrink-0 rounded-full bg-[#f5f5f2] px-6 py-4 text-center text-sm font-medium text-[#20221f] transition-transform hover:-translate-y-0.5">{user ? t('workspace') : t('create')} <ArrowUpRight className="ml-2 inline size-4" /></Link></div></section>

      <footer className="mx-auto flex max-w-[1320px] flex-col gap-8 px-6 py-10 text-sm text-[#8a8a84] sm:flex-row sm:items-center sm:justify-between lg:px-10"><Link href="#top" className="font-semibold tracking-[-0.04em] text-[#151515]">pexiloq<span className="text-[#aaa9a1]">.</span></Link><div className="flex flex-wrap gap-6"><Link href="#features" className="hover:text-[#151515]">{t('features')}</Link><Link href="#how-it-works" className="hover:text-[#151515]">{t('howItWorks')}</Link>{user ? <Link href="/dashboard" className="hover:text-[#151515]">{t('workspace')}</Link> : <><Link href="/login" className="hover:text-[#151515]">{t('login')}</Link><Link href="/signup" className="hover:text-[#151515]">{t('createYours')}</Link></>}</div><span>© 2026 Pexiloq</span></footer>
    </main>
  )
}

