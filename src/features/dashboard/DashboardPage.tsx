import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, ArrowRight, Boxes, Cable, ChevronRight, Receipt, Sparkles,
  TrendingUp, Wallet,
} from 'lucide-react'
import { api, listFrom } from '@/lib/api'
import { formatKsh, formatNumber } from '@/lib/utils'
import { useAuth } from '@/features/auth/useAuth'
import { Card, CardBody, CardHeader, CardTitle, Stat } from '@/components/ui/card'
import { Badge, StockLevel } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ListSkeleton, Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/layout/PageHeader'

interface StockItem {
  id: number
  product_name: string
  quantity: number
  selling_price: string
}

interface SaleRow {
  id: number
  product_name: string
  quantity: number
  selling_price: string
  customer_name: string
  created_at: string
}

interface DashboardMetrics {
  today_metrics: {
    sales_count: number
    total_sales: string | number
    total_profit: string | number
    sales_with_cost: number
    total_items_sold: number
    unique_customers: number
  }
  yesterday_total_sales: string | number
  by_item_type?: Record<string, { total_sales: string | number; sales_count: number }>
}

export default function DashboardPage() {
  const role = useAuth((s) => s.role)
  const isManager = role === 'manager'

  const lowStock = useQuery({
    queryKey: ['low-stock'],
    // Paginated endpoint: rows arrive under `results`, not `data`.
    queryFn: () => api<unknown>('/api/detailed/low_stock/').then(listFrom<StockItem>),
  })

  const unpaid = useQuery({
    queryKey: ['unpaid'],
    queryFn: () => api<unknown>('/api/saved2').then(listFrom<SaleRow>),
  })

  // Manager only. Employees are never issued this request, and the API would
  // refuse it anyway -- money figures are not theirs to see.
  const metrics = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => api<DashboardMetrics>('/api/dashboard/'),
    enabled: isManager,
  })

  const lowStockItems = lowStock.data ?? []
  const unpaidOrders = unpaid.data ?? []

  return (
    <>
      <PageHeader
        title={isManager ? 'Today at a glance' : 'Counter'}
        subtitle={
          isManager
            ? 'Sales, profit and what needs attention.'
            : 'What needs doing right now.'
        }
      />

      {isManager ? (
        <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-5"><Skeleton className="h-14" /></Card>
            ))
          ) : metrics.data ? (
            <>
              <Stat
                label="Sales today"
                value={formatNumber(metrics.data.today_metrics.sales_count)}
                sub={`${formatNumber(metrics.data.today_metrics.total_items_sold)} items`}
              />
              <Stat
                label="Revenue today"
                value={formatKsh(metrics.data.today_metrics.total_sales)}
                sub={`Yesterday ${formatKsh(metrics.data.yesterday_total_sales)}`}
                tone="accent"
              />
              <Stat
                label="Profit today"
                value={formatKsh(metrics.data.today_metrics.total_profit)}
                // Profit can only be computed where a buying price was
                // recorded. Saying so is the difference between a figure and a
                // misleading one.
                sub={
                  metrics.data.today_metrics.sales_with_cost <
                  metrics.data.today_metrics.sales_count
                    ? `From ${metrics.data.today_metrics.sales_with_cost} of ${metrics.data.today_metrics.sales_count} sales with a cost recorded`
                    : 'All sales have a cost recorded'
                }
                tone="accent"
              />
              <Stat
                label="Customers today"
                value={formatNumber(metrics.data.today_metrics.unique_customers)}
              />
            </>
          ) : null}
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="size-4 text-ink-3" /> Unpaid orders
              {unpaidOrders.length ? (
                <Badge tone="warn">{unpaidOrders.length}</Badge>
              ) : null}
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/orders">Open <ArrowRight /></Link>
            </Button>
          </CardHeader>
          <CardBody>
            {unpaid.isLoading ? (
              <ListSkeleton rows={3} />
            ) : unpaidOrders.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-3">Nothing on hold.</p>
            ) : (
              <ul className="divide-y divide-line-soft">
                {unpaidOrders.slice(0, 5).map((order) => (
                  <li key={order.id}>
                    {/* Links to this specific order, not just the list. Seeing
                        something on the dashboard and then having to find it
                        again is the whole reason to show it here. */}
                    <Link
                      to={`/orders?order=${order.id}`}
                      className="-mx-2 flex items-center justify-between gap-3 rounded-xl px-2 py-3
                                 transition-colors hover:bg-surface-2 active:bg-surface-3"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{order.product_name}</span>
                        <span className="block truncate text-xs capitalize text-ink-3">{order.customer_name}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="tnum text-sm font-semibold">
                          {formatKsh(Number(order.selling_price) * order.quantity)}
                        </span>
                        <ChevronRight className="size-4 text-ink-3" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-warn" /> Running low
              {lowStockItems.length ? (
                <Badge tone="danger">{lowStockItems.length}</Badge>
              ) : null}
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/stock">Phone screens <ArrowRight /></Link>
            </Button>
          </CardHeader>
          <CardBody>
            {lowStock.isLoading ? (
              <ListSkeleton rows={3} />
            ) : lowStockItems.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-3">Everything is stocked.</p>
            ) : (
              <ul className="divide-y divide-line-soft">
                {lowStockItems.slice(0, 5).map((item) => (
                  <li key={item.id}>
                    {/* Opens this item's edit sheet directly, because the only
                        reason to look at a low-stock warning is to do something
                        about that item. */}
                    <Link
                      to={`/stock?item=${item.id}`}
                      className="-mx-2 flex items-center justify-between gap-3 rounded-xl px-2 py-3
                                 transition-colors hover:bg-surface-2 active:bg-surface-3"
                    >
                      <span className="truncate text-sm font-semibold">{item.product_name}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        <StockLevel quantity={item.quantity} />
                        <ChevronRight className="size-4 text-ink-3" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLink to="/stock" icon={Boxes} label="Sell a screen" />
        <QuickLink to="/accessories" icon={Cable} label="Sell an accessory" />
        <QuickLink to="/ai" icon={Sparkles} label="Ask Alltech AI" />
        {isManager ? (
          <QuickLink to="/analytics" icon={TrendingUp} label="See analytics" />
        ) : (
          <QuickLink to="/orders" icon={Wallet} label="Complete an order" />
        )}
      </section>
    </>
  )
}

function QuickLink({
  to, icon: Icon, label,
}: {
  to: string
  icon: typeof Boxes
  label: string
}) {
  return (
    <Link
      to={to}
      className="surface flex items-center gap-3 rounded-2xl px-4 py-4 transition-transform active:scale-[0.98]"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/12 text-accent">
        <Icon className="size-5" />
      </span>
      <span className="text-sm font-semibold">{label}</span>
      <ArrowRight className="ml-auto size-4 text-ink-3" />
    </Link>
  )
}
