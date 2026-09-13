import type { LucideIcon } from 'lucide-react'
import { Button } from './button'

/** Empty and error states.
 *
 * Both exist because a blank screen at a counter is indistinguishable from a
 * broken one, and the person using it cannot tell which. */
export function EmptyState({
  icon: Icon, title, body, action,
}: {
  icon: LucideIcon
  title: string
  body?: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="surface rounded-2xl px-6 py-14 text-center rise">
      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-surface-3 text-ink-3">
        <Icon className="size-5" />
      </div>
      <h3 className="mt-4 font-display text-base font-semibold text-ink">{title}</h3>
      {body ? <p className="mx-auto mt-1 max-w-sm text-sm text-ink-3">{body}</p> : null}
      {action ? (
        <Button className="mt-5" onClick={action.onClick}>{action.label}</Button>
      ) : null}
    </div>
  )
}

export function ErrorState({
  title = 'That did not load', body, onRetry,
}: {
  title?: string
  body?: string
  onRetry?: () => void
}) {
  return (
    <div className="rounded-2xl border border-danger/30 bg-danger/5 px-6 py-10 text-center">
      <h3 className="font-display text-base font-semibold text-danger">{title}</h3>
      {body ? <p className="mx-auto mt-1 max-w-sm text-sm text-ink-2">{body}</p> : null}
      {onRetry ? (
        <Button variant="secondary" className="mt-5" onClick={onRetry}>Try again</Button>
      ) : null}
    </div>
  )
}
