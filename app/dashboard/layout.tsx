import type { Metadata } from 'next'

// The dashboard is a signed-in, per-account workspace — it should never be
// indexed or show up in search results / link previews.
export const metadata: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
