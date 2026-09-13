import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'

export const TooltipProvider = TooltipPrimitive.Provider

/** Explanation attached to a control.
 *
 * Radix opens on hover and focus, which covers a mouse and a keyboard but not
 * a finger -- and this runs on shop tablets, where hover does not exist. So
 * touch gets an explicit long-press: hold the control for half a second and
 * the explanation appears, without the press turning into a tap.
 *
 * The label is still the accessible name; this is an addition to it, never a
 * replacement. A tooltip is not announced by every screen reader and is
 * invisible to anyone who never hovers.
 */
export function Tooltip({
  label, children, side = 'top',
}: {
  label: React.ReactNode
  children: React.ReactElement
  side?: 'top' | 'bottom' | 'left' | 'right'
}) {
  const [open, setOpen] = React.useState(false)
  const timer = React.useRef<number | null>(null)

  const cancel = React.useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  React.useEffect(() => cancel, [cancel])

  return (
    <TooltipPrimitive.Root open={open} onOpenChange={setOpen} delayDuration={350}>
      <TooltipPrimitive.Trigger
        asChild
        onTouchStart={() => {
          cancel()
          timer.current = window.setTimeout(() => setOpen(true), 500)
        }}
        onTouchEnd={() => {
          cancel()
          // Leave it up briefly after release so it can actually be read.
          if (open) window.setTimeout(() => setOpen(false), 1800)
        }}
        onTouchMove={cancel}
      >
        {children}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={8}
          collisionPadding={12}
          className={cn(
            'z-50 max-w-64 rounded-xl bg-surface-3 px-3 py-2 text-xs font-medium text-ink',
            'border border-line shadow-[var(--shadow-float)]',
            'data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0',
            'data-[state=delayed-open]:zoom-in-95',
          )}
        >
          {label}
          <TooltipPrimitive.Arrow className="fill-[var(--color-surface-3)]" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}
