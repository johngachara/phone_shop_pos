import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      reset: (id: string) => void
      remove: (id: string) => void
    }
  }
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

  const render = useCallback(() => {
    if (!container.current || widgetId.current !== null) return
    if (!window.turnstile) return

    widgetId.current = window.turnstile.render(container.current, {
      sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY,
      callback: (token: string) => onToken(token),
      'expired-callback': () => onExpire(),
      'error-callback': () => onExpire(),
      theme: 'auto',
      size: 'flexible',
    })
  }, [onToken, onExpire])

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
