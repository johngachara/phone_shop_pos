import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'

function Booting() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <Loader2 className="size-6 animate-spin text-ink-3" />
    </div>
  )
}

/** Gate for anything behind sign-in.
 *
 * Three conditions, not one: a session, an Alltech role, and the passkey step
 * completed. A session alone is not enough -- every user of the other
 * application on this shared Supabase project has one. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, isAlltech, role, passkeyVerified, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Booting />
  if (!session || !isAlltech || !role || !passkeyVerified) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}

/** Manager-only routes.
 *
 * The API enforces this independently; this only keeps someone from landing on
 * a page that would fill with permission errors. */
export function RequireManager({ children }: { children: ReactNode }) {
  const role = useAuth((s) => s.role)
  if (role !== 'manager') return <Navigate to="/" replace />
  return <>{children}</>
}
