import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { I18nProvider, TranslationMeta } from '@/components/i18n-provider'
import { WorkspaceProvider } from '@/components/pexiloq-app'
import { Noto_Sans_JP } from 'next/font/google'

const cjkFont = Noto_Sans_JP({ subsets: ['latin'], variable: '--font-cjk' })

export const metadata: Metadata = {
  title: 'Pexiloq — Everything you share, in one place.',
  description: 'Create a beautiful personal home for your links, projects, and everything that represents you.',
  generator: 'Pexiloq',
  icons: {
    icon: '/Pexiloq_Icon.png',
    shortcut: '/Pexiloq_Icon.png',
    apple: '/Pexiloq_Icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${cjkFont.variable} antialiased`}>
        <I18nProvider><WorkspaceProvider><TranslationMeta />{children}</WorkspaceProvider></I18nProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
