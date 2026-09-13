import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const button = cva(
  // min-h-11 throughout: this is driven with thumbs on a counter, and anything
  // smaller than ~44px is a mis-tap waiting to happen mid-sale.
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ' +
    'min-h-11 px-4 transition-[transform,background-color,box-shadow,opacity] duration-150 ' +
    'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 ' +
    '[&_svg]:size-4 [&_svg]:shrink-0 select-none',
  {
    variants: {
      variant: {
        primary:
          'bg-accent text-accent-ink shadow-[var(--shadow-glow)] hover:brightness-110',
        secondary:
          'bg-surface-2 text-ink border border-line hover:bg-surface-3',
        ghost: 'text-ink-2 hover:bg-surface-2 hover:text-ink',
        danger: 'bg-danger text-white hover:brightness-110',
        outline: 'border border-line text-ink hover:bg-surface-2',
      },
      size: {
        sm: 'min-h-9 px-3 text-xs rounded-lg',
        md: '',
        lg: 'min-h-13 px-6 text-base rounded-2xl',
        icon: 'min-h-11 w-11 px-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp ref={ref} className={cn(button({ variant, size }), className)} {...props} />
  },
)
Button.displayName = 'Button'
