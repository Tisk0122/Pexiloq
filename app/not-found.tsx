'use client'

import Link from 'next/link'
import { ArrowLeft, Home, Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background px-6 py-12 text-foreground text-center">
      <div className="relative flex flex-col items-center max-w-md mx-auto">
        <div className="grid size-20 place-items-center rounded-3xl bg-secondary text-primary shadow-xs">
          <Compass className="size-10 text-muted-foreground animate-pulse" />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">404 Error</p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">Page Not Found</h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          The page you are looking for doesn’t exist or has been moved to another location.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="size-4 mr-1.5" />
              Back to Home
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard">
              <ArrowLeft className="size-4 mr-1.5" />
              Go to Workspace
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
