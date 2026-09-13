import { create } from 'zustand'

export type ThemePreference = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'alltech-theme'

interface ThemeState {
  preference: ThemePreference
  setPreference: (value: ThemePreference) => void
}

/** Apply the preference to the document.
 *
 * "system" removes the attribute rather than resolving it to a concrete value.
 * The stylesheet already answers prefers-color-scheme, so leaving it off means
 * the page follows the device live -- including when the device flips to dark
 * at dusk while the app is open, which a resolved value would miss. */
function apply(preference: ThemePreference) {
  const root = document.documentElement
  if (preference === 'system') {
    root.removeAttribute('data-theme')
  } else {
    root.setAttribute('data-theme', preference)
  }
}

function read(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    // Private mode and some locked-down Android browsers throw on access.
  }
  return 'system'
}

export const useTheme = create<ThemeState>((set) => ({
  preference: 'system',
  setPreference: (value) => {
    apply(value)
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // Not being able to remember the choice is not a reason to refuse it.
    }
    set({ preference: value })
  },
}))

/** Restore the saved preference. Called once at start-up.
 *
 * A matching inline script in index.html applies it before first paint; this
 * only syncs the store so the UI shows the right option selected. */
export function initTheme() {
  const preference = read()
  apply(preference)
  useTheme.setState({ preference })
}
