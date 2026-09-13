import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer,
  Tooltip as RTooltip, XAxis, YAxis,
} from 'recharts'
import { api } from '@/lib/api'
import { cn, formatKsh, formatNumber } from '@/lib/utils'
import { Stat } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/ui/empty'
import { PageHeader } from '@/components/layout/PageHeader'
import { AXIS_TICK, LINE_WIDTH, PROFIT, REVENUE, SERIES, chartInk } from './chartTheme'
import { ChartFrame, DataTable } from './ChartFrame'

type TabKey = 'overview' | 'products' | 'customers'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'products', label: 'Products' },
  { key: 'customers', label: 'Customers' },
]

const shortMonth = (value: string | number) => {
  const date = typeof value === 'number' ? new Date(2000, value - 1) : new Date(value)
  return Number.isNaN(date.getTime()) ? String(value)
    : new Intl.DateTimeFormat('en-KE', { month: 'short' }).format(date)
}

function ChartTooltip({ active, payload, label, money = true }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 shadow-[var(--shadow-float)]">
      <p className="mb-1 text-xs font-semibold text-ink-3">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} className="flex items-center gap-2 text-sm">
          <span className="size-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-ink-2">{entry.name}</span>
          {/* The value wears a text token, not the series colour: the swatch
              beside it already carries identity. */}
          <span className="tnum ml-auto font-semibold text-ink">
            {money ? formatKsh(entry.value) : formatNumber(entry.value)}
          </span>
        </p>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const [tab, setTab] = useState<TabKey>('overview')
  const ink = chartInk()

  const yearly = useQuery({ queryKey: ['yearly'], queryFn: () => api<any>('/api/yearly/') })
  const monthly = useQuery({ queryKey: ['monthly'], queryFn: () => api<any>('/api/monthly/') })
  const products = useQuery({
    queryKey: ['products-insights'], queryFn: () => api<any>('/api/products-insights/'),
    enabled: tab === 'products',
  })
  const customers = useQuery({
    queryKey: ['customers-insights'], queryFn: () => api<any>('/api/customers-insights/'),
    enabled: tab === 'customers',
  })

  const summary = yearly.data?.current_year_summary
  const months: any[] = monthly.data?.current_year_data ?? []

  const monthRows = months.map((m) => ({
    month: shortMonth(m.month),
    revenue: m.total_sales ?? 0,
    profit: m.total_profit ?? 0,
    withCost: m.sales_with_cost ?? 0,
    orders: m.total_orders ?? 0,
  }))

  // Profit is only computable where a cost was recorded. Saying so next to the
  // chart is the difference between a figure and a misleading one.
  const partialProfit = months.some(
    (m) => (m.sales_with_cost ?? 0) < (m.total_orders ?? 0),
  )

  return (
    <>
      <PageHeader title="Analytics" subtitle="Manager view. Employees cannot see these figures." />

      <div role="tablist" className="mb-5 flex gap-1 rounded-xl bg-surface-2 p-1">
        {TABS.map((t) => (
          <button
            key={t.key} role="tab" aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
              tab === t.key ? 'bg-surface text-accent shadow-[var(--shadow-lift)]' : 'text-ink-3 hover:text-ink',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <>
          <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {yearly.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
            ) : summary ? (
              <>
                <Stat label="Revenue this year" value={formatKsh(summary.total_sales)} tone="accent" />
                <Stat
                  label="Profit this year"
                  value={formatKsh(summary.total_profit)}
                  sub={
                    summary.sales_with_cost < summary.total_orders
                      ? `From ${summary.sales_with_cost} of ${summary.total_orders} sales with a cost recorded`
                      : 'All sales have a cost recorded'
                  }
                  tone="accent"
                />
                <Stat label="Orders" value={formatNumber(summary.total_orders)}
                  sub={`${formatNumber(summary.total_items)} items`} />
                <Stat label="Average order" value={formatKsh(summary.average_order_value)}
                  sub={`${formatNumber(summary.unique_customers)} customers`} />
              </>
            ) : null}
          </section>

          {monthly.isError ? (
            <ErrorState body={(monthly.error as Error).message} onRetry={() => void monthly.refetch()} />
          ) : (
            <ChartFrame
              title="Revenue and profit by month"
              note={
                partialProfit
                  ? 'Profit covers only the sales that recorded a buying price, so it understates months with items bought before costs were tracked.'
                  : undefined
              }
              table={
                <DataTable
                  columns={['Month', 'Revenue', 'Profit', 'Orders']}
                  rows={monthRows.map((r) => [r.month, formatKsh(r.revenue), formatKsh(r.profit), r.orders])}
                />
              }
            >
              <ResponsiveContainer width="100%" height="100%">
                {/* Revenue and profit are both shillings, so they share one
                    axis. A second y-scale would let any two lines be drawn to
                    tell whatever story the scaling chose. */}
                <LineChart data={monthRows} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                  <CartesianGrid stroke={ink.grid} vertical={false} />
                  <XAxis dataKey="month" stroke={ink.axis} tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke={ink.axis} tick={AXIS_TICK} tickLine={false} axisLine={false}
                    tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
                  />
                  <RTooltip content={<ChartTooltip />} cursor={{ stroke: ink.line }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke={REVENUE}
                    strokeWidth={LINE_WIDTH} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="profit" name="Profit" stroke={PROFIT}
                    strokeWidth={LINE_WIDTH} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartFrame>
          )}
        </>
      ) : null}

      {tab === 'products' ? (
        products.isLoading ? (
          <Skeleton className="h-80 rounded-2xl" />
        ) : products.isError ? (
          <ErrorState body={(products.error as Error).message} onRetry={() => void products.refetch()} />
        ) : (
          <ChartFrame
            title="Best sellers this year"
            note="By revenue. Horizontal so long product names stay readable."
            table={
              <DataTable
                columns={['Product', 'Revenue', 'Units']}
                rows={(products.data?.current_year_performance ?? []).slice(0, 10).map((p: any) => [
                  p.product_name, formatKsh(p.total_sales), p.total_quantity ?? p.total_items ?? 0,
                ])}
              />
            }
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={(products.data?.current_year_performance ?? []).slice(0, 8)}
                layout="vertical"
                margin={{ top: 4, right: 16, bottom: 0, left: 8 }}
              >
                <CartesianGrid stroke={ink.grid} horizontal={false} />
                <XAxis type="number" stroke={ink.axis} tick={AXIS_TICK} tickLine={false} axisLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
                <YAxis type="category" dataKey="product_name" width={130}
                  stroke={ink.axis} tick={AXIS_TICK} tickLine={false} axisLine={false} />
                <RTooltip content={<ChartTooltip />} cursor={{ fill: ink.grid }} />
                {/* One series, so no legend: the title names it. Rounded ends
                    on the data end only, anchored to the baseline. */}
                <Bar dataKey="total_sales" name="Revenue" radius={[0, 4, 4, 0]} maxBarSize={22}>
                  {(products.data?.current_year_performance ?? []).slice(0, 8).map((_: any, i: number) => (
                    <Cell key={i} fill={SERIES[i % SERIES.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartFrame>
        )
      ) : null}

      {tab === 'customers' ? (
        customers.isLoading ? (
          <Skeleton className="h-80 rounded-2xl" />
        ) : customers.isError ? (
          <ErrorState body={(customers.error as Error).message} onRetry={() => void customers.refetch()} />
        ) : (
          <ChartFrame
            title="Top customers this year"
            note="By total spend."
            table={
              <DataTable
                columns={['Customer', 'Spent', 'Orders']}
                rows={(customers.data?.current_year_top_customers ?? []).slice(0, 10).map((c: any) => [
                  c.customer_name, formatKsh(c.total_spent), c.purchase_count,
                ])}
              />
            }
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={(customers.data?.current_year_top_customers ?? []).slice(0, 8)}
                layout="vertical"
                margin={{ top: 4, right: 16, bottom: 0, left: 8 }}
              >
                <CartesianGrid stroke={ink.grid} horizontal={false} />
                <XAxis type="number" stroke={ink.axis} tick={AXIS_TICK} tickLine={false} axisLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
                <YAxis type="category" dataKey="customer_name" width={110}
                  stroke={ink.axis} tick={AXIS_TICK} tickLine={false} axisLine={false}
                  // Customer names are stored lowercased, so they are cased
                  // for display here rather than shown as typed.
                  tickFormatter={(v: string) => v.charAt(0).toUpperCase() + v.slice(1)} />
                <RTooltip content={<ChartTooltip />} cursor={{ fill: ink.grid }} />
                <Bar dataKey="total_spent" name="Spent" fill={SERIES[3]} radius={[0, 4, 4, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </ChartFrame>
        )
      ) : null}
    </>
  )
}
