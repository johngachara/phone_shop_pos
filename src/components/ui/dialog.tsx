import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

export function DialogContent({
  className, children, ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]
                   data-[state=open]:animate-in data-[state=open]:fade-in-0"
      />
      <DialogPrimitive.Content
        className={cn(
          'fixed z-50 surface shadow-[var(--shadow-float)]',
          // A sheet from the bottom on phones, a centred panel from sm up.
          // Reaching the top of a tablet one-handed at a counter is awkward.
          'inset-x-0 bottom-0 rounded-t-2xl rounded-b-none pb-[env(safe-area-inset-bottom)]',
          'sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-lg',
          'sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl',
          'max-h-[90dvh] overflow-y-auto',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className="absolute right-4 top-4 rounded-lg p-2 text-ink-3 hover:bg-surface-2 hover:text-ink"
          aria-label="Close"
        >
          <X className="size-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 pt-5 pb-3 pr-14', className)} {...props} />
}

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('font-display text-lg font-semibold text-ink', className)}
    {...props}
  />
))
DialogTitle.displayName = 'DialogTitle'

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('mt-1 text-sm text-ink-2', className)}
    {...props}
  />
))
DialogDescription.displayName = 'DialogDescription'

export function DialogBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 pb-2', className)} {...props} />
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse gap-2 px-5 py-4 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  )
}
