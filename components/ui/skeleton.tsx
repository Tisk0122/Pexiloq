import * as React from 'react'
import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-lg bg-muted/70', className)}
      {...props}
    />
  )
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <div className="space-y-2 pt-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col items-center space-y-4 text-center py-8">
      <Skeleton className="size-24 rounded-full" />
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-64" />
      <div className="w-full max-w-sm space-y-3 pt-4">
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>
    </div>
  )
}

export { Skeleton, CardSkeleton, ProfileSkeleton }
