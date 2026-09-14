import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  BarChart3, Boxes, Cable, FileText, LayoutDashboard, LogOut, MoreHorizontal,
  Receipt, RefreshCw, Sparkles, Users,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody,
} from '@/components/ui/dialog'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/useAuth'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/features/theme/ThemeToggle'
import { Tooltip } from '@/components/ui/tooltip'
import { Logo } from '@/components/Logo'
import { usePush } from '@/features/push/usePush'
import { checkForUpdate } from '@/features/updates/useAppUpdate'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  group: string
  managerOnly?: boolean
}

// Grouped so the rail reads as sections rather than one flat list of eight
// unrelated destinations -- inventory actions together, sales together, the
// two report-shaped screens together, and admin on its own. Accessories sits
// directly under Phone screens: both are "what's for sale", read the same
// way, and used back-to-back at the counter.
const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, group: 'Overview' },
  { to: '/stock', label: 'Phone screens', icon: Boxes, group: 'Inventory' },
  { to: '/accessories', label: 'Accessories', icon: Cable, group: 'Inventory' },
  { to: '/orders', label: 'Orders', icon: Receipt, group: 'Sales' },
  { to: '/ai', label: 'Alltech AI', icon: Sparkles, group: 'Insights' },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, group: 'Insights', managerOnly: true },
  { to: '/insights', label: 'Reports', icon: FileText, group: 'Insights', managerOnly: true },
  { to: '/users', label: 'Users', icon: Users, group: 'Admin', managerOnly: true },
]

export function AppShell() {
  const role = useAuth((s) => s.role)
  const email = useAuth((s) => s.session?.user?.email)
  const signOut = useAuth((s) => s.signOut)
  const queryClient = useQueryClient()

  // Mounted here rather than on the Reports page so a manager's token is
  // refreshed on every load. FCM tokens rotate, and registering only when
  // someone happens to open Reports means notifications stop arriving weeks
  // later with nothing to indicate why.
  usePush()

  const [moreOpen, setMoreOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const navigate = useNavigate()

  // Manager-only items are not rendered for an employee. The API refuses them
  // regardless -- this only avoids showing a door that will not open.
  const items = NAV.filter((item) => !item.managerOnly || role === 'manager')
  const primary = items.slice(0, 4)
  const overflow = items.slice(4)

  // A PWA with no browser chrome has no reload button either, so there was no
  // way to pull fresh data or notice a stuck screen short of force-closing the
  // app. This does both: refetch everything on screen, and ask the service
  // worker to check for a new build right now rather than waiting on its own
  // timer.
  function refresh() {
    setRefreshing(true)
    void queryClient.invalidateQueries().finally(() => {
      window.setTimeout(() => setRefreshing(false), 500)
    })
    checkForUpdate()
    toast.success('Refreshed')
  }

  return (
    <div className="relative z-10 min-h-dvh">
      {/* Desktop / tablet: a rail down the side. */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line-soft bg-surface/50 px-3 py-5 lg:flex">
        <div className="flex items-center gap-2.5 px-2.5">
          <div className="grid size-9 place-items-center rounded-xl bg-accent text-accent-ink">
            <Logo className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold leading-tight">Alltech</p>
            <p className="truncate text-xs capitalize text-ink-3">{role ?? '—'}</p>
          </div>
          <Tooltip label="Refresh the data on screen and check for an app update.">
            <Button
              variant="ghost" size="icon" className="ml-auto shrink-0"
              onClick={refresh} aria-label="Refresh"
            >
              <RefreshCw className={cn(refreshing && 'animate-spin')} />
            </Button>
          </Tooltip>
        </div>

        <nav className="mt-7 flex-1 space-y-1">
          {items.map(({ to, label, icon: Icon, group }, index) => (
            <div key={to}>
              {group !== items[index - 1]?.group ? (
                <p className="mb-1.5 mt-4 px-3 text-[11px] font-bold uppercase tracking-wide text-ink-3 first:mt-0">
                  {group}
                </p>
              ) : null}
              <NavLink
                to={to} end={to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-accent/12 text-accent'
                      : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
                  )
                }
              >
                <Icon className="size-4.5" />
                {label}
              </NavLink>
            </div>
          ))}
        </nav>

        <div className="border-t border-line-soft px-1 pt-3">
          <ThemeToggle className="mb-2" />
          <p className="truncate px-2 text-xs text-ink-3">{email}</p>
          <Button variant="ghost" className="mt-1 w-full justify-start" onClick={() => void signOut()}>
            <LogOut /> Sign out
          </Button>
        </div>
      </aside>

      {/* Phone: a top bar for identity and a bottom bar for navigation, which
          is where a thumb already is while holding the device. */}
      {/* The top padding follows the safe-area inset so the header clears a
          notch or status bar when the browser falls back to standalone rather
          than honouring fullscreen. It collapses to the normal 0.75rem where
          there is no inset, so nothing is padded for a device that does not
          need it. */}
      <header
        className="glass sticky top-0 z-30 flex items-center justify-between px-4 pb-3 lg:hidden"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="grid size-8 place-items-center rounded-lg bg-accent text-accent-ink">
            <Logo className="size-4.5" />
          </div>
          <span className="font-display text-sm font-semibold">Alltech</span>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip label="Refresh the data on screen and check for an app update." side="bottom">
            <Button variant="ghost" size="icon" onClick={refresh} aria-label="Refresh">
              <RefreshCw className={cn(refreshing && 'animate-spin')} />
            </Button>
          </Tooltip>
          <Tooltip label="Sign out. You will need your password and passkey to get back in." side="bottom">
            <Button variant="ghost" size="icon" onClick={() => void signOut()} aria-label="Sign out">
              <LogOut />
            </Button>
          </Tooltip>
        </div>
      </header>

      <main className="px-4 pb-28 pt-5 sm:px-6 lg:ml-60 lg:pb-10 lg:pt-8">
        <Outlet />
      </main>

      {/* Four destinations plus More. Seven tabs across a 375px phone leaves
          each one around 50px wide with labels that collide, which is both
          unreadable and easy to mis-tap. The four here are what the counter
          actually uses minute to minute; the rest live one tap away. */}
      <nav
        className="glass fixed inset-x-0 bottom-0 z-30 flex justify-around
                   px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 lg:hidden"
      >
        {primary.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-semibold',
                isActive ? 'text-accent' : 'text-ink-3',
              )
            }
          >
            <Icon className="size-5" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}

        {overflow.length > 0 ? (
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-semibold text-ink-3"
          >
            <MoreHorizontal className="size-5" />
            <span>More</span>
          </button>
        ) : null}
      </nav>

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>More</DialogTitle></DialogHeader>
          <DialogBody className="pb-6">
            <div className="grid gap-2">
              {overflow.map(({ to, label, icon: Icon, group }, index) => (
                <div key={to}>
                  {group !== overflow[index - 1]?.group ? (
                    <p className="mb-1.5 mt-3 px-1 text-[11px] font-bold uppercase tracking-wide text-ink-3 first:mt-0">
                      {group}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => { setMoreOpen(false); navigate(to) }}
                    className="flex w-full items-center gap-3 rounded-xl bg-surface-2 px-4 py-3.5 text-left text-sm font-semibold"
                  >
                    <span className="grid size-9 place-items-center rounded-lg bg-accent/12 text-accent">
                      <Icon className="size-4.5" />
                    </span>
                    {label}
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <p className="mb-1.5 px-1 text-xs font-semibold text-ink-2">Theme</p>
              <ThemeToggle />
            </div>
            <p className="mt-4 truncate px-1 text-xs text-ink-3">{email}</p>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  )
}
