import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { cookies, headers } from 'next/headers'
import './globals.css'
import { I18nProvider, TranslationMeta, supportedLanguages, getLocalizedTagline, type Language } from '@/components/i18n-provider'
import { WorkspaceProvider } from '@/components/pexiloq-app'
import { Noto_Sans_JP } from 'next/font/google'
import { defaultDescription, defaultOgImage, defaultTitle, siteName, siteUrl } from '@/lib/site'

const cjkFont = Noto_Sans_JP({ subsets: ['latin'], variable: '--font-cjk' })

const ogLocales: Record<Language, string> = {
  en: 'en_US', ja: 'ja_JP', zh: 'zh_CN', ko: 'ko_KR', es: 'es_ES', fr: 'fr_FR', de: 'de_DE', pt: 'pt_PT', hi: 'hi_IN',
}

export async function generateMetadata(): Promise<Metadata> {
  const language = await resolveServerLanguage()
  // defaultTitle/defaultDescription stay as the English fallback used for
  // metadataBase-relative tooling and as the `en` case; every other supported
  // language gets its tab title from the same dictionary the client-side
  // language switcher uses, so the very first response already matches the
  // visitor's language instead of flashing English before hydration.
  const localizedTitle = language === 'en' ? defaultTitle : `${siteName} — ${getLocalizedTagline(language)}`
  return {
    metadataBase: new URL(siteUrl),
    title: { default: localizedTitle, template: `%s · ${siteName}` },
    description: defaultDescription,
    applicationName: siteName,
    generator: 'Pexiloq',
    keywords: ['Pexiloq', 'link in bio', 'personal page', 'portfolio', 'link tree', 'profile page'],
    referrer: 'origin-when-cross-origin',
    icons: {
      icon: [{ url: '/Pexiloq_Icon.png', type: 'image/png' }],
      shortcut: '/Pexiloq_Icon.png',
      apple: [{ url: '/Pexiloq_Icon.png', type: 'image/png' }],
    },
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      url: '/',
      siteName,
      title: localizedTitle,
      description: defaultDescription,
      images: [{ url: defaultOgImage, width: 1200, height: 630, alt: siteName }],
      locale: ogLocales[language] || 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: localizedTitle,
      description: defaultDescription,
      images: [defaultOgImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
  }
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

// Resolves the language to render <html lang="…"> with on the very first
// server-rendered response: the user's saved preference (cookie) takes
// priority, then the browser's Accept-Language header, then English. This is
// what makes the page (and the browser tab / translate prompt) start in the
// right language immediately — including for search engine crawlers, which
// never run the client-side language-detection effect at all.
async function resolveServerLanguage(): Promise<Language> {
  const cookieStore = await cookies()
  const cookieLang = cookieStore.get('pexiloq-language')?.value as Language | undefined
  if (cookieLang && supportedLanguages[cookieLang]) return cookieLang

  const headerList = await headers()
  const acceptLanguage = headerList.get('accept-language') || ''
  for (const tag of acceptLanguage.split(',')) {
    const code = tag.trim().split(';')[0].split('-')[0] as Language
    if (supportedLanguages[code]) return code
  }
  return 'en'
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const language = await resolveServerLanguage()
  return (
    <html lang={language} data-scroll-behavior="smooth">
      <body className={`${cjkFont.variable} antialiased`}>
        <I18nProvider serverLanguage={language}><WorkspaceProvider><TranslationMeta />{children}</WorkspaceProvider></I18nProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
