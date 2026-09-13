import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, ShieldCheck, UserMinus, UserPlus, Users } from 'lucide-react'
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
}

const MIN_PASSWORD = 12

export default function UsersPage() {
  const queryClient = useQueryClient()
  const myId = useAuth((s) => s.session?.user?.id)
  const [adding, setAdding] = useState(false)
  const [revoking, setRevoking] = useState<AlltechUser | null>(null)

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
