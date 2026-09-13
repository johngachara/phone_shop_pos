import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Fingerprint, Loader2, LogIn, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { Turnstile } from './Turnstile'
import { hasPasskey, passkeysSupported, registerPasskey, verifyPasskey } from './passkeys'
import { useAuth } from './useAuth'

type Step = 'password' | 'passkey' | 'enrol'

export default function LoginPage() {
  const navigate = useNavigate()
  const session = useAuth((s) => s.session)
  const isAlltech = useAuth((s) => s.isAlltech)
  const setPasskeyVerified = useAuth((s) => s.setPasskeyVerified)
  const signOut = useAuth((s) => s.signOut)

  const [step, setStep] = useState<Step>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onToken = useCallback((token: string) => setCaptchaToken(token), [])
  const onExpire = useCallback(() => setCaptchaToken(null), [])

  // A session that already exists still has to clear the second step.
  useEffect(() => {
    if (session && step === 'password') decideSecondStep()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

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
      setError('Could not check your passkeys. Try again.')
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
      setError(
        message.toLowerCase().includes('captcha')
          ? 'The security check expired. Please try again.'
          : 'Wrong email or password.',
      )
      // The token is spent whether or not sign-in worked. Without clearing it
      // the next attempt fails on the captcha and looks like a wrong password.
      setCaptchaToken(null)
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
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent text-accent-ink shadow-[var(--shadow-glow)]">
            <ShieldCheck className="size-7" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-semibold">Alltech POS</h1>
          <p className="mt-1 text-sm text-ink-3">
            {step === 'password' ? 'Sign in to the counter' : 'One more step'}
          </p>
        </div>

        <div className="surface rounded-2xl p-6">
          {step === 'password' ? (
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

              <Turnstile onToken={onToken} onExpire={onExpire} />

              {error ? <p className="text-sm text-danger">{error}</p> : null}

              <Button type="submit" size="lg" className="w-full" disabled={busy || !captchaToken}>
                {busy ? <Loader2 className="animate-spin" /> : <LogIn />}
                {busy ? 'Signing in' : 'Continue'}
              </Button>

              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="w-full text-center text-xs font-semibold text-ink-3 hover:text-ink"
              >
                Forgot your password?
              </button>
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
                onClick={() => { void signOut(); setStep('password') }}
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
