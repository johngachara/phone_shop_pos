import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Fingerprint, KeyRound, Loader2, ShieldCheck, UserMinus, UserPlus, Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ListSkeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/ui/empty'
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Tooltip } from '@/components/ui/tooltip'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatDate } from '@/lib/utils'
import { useAuth } from '@/features/auth/useAuth'

interface AlltechUser {
  id: string
  email: string
  role: 'employee' | 'manager' | null
  is_alltech: boolean
  created_at: string
  last_sign_in_at: string | null
  passkey_count: number
}

const MIN_PASSWORD = 12

export default function UsersPage() {
  const queryClient = useQueryClient()
  const myId = useAuth((s) => s.session?.user?.id)
  const [adding, setAdding] = useState(false)
  const [revoking, setRevoking] = useState<AlltechUser | null>(null)
  const [settingPassword, setSettingPassword] = useState<AlltechUser | null>(null)
  const [clearingPasskeys, setClearingPasskeys] = useState<AlltechUser | null>(null)

  const users = useQuery({
    queryKey: ['users'],
    queryFn: () => api<{ users: AlltechUser[] }>('/api/users/').then((b) => b.users),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users'] })

  const changeRole = useMutation({
    mutationFn: ({ user, role }: { user: AlltechUser; role: 'employee' | 'manager' }) =>
      api(`/api/users/${user.id}/`, { method: 'PATCH', json: { role } }),
    onSuccess: () => { toast.success('Role updated'); invalidate() },
    onError: (error) => toast.error(error.message),
  })

  const clearPasskeys = useMutation({
    mutationFn: (user: AlltechUser) =>
      api<{ removed: number }>(`/api/users/${user.id}/passkeys/`, { method: 'DELETE' }),
    onSuccess: (result) => {
      toast.success(
        result.removed
          ? `Removed ${result.removed} passkey${result.removed === 1 ? '' : 's'}`
          : 'They had no passkeys',
      )
      invalidate()
      setClearingPasskeys(null)
    },
    onError: (error) => toast.error(error.message),
  })

  const revoke = useMutation({
    mutationFn: (user: AlltechUser) => api(`/api/users/${user.id}/`, { method: 'DELETE' }),
    onSuccess: () => { toast.success('Access revoked'); invalidate(); setRevoking(null) },
    onError: (error) => toast.error(error.message),
  })

  const list = users.data ?? []

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Who can sign in to the POS, and what they can see."
        action={
          <Tooltip label="Create an account for a new member of staff. They sign in with this email and password, then set up a passkey.">
            <Button onClick={() => setAdding(true)}><UserPlus /> Add user</Button>
          </Tooltip>
        }
      />

      {users.isLoading ? (
        <ListSkeleton rows={3} />
      ) : users.isError ? (
        <ErrorState body={(users.error as Error).message} onRetry={() => void users.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState icon={Users} title="No users yet"
          action={{ label: 'Add user', onClick: () => setAdding(true) }} />
      ) : (
        <ul className="space-y-2">
          {list.map((user) => {
            const isMe = user.id === myId
            return (
              <Card key={user.id} className="rise p-4">
                <li className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-semibold">
                      <span className="break-all">{user.email}</span>
                      {isMe ? <Badge tone="neutral">You</Badge> : null}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-3">
                      {user.last_sign_in_at
                        ? `Last signed in ${formatDate(user.last_sign_in_at)}`
                        : 'Has never signed in'}
                      {' · '}
                      {user.passkey_count > 0
                        ? `${user.passkey_count} passkey${user.passkey_count === 1 ? '' : 's'}`
                        : 'no passkey yet'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* A manager cannot demote or remove themselves. Either can
                        leave the shop with no manager and nobody able to undo
                        it -- the API refuses both as well. */}
                    <Tooltip
                      label={
                        isMe
                          ? 'You cannot change your own role. Ask another manager.'
                          : user.role === 'manager'
                            ? 'Managers see analytics, profit and user management.'
                            : 'Employees can only run the till: stock, sales and accessories.'
                      }
                    >
                      <select
                        value={user.role ?? ''}
                        disabled={isMe || changeRole.isPending}
                        onChange={(e) =>
                          changeRole.mutate({
                            user, role: e.target.value as 'employee' | 'manager',
                          })
                        }
                        aria-label={`Role for ${user.email}`}
                        className="min-h-11 rounded-xl border border-line bg-surface-2 px-3 text-sm font-semibold text-ink disabled:opacity-50"
                      >
                        <option value="employee">Employee</option>
                        <option value="manager">Manager</option>
                      </select>
                    </Tooltip>

                    <Tooltip label="Set a new password for this person and tell them what it is. There is no reset email.">
                      <Button
                        size="icon" variant="secondary"
                        onClick={() => setSettingPassword(user)}
                        aria-label={`Set password for ${user.email}`}
                      >
                        <KeyRound />
                      </Button>
                    </Tooltip>

                    <Tooltip
                      label={
                        user.passkey_count > 0
                          ? 'Remove their passkeys, so they can set one up again on a new device. Use this when someone loses their phone.'
                          : 'They have no passkey registered. They will be asked to create one next time they sign in.'
                      }
                    >
                      <Button
                        size="icon" variant="secondary"
                        disabled={user.passkey_count === 0}
                        onClick={() => setClearingPasskeys(user)}
                        aria-label={`Clear passkeys for ${user.email}`}
                      >
                        <Fingerprint />
                      </Button>
                    </Tooltip>

                    <Tooltip
                      label={
                        isMe
                          ? 'You cannot revoke your own access.'
                          : 'Stop this person signing in to the POS. Their Supabase account is left alone, since it may belong to another system.'
                      }
                    >
                      <Button
                        size="icon" variant="secondary"
                        disabled={isMe}
                        onClick={() => setRevoking(user)}
                        aria-label={`Revoke access for ${user.email}`}
                      >
                        <UserMinus />
                      </Button>
                    </Tooltip>
                  </div>
                </li>
              </Card>
            )
          })}
        </ul>
      )}

      <AddUserDialog open={adding} onOpenChange={setAdding} onDone={invalidate} />

      <SetPasswordDialog
        user={settingPassword}
        onOpenChange={(o) => !o && setSettingPassword(null)}
        onDone={invalidate}
      />

      <Dialog
        open={clearingPasskeys !== null}
        onOpenChange={(o) => !o && setClearingPasskeys(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove passkeys for {clearingPasskeys?.email}?</DialogTitle>
            <DialogDescription>
              They will be asked to set up a new passkey the next time they sign
              in. Do this when someone has lost the device they registered — a
              passkey lives on one device, and without it they cannot get past
              the second step.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setClearingPasskeys(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={clearPasskeys.isPending}
              onClick={() => clearingPasskeys && clearPasskeys.mutate(clearingPasskeys)}
            >
              {clearPasskeys.isPending ? <Loader2 className="animate-spin" /> : null}
              Remove passkeys
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={revoking !== null} onOpenChange={(o) => !o && setRevoking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke access for {revoking?.email}?</DialogTitle>
            <DialogDescription>
              They will no longer be able to sign in to the POS. Their Supabase
              account itself is not deleted, because it may be used by another
              system. You can grant access again later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRevoking(null)}>Cancel</Button>
            <Button variant="danger" disabled={revoke.isPending}
              onClick={() => revoking && revoke.mutate(revoking)}>
              {revoke.isPending ? <Loader2 className="animate-spin" /> : null}
              Revoke access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function AddUserDialog({
  open, onOpenChange, onDone,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onDone: () => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'employee' | 'manager'>('employee')

  const create = useMutation({
    mutationFn: () =>
      api('/api/users/', {
        method: 'POST',
        json: { email: email.trim().toLowerCase(), password, role },
      }),
    onSuccess: () => {
      toast.success('User created')
      onDone()
      onOpenChange(false)
      setEmail(''); setPassword(''); setRole('employee')
    },
    onError: (error) => toast.error(error.message),
  })

  const tooShort = password.length > 0 && password.length < MIN_PASSWORD
  const valid = email.includes('@') && password.length >= MIN_PASSWORD

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a user</DialogTitle>
          <DialogDescription>
            They sign in with this email and password, then set up a passkey on
            their own device.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <Field label="Email" hint="Also used for password resets.">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="name@alltechnyeri.co.ke" autoComplete="off" />
          </Field>
          <Field
            label="Temporary password"
            hint={`At least ${MIN_PASSWORD} characters. Ask them to change it after signing in.`}
            error={tooShort ? `Too short — ${MIN_PASSWORD} characters or more.` : null}
          >
            <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)}
              autoComplete="off" />
          </Field>
          <Field label="Role">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'employee' | 'manager')}
              className="min-h-11 w-full rounded-xl border border-line bg-surface-2 px-3 text-sm font-semibold text-ink"
            >
              <option value="employee">Employee — till only</option>
              <option value="manager">Manager — everything, including money</option>
            </select>
          </Field>
          <p className="flex items-start gap-2 rounded-xl bg-surface-2 px-4 py-3 text-xs text-ink-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" />
            Only Alltech users created here can reach the POS. Other accounts on
            the same Supabase project are rejected.
          </p>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!valid || create.isPending} onClick={() => create.mutate()}>
            {create.isPending ? <Loader2 className="animate-spin" /> : null}
            Create user
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


function SetPasswordDialog({
  user, onOpenChange, onDone,
}: {
  user: AlltechUser | null
  onOpenChange: (o: boolean) => void
  onDone: () => void
}) {
  const [password, setPassword] = useState('')

  const save = useMutation({
    mutationFn: () =>
      api(`/api/users/${user!.id}/password/`, { method: 'POST', json: { password } }),
    onSuccess: () => {
      toast.success('Password set. Tell them what it is.')
      onDone()
      onOpenChange(false)
      setPassword('')
    },
    onError: (error) => toast.error(error.message),
  })

  const tooShort = password.length > 0 && password.length < MIN_PASSWORD

  return (
    <Dialog open={user !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set a password for {user?.email}</DialogTitle>
          <DialogDescription>
            They have no mailbox, so there is no reset email. Set the password
            here and tell them directly.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <Field
            label="New password"
            hint={`At least ${MIN_PASSWORD} characters.`}
            error={tooShort ? `Too short — ${MIN_PASSWORD} characters or more.` : null}
          >
            {/* Shown as text on purpose: whoever sets it has to be able to read
                it back to the person standing in front of them. */}
            <Input type="text" value={password} autoComplete="off"
              onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <p className="rounded-xl bg-surface-2 px-4 py-3 text-xs text-ink-2">
            Their passkey is not affected. If they have also lost the device
            holding it, remove their passkeys too.
          </p>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={password.length < MIN_PASSWORD || save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending ? <Loader2 className="animate-spin" /> : null}
            Set password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
