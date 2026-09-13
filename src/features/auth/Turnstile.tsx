import { useCallback, useEffect, useRef } from 'react'

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
export function Turnstile({
  onToken, onExpire,
}: {
  onToken: (token: string) => void
  onExpire: () => void
}) {
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

  return <div ref={container} className="min-h-[65px]" />
}

export function resetTurnstile() {
  // Exposed separately so a failed sign-in can clear the spent token without
  // the login form holding a ref into this component.
  const iframe = document.querySelector<HTMLIFrameElement>('iframe[src*="challenges.cloudflare.com"]')
  const id = iframe?.closest('[id]')?.id
  if (id && window.turnstile) {
    try {
      window.turnstile.reset(id)
    } catch {
      /* the widget may already be gone */
    }
  }
}
