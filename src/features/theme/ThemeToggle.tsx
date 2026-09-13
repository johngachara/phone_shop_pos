import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme, type ThemePreference } from './useTheme'

// Two options, not three. A third button did not fit the sidebar or the sheet
// and overflowed both. "System" is still the starting point -- until someone
// picks a side, the app follows the device -- it just is not a button.
const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
]

/** Light or dark.
 *
 * Before a choice is made the preference is "system" and the app follows the
 * device, so the shop still gets the right theme at dusk without anyone
 * touching this. Once someone picks, that sticks. */
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
