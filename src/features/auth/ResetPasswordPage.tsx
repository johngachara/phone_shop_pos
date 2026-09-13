import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, LockKeyhole } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'

const MIN_LENGTH = 12

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Supabase turns the recovery link in the URL into a session. Until that
    // has happened there is nothing to update, and submitting would fail with
    // a confusing "not authenticated".
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setReady(true)
    })
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true) })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (password.length < MIN_LENGTH) {
      setError(`Use at least ${MIN_LENGTH} characters.`)
      return
    }
    if (password !== confirm) {
      setError('The two passwords do not match.')
      return
    }

    setBusy(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      // Sign out so the new password is actually used to sign back in, and the
      // passkey step runs again.
      await supabase.auth.signOut()
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the password')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="relative z-10 grid min-h-dvh place-items-center px-5 py-10">
      <div className="w-full max-w-sm rise">
        <div className="mb-8 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-surface-3 text-accent">
            <LockKeyhole className="size-7" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-semibold">Set a new password</h1>
        </div>

        <div className="surface rounded-2xl p-6">
          {!ready ? (
            <p className="text-center text-sm text-ink-3">
              Opening your reset link…
            </p>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <Field
                label="New password" htmlFor="new-password"
                hint={`At least ${MIN_LENGTH} characters.`}
              >
                <Input
                  id="new-password" type="password" required autoComplete="new-password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <Field label="Confirm password" htmlFor="confirm-password">
                <Input
                  id="confirm-password" type="password" required autoComplete="new-password"
                  value={confirm} onChange={(e) => setConfirm(e.target.value)}
                />
              </Field>

              {error ? <p className="text-sm text-danger">{error}</p> : null}

              <Button type="submit" size="lg" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : null}
                Update password
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
