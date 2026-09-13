import { Monitor, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme, type ThemePreference } from './useTheme'

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

/** Three-way theme control.
 *
 * A segmented control rather than a toggle, because "follow the device" is a
 * real third choice and the shop wants it: the counter is dark most of the day
 * and bright when the sun comes through the front, and the device already
 * knows which. */
export function ThemeToggle({ className }: { className?: string }) {
  const preference = useTheme((s) => s.preference)
  const setPreference = useTheme((s) => s.setPreference)

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn('flex gap-1 rounded-xl bg-surface-2 p-1', className)}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = preference === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setPreference(value)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-colors',
              active ? 'bg-surface text-accent shadow-[var(--shadow-lift)]' : 'text-ink-3 hover:text-ink',
            )}
          >
            <Icon className="size-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
