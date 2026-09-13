import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badge = cva(
  'inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide',
  {
    variants: {
      tone: {
        neutral: 'bg-surface-3 text-ink-2',
        accent: 'bg-accent/15 text-accent',
        danger: 'bg-danger/15 text-danger',
        warn: 'bg-warn/15 text-warn',
        info: 'bg-info/15 text-info',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

export function Badge({
  className, tone, ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badge>) {
  return <span className={cn(badge({ tone }), className)} {...props} />
}

/** Stock level, coloured by urgency.
 *
 * The number alone is not enough at a glance on a busy counter; the colour is
 * what makes "about to run out" visible while scrolling. */
export function StockLevel({ quantity }: { quantity: number }) {
  const tone = quantity <= 0 ? 'danger' : quantity <= 3 ? 'warn' : 'accent'
  const label = quantity <= 0 ? 'Out' : quantity <= 3 ? `${quantity} left` : `${quantity} in stock`
  return <Badge tone={tone} className="tnum">{label}</Badge>
}
