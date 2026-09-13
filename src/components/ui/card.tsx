import * as React from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('surface rounded-2xl', className)} {...props} />
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 pt-5 pb-3', className)} {...props} />
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-base font-semibold text-ink', className)} {...props} />
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 pb-5', className)} {...props} />
}

/** A single headline figure. Used across the analytics tab. */
export function Stat({
  label, value, sub, tone = 'default',
}: {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  tone?: 'default' | 'accent' | 'warn'
}) {
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-3">{label}</p>
      <p
        className={cn(
          'mt-2 font-display text-2xl font-semibold tnum',
          tone === 'accent' && 'text-accent',
          tone === 'warn' && 'text-warn',
        )}
      >
        {value}
      </p>
      {sub ? <p className="mt-1 text-xs text-ink-3">{sub}</p> : null}
    </Card>
  )
}
