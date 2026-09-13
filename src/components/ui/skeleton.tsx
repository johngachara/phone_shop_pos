import { cn } from '@/lib/utils'

/** Placeholder shaped like the content it replaces.
 *
 * A spinner tells someone the app is busy; a skeleton tells them what is about
 * to appear and stops the page jumping when it does. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-surface-3', className)}
      aria-hidden
    />
  )
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="surface rounded-2xl p-4 flex items-center gap-4">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-24 rounded-lg" />
        </div>
      ))}
    </div>
  )
}
