import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppShell } from '@/components/layout/AppShell'
import { RequireAuth, RequireManager } from '@/routes/guards'
import { initAuth } from '@/features/auth/useAuth'
import { initTheme } from '@/features/theme/useTheme'
import LoginPage from '@/features/auth/LoginPage'
import ForgotPasswordPage from '@/features/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/features/auth/ResetPasswordPage'
import DashboardPage from '@/features/dashboard/DashboardPage'
import StockPage from '@/features/stock/StockPage'
import OrdersPage from '@/features/orders/OrdersPage'
import AccessoriesPage from '@/features/accessories/AccessoriesPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stock moves constantly at a counter; a cached figure that is a minute
      // old is worse than a brief spinner.
      staleTime: 15_000,
      refetchOnWindowFocus: true,
      retry: (failureCount, error) => {
        // Never retry an authorization failure: the answer will not change,
        // and retrying just burns the throttle budget.
        const status = (error as { status?: number })?.status
        if (status === 401 || status === 403) return false
        return failureCount < 2
      },
    },
  },
})

export default function App() {
  useEffect(() => {
    initTheme()
    return initAuth()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={350} skipDelayDuration={200}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route element={<RequireAuth><AppShell /></RequireAuth>}>
            <Route index element={<DashboardPage />} />
            <Route
              path="analytics"
              element={<RequireManager><Placeholder name="Analytics" /></RequireManager>}
            />
            <Route
              path="users"
              element={<RequireManager><Placeholder name="Users" /></RequireManager>}
            />
            <Route path="stock" element={<StockPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="accessories" element={<AccessoriesPage />} />
            <Route path="ai" element={<Placeholder name="Alltech AI" />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </TooltipProvider>
      <Toaster position="top-center" richColors closeButton />
    </QueryClientProvider>
  )
}

/** Routes landing in the next change. Named so the nav is navigable now. */
function Placeholder({ name }: { name: string }) {
  return (
    <div className="surface grid min-h-64 place-items-center rounded-2xl text-sm text-ink-3">
      {name} lands in the next change.
    </div>
  )
}
