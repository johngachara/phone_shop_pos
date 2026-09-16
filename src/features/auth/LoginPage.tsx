import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Fingerprint, Loader2, LogIn } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { Turnstile, type TurnstileHandle } from './Turnstile'
import { hasPasskey, passkeysSupported, registerPasskey, verifyPasskey } from './passkeys'
import { useAuth } from './useAuth'

type Step = 'checking' | 'password' | 'passkey' | 'enrol'

export default function LoginPage() {
  const navigate = useNavigate()
  const session = useAuth((s) => s.session)
  const loading = useAuth((s) => s.loading)
  const isAlltech = useAuth((s) => s.isAlltech)
  const passkeyVerified = useAuth((s) => s.passkeyVerified)
  const setPasskeyVerified = useAuth((s) => s.setPasskeyVerified)
  const signOut = useAuth((s) => s.signOut)

  const [step, setStep] = useState<Step>('checking')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const turnstile = useRef<TurnstileHandle>(null)

  const onToken = useCallback((token: string) => setCaptchaToken(token), [])
  const onExpire = useCallback(() => setCaptchaToken(null), [])

  // Avoid racing past Turnstile or flashing the login form:
  // While auth is restoring (loading === true), stay in 'checking'.
  // Once settled:
  // - If already fully verified, route straight into the app.
  // - If session exists but unverified, cleanly determine second step without mounting Turnstile.
  // - If no session, present the password form and let Turnstile initialize.
  useEffect(() => {
    if (loading) {
      setStep('checking')
      return
    }

    if (session) {
      if (passkeyVerified) {
        navigate('/', { replace: true })
        return
      }
      decideSecondStep()
    } else {
      setStep('password')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, session, passkeyVerified, navigate])

  async function decideSecondStep() {
    if (!isAlltech) {
      // The account is real but belongs to another application on this shared
      // Supabase project. Say so plainly instead of leaving a blank screen.
      setError('This account does not have access to Alltech POS.')
      await signOut()
      setStep('password')
      return
    }
    try {
      const enrolled = await hasPasskey()
      setStep(enrolled ? 'passkey' : 'enrol')
    } catch {
      // Deliberately silent at this point. This runs when a stored session is
      // restored, before the person has typed anything, and a failure here --
      // an expired token, a dropped connection -- is not something they did.
      // Showing "could not check your passkeys" on a login screen nobody has
      // touched reads as though the app is broken, which is exactly what it
      // looked like.
      //
      // Enrolment is the safe fallback: if they already have a passkey the
      // device offers it, and if the list genuinely could not be read the
      // real error surfaces when they act.
      setStep('enrol')
    }
  }

  async function submitPassword(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
        // Supabase verifies this itself; the project has CAPTCHA protection on.
        options: captchaToken ? { captchaToken } : undefined,
      })
      if (signInError) throw signInError
      // Session arrives via onAuthStateChange, which triggers decideSecondStep.
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed'
      const lower = message.toLowerCase()

      if (lower.includes('captcha')) {
        // Distinguish the two causes. A rejected token with the widget working
        // almost always means the site key here and the secret configured in
        // Supabase belong to different Turnstile widgets, and telling someone
        // to "try again" for that just makes them do it forever.
        setError(
          'The security check was rejected. If this keeps happening, the ' +
          'Turnstile site key and the secret set in Supabase do not match.',
        )
      } else if (lower.includes('invalid login') || lower.includes('credentials')) {
        setError('Wrong email or password.')
      } else {
        setError(message)
      }

      // A Turnstile token is redeemed exactly once, whether or not sign-in
      // succeeded. Clearing the state is not enough -- the widget has to issue
      // a new one, or the next attempt resubmits a spent token and fails as a
      // captcha error no matter how correct the password is.
      setCaptchaToken(null)
      turnstile.current?.reset()
    } finally {
      setBusy(false)
    }
  }

  async function doPasskey(enrol: boolean) {
    setError(null)
    setBusy(true)
    try {
      if (enrol) {
        await registerPasskey(navigator.userAgent.slice(0, 60))
      }
      await verifyPasskey()
      setPasskeyVerified(true)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Passkey check failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="relative z-10 grid min-h-dvh place-items-center px-5 py-10">
      <div className="w-full max-w-sm rise">
        <div className="mb-8 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-accent text-accent-ink shadow-[var(--shadow-glow)]">
            <Logo className="size-9" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-semibold">Alltech POS</h1>
          <p className="mt-1 text-sm text-ink-3">
            {step === 'checking'
              ? 'Checking session...'
              : step === 'password'
                ? 'Sign in to the counter'
                : 'One more step'}
          </p>
        </div>

        <div className="surface rounded-2xl p-6">
          {step === 'checking' ? (
            <div className="space-y-4 py-8 text-center">
              <Loader2 className="mx-auto size-8 animate-spin text-accent" />
              <p className="text-sm font-medium text-ink-3">Verifying session...</p>
            </div>
          ) : step === 'password' ? (
            <form onSubmit={submitPassword} className="space-y-4">
              <Field label="Email" htmlFor="email">
                <Input
                  id="email" type="email" autoComplete="username" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@alltechnyeri.co.ke"
                />
              </Field>
              <Field label="Password" htmlFor="password">
                <Input
                  id="password" type="password" autoComplete="current-password" required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
              </Field>

              <Turnstile ref={turnstile} onToken={onToken} onExpire={onExpire} />

              {error ? <p className="text-sm text-danger">{error}</p> : null}

              <Button type="submit" size="lg" className="w-full" disabled={busy || !captchaToken}>
                {busy ? <Loader2 className="animate-spin" /> : <LogIn />}
                {busy ? 'Signing in' : 'Continue'}
              </Button>

              {/* No self-service reset: staff use addresses on the shop's
                  domain and have no mailbox to receive a link. A manager sets
                  passwords from the Users page instead. */}
              <p className="text-center text-xs text-ink-3">
                Forgotten your password? Ask a manager to set a new one.
              </p>
            </form>
          ) : (
            <div className="space-y-5 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-surface-3 text-accent">
                <Fingerprint className="size-6" />
              </div>
              <div>
                <h2 className="font-display text-base font-semibold">
                  {step === 'enrol' ? 'Set up your passkey' : 'Confirm it is you'}
                </h2>
                <p className="mt-1 text-sm text-ink-3">
                  {step === 'enrol'
                    ? 'Add this device as your second step. You will use it every time you sign in here.'
                    : 'Use your fingerprint, face or device PIN to finish signing in.'}
                </p>
              </div>

              {!passkeysSupported() ? (
                <p className="text-sm text-danger">
                  This browser does not support passkeys. Use Chrome or Safari on this device.
                </p>
              ) : null}

              {error ? <p className="text-sm text-danger">{error}</p> : null}

              <Button
                size="lg" className="w-full"
                disabled={busy || !passkeysSupported()}
                onClick={() => doPasskey(step === 'enrol')}
              >
                {busy ? <Loader2 className="animate-spin" /> : <Fingerprint />}
                {step === 'enrol' ? 'Create passkey' : 'Unlock'}
              </Button>

              <button
                type="button"
                onClick={async () => {
                  setBusy(true)
                  await signOut()
                  setBusy(false)
                  setStep('password')
                }}
                className="w-full text-xs font-semibold text-ink-3 hover:text-ink"
              >
                Sign in as someone else
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
