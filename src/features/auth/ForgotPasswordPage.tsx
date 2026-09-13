import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Loader2, MailCheck, KeyRound } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { Turnstile, type TurnstileHandle } from './Turnstile'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const turnstile = useRef<TurnstileHandle>(null)

  const onToken = useCallback((t: string) => setCaptchaToken(t), [])
  const onExpire = useCallback(() => setCaptchaToken(null), [])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
          ...(captchaToken ? { captchaToken } : {}),
        },
      )
      if (resetError) throw resetError
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the email')
      // Single-use token: without a reset the retry fails on the captcha.
      setCaptchaToken(null)
      turnstile.current?.reset()
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="relative z-10 grid min-h-dvh place-items-center px-5 py-10">
      <div className="w-full max-w-sm rise">
        <div className="mb-8 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-surface-3 text-accent">
            {sent ? <MailCheck className="size-7" /> : <KeyRound className="size-7" />}
          </div>
          <h1 className="mt-5 font-display text-2xl font-semibold">
            {sent ? 'Check your email' : 'Reset your password'}
          </h1>
        </div>

        <div className="surface rounded-2xl p-6">
          {sent ? (
            <div className="space-y-5 text-center">
              <p className="text-sm text-ink-2">
                If <span className="font-semibold text-ink">{email}</span> has an
                account, a reset link is on its way. The link expires in an hour.
              </p>
              <Button asChild variant="secondary" className="w-full">
                <Link to="/login"><ArrowLeft /> Back to sign in</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <Field
                label="Email"
                htmlFor="reset-email"
                hint="We will send a link to set a new password."
              >
                <Input
                  id="reset-email" type="email" required autoComplete="username"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@alltechnyeri.co.ke"
                />
              </Field>

              <Turnstile ref={turnstile} onToken={onToken} onExpire={onExpire} />

              {error ? <p className="text-sm text-danger">{error}</p> : null}

              <Button type="submit" size="lg" className="w-full" disabled={busy || !captchaToken}>
                {busy ? <Loader2 className="animate-spin" /> : null}
                Send reset link
              </Button>

              <Button asChild variant="ghost" className="w-full">
                <Link to="/login"><ArrowLeft /> Back to sign in</Link>
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
