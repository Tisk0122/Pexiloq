'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertOctagon, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error)
  }, [error])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background px-6 py-12 text-foreground text-center">
      <div className="relative flex flex-col items-center max-w-md mx-auto">
        <div className="grid size-20 place-items-center rounded-3xl bg-destructive/10 text-destructive shadow-xs">
          <AlertOctagon className="size-10" />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.24em] text-destructive">500 Application Error</p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">Something went wrong</h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          An unexpected error occurred while processing your request. Don’t worry, your data is safe.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={reset} variant="default">
            <RefreshCw className="size-4 mr-1.5" />
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="size-4 mr-1.5" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
