import * as React from 'react'
import { cn } from '@/lib/utils'
import { scrollInputIntoView } from '@/lib/useMobileKeyboardScroll'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, onFocus, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      onFocus={(e) => {
        scrollInputIntoView(e.currentTarget)
        onFocus?.(e)
      }}
      className={cn(
        'w-full min-h-11 rounded-xl bg-surface-2 border border-line px-3.5 text-sm text-ink',
        'placeholder:text-ink-3 transition-colors',
        'focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25',
        'disabled:opacity-50',
        // 16px on mobile stops iOS zooming the viewport on focus, which on a
        // tablet leaves the till stuck at the wrong scale mid-sale.
        'text-[16px] sm:text-sm',
        type === 'number' && 'tnum',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

export function Field({
  label, hint, error, children, htmlFor,
}: {
  label: string
  hint?: string
  error?: string | null
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-xs font-semibold text-ink-2 tracking-wide">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-3">{hint}</p>
      ) : null}
    </div>
  )
}
