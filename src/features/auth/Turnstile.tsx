import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import { useTheme } from '@/features/theme/useTheme'

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      reset: (id: string) => void
      remove: (id: string) => void
    }
  }
}

/** The widget's own light/dark, resolved the same way the rest of the app is.
 *
 * `theme: 'auto'` follows the OS's prefers-color-scheme, not this app's
 * `data-theme` attribute -- so picking Light in-app while the device is set to
 * dark left the widget dark regardless. Resolving it the same way the CSS
 * does keeps the two in sync. */
function resolveTurnstileTheme(preference: 'light' | 'dark' | 'system'): 'light' | 'dark' {
  if (preference !== 'system') return preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Cloudflare Turnstile.
 *
 * The token is handed to Supabase as `options.captchaToken`, and Supabase
 * performs the siteverify call itself -- this project has CAPTCHA protection
 * switched on in its auth settings, which is why a password sign-in without a
 * token is rejected with `captcha_failed`. There is deliberately no siteverify
 * here: doing it in the browser would prove nothing, and the secret belongs to
 * Supabase, not to this app.
 *
 * Tokens are single use. `reset()` after every submit, or the next attempt
 * fails with `invalid-input-response` and looks like a wrong password. */
export interface TurnstileHandle {
  /** Discard the current token and issue a fresh one.
   *
   * Must be called after every failed submit. A Turnstile token is redeemed
   * exactly once, so re-submitting with the same one fails with
   * `invalid-input-response` -- which surfaces as "the security check expired"
   * even when the password was correct. */
  reset: () => void
}

export const Turnstile = forwardRef<TurnstileHandle, {
  onToken: (token: string) => void
  onExpire: () => void
}>(function Turnstile({ onToken, onExpire }, ref) {
  const container = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)
  const preference = useTheme((s) => s.preference)

  const render = useCallback(() => {
    if (!container.current || widgetId.current !== null) return
    if (!window.turnstile) return

    widgetId.current = window.turnstile.render(container.current, {
      sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY,
      callback: (token: string) => onToken(token),
      'expired-callback': () => onExpire(),
      'error-callback': () => onExpire(),
      theme: resolveTurnstileTheme(preference),
      size: 'flexible',
    })
  }, [onToken, onExpire, preference])

  // Turnstile has no API to re-theme a live widget, so a theme change while
  // the login screen is open has to tear it down and mount a fresh one rather
  // than leave it showing the theme it had when it first rendered.
  useEffect(() => {
    if (widgetId.current === null) return
    window.turnstile?.remove(widgetId.current)
    widgetId.current = null
    render()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preference])

  useEffect(() => {
    // The script is loaded with `defer` and may not have run yet when this
    // mounts, so poll briefly rather than rendering once and giving up.
    if (window.turnstile) {
      render()
    } else {
      const timer = window.setInterval(() => {
        if (window.turnstile) {
          window.clearInterval(timer)
          render()
        }
      }, 100)
      window.setTimeout(() => window.clearInterval(timer), 10_000)
      return () => window.clearInterval(timer)
    }
  }, [render])

  useEffect(
    () => () => {
      if (widgetId.current !== null) {
        window.turnstile?.remove(widgetId.current)
        widgetId.current = null
      }
    },
    [],
  )

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (widgetId.current !== null) {
        window.turnstile?.reset(widgetId.current)
      }
    },
  }), [])

  return <div ref={container} className="min-h-[65px]" />
})
