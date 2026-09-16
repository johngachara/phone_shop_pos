import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppShell } from '@/components/layout/AppShell'
import { RequireAuth, RequireManager } from '@/routes/guards'
import { initAuth } from '@/features/auth/useAuth'
import { initTheme } from '@/features/theme/useTheme'
import { useAppUpdate } from '@/features/updates/useAppUpdate'
import LoginPage from '@/features/auth/LoginPage'
import DashboardPage from '@/features/dashboard/DashboardPage'
import StockPage from '@/features/stock/StockPage'
import OrdersPage from '@/features/orders/OrdersPage'
import AccessoriesPage from '@/features/accessories/AccessoriesPage'
import AnalyticsPage from '@/features/analytics/AnalyticsPage'
import AiPage from '@/features/ai/AiPage'
import UsersPage from '@/features/users/UsersPage'
import LowStockPage from '@/features/stock/LowStockPage'
import { InsightsListPage, InsightDetailPage } from '@/features/insights/InsightsPage'
import { ScrollToTop } from '@/components/ScrollToTop'
import { useMobileKeyboardScroll } from '@/lib/useMobileKeyboardScroll'

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
  useAppUpdate()
  useMobileKeyboardScroll()

  useEffect(() => {
    initTheme()
    return initAuth()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={350} skipDelayDuration={200}>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<RequireAuth><AppShell /></RequireAuth>}>
            <Route index element={<DashboardPage />} />
            <Route
              path="analytics"
              element={<RequireManager><AnalyticsPage /></RequireManager>}
            />
            <Route
              path="insights"
              element={<RequireManager><InsightsListPage /></RequireManager>}
            />
            <Route
              path="insights/:id"
              element={<RequireManager><InsightDetailPage /></RequireManager>}
            />
            <Route
              path="users"
              element={<RequireManager><UsersPage /></RequireManager>}
            />
            <Route path="stock" element={<StockPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="accessories" element={<AccessoriesPage />} />
            <Route path="low-stock" element={<LowStockPage />} />
            <Route path="ai" element={<AiPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </TooltipProvider>
      <Toaster position="top-center" richColors closeButton />
    </QueryClientProvider>
  )
}
