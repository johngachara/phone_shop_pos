import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, ArrowLeft, Boxes, Cable, ChevronRight, Filter,
  Loader2, RefreshCw, Search,
} from 'lucide-react'
import { api, listFrom } from '@/lib/api'
import { formatKsh } from '@/lib/utils'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { Badge, StockLevel } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ListSkeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/ui/empty'
import { Tooltip } from '@/components/ui/tooltip'

export interface LowStockItem {
  id: number
  product_name: string
  quantity: number
  buying_price: string | null
  selling_price: string
  price?: string
  created_at?: string
  updated_at?: string
  item_type: 'SCREEN' | 'ACCESSORY'
}

interface LowStockApiResponse {
  count?: number
  next?: string | null
  previous?: string | null
  results?: LowStockItem[]
}

type TypeFilter = 'ALL' | 'SCREEN' | 'ACCESSORY'
type SortOrder = 'qty_asc' | 'qty_desc' | 'name_asc'

const THRESHOLD_OPTIONS = [
  { label: 'Out of stock (0)', value: 0 },
  { label: '≤ 1 left', value: 1 },
  { label: '≤ 3 left (Standard)', value: 3 },
  { label: '≤ 5 left', value: 5 },
  { label: '≤ 10 left', value: 10 },
]

export default function LowStockPage() {
  const [threshold, setThreshold] = useState<number>(3)
  const [page, setPage] = useState<number>(1)
  const [pageSize] = useState<number>(50)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('qty_asc')

  const query = useQuery({
    queryKey: ['low-stock-full', threshold, page, pageSize],
    queryFn: async () => {
      const resp = await api<LowStockApiResponse | LowStockItem[]>(
        `/api/detailed/low_stock/?threshold=${threshold}&page=${page}&page_size=${pageSize}`,
      )
      if (Array.isArray(resp)) {
        return {
          count: resp.length,
          results: resp,
        }
      }
      return {
        count: resp.count ?? resp.results?.length ?? 0,
        results: Array.isArray(resp.results) ? resp.results : listFrom<LowStockItem>(resp),
      }
    },
    placeholderData: (prev) => prev,
  })

  const rawItems = query.data?.results ?? []
  const totalCount = query.data?.count ?? rawItems.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  // Client-side filtering & sorting across the loaded page
  const filteredItems = useMemo(() => {
    let result = [...rawItems]

    if (typeFilter !== 'ALL') {
      result = result.filter((item) => item.item_type === typeFilter)
    }

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase()
      result = result.filter((item) => item.product_name.toLowerCase().includes(term))
    }

    result.sort((a, b) => {
      if (sortOrder === 'qty_asc') return a.quantity - b.quantity
      if (sortOrder === 'qty_desc') return b.quantity - a.quantity
      if (sortOrder === 'name_asc') return a.product_name.localeCompare(b.product_name)
      return 0
    })

    return result
  }, [rawItems, typeFilter, searchTerm, sortOrder])

  const countsByType = useMemo(() => {
    let screens = 0
    let accessories = 0
    for (const item of rawItems) {
      if (item.item_type === 'SCREEN') screens++
      else if (item.item_type === 'ACCESSORY') accessories++
    }
    return { screens, accessories }
  }, [rawItems])

  return (
    <>
      <div className="mb-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-ink-3 hover:text-ink">
          <Link to="/">
            <ArrowLeft className="size-4" /> Back to Dashboard
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Low stock"
        subtitle={`Showing items with ≤ ${threshold} in stock across screens and accessories (${totalCount} total)`}
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
          >
            <RefreshCw className={query.isFetching ? 'size-4 animate-spin' : 'size-4'} />
            Refresh
          </Button>
        }
      />

      {/* Threshold filter pills */}
      <section className="mb-4 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-3">
          <Filter className="size-3.5" /> Threshold:
        </span>
        {THRESHOLD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              setThreshold(opt.value)
              setPage(1)
            }}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
              threshold === opt.value
                ? 'bg-accent text-accent-ink shadow-sm'
                : 'bg-surface-2 text-ink-2 hover:bg-surface-3 hover:text-ink'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </section>

      {/* Filter and search bar */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="relative">
          {query.isFetching ? (
            <Loader2 className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-accent" />
          ) : (
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
          )}
          <Input
            className="pl-10"
            placeholder="Search low-stock items"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            type="search"
            autoComplete="off"
          />
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center gap-1 rounded-xl bg-surface-2 p-1">
          <button
            type="button"
            onClick={() => setTypeFilter('ALL')}
            className={`flex-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              typeFilter === 'ALL'
                ? 'bg-surface text-ink shadow-sm'
                : 'text-ink-3 hover:text-ink'
            }`}
          >
            All ({rawItems.length})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('SCREEN')}
            className={`flex items-center justify-center gap-1.5 flex-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              typeFilter === 'SCREEN'
                ? 'bg-surface text-ink shadow-sm'
                : 'text-ink-3 hover:text-ink'
            }`}
          >
            <Boxes className="size-3.5" /> Screens ({countsByType.screens})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('ACCESSORY')}
            className={`flex items-center justify-center gap-1.5 flex-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              typeFilter === 'ACCESSORY'
                ? 'bg-surface text-ink shadow-sm'
                : 'text-ink-3 hover:text-ink'
            }`}
          >
            <Cable className="size-3.5" /> Accs ({countsByType.accessories})
          </button>
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-ink-3 shrink-0">Sort:</span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-xs font-medium text-ink focus:border-accent focus:outline-none"
          >
            <option value="qty_asc">Lowest quantity first</option>
            <option value="qty_desc">Highest quantity first</option>
            <option value="name_asc">Product Name (A-Z)</option>
          </select>
        </div>
      </div>

      {query.isLoading ? (
        <ListSkeleton rows={8} />
      ) : query.isError ? (
        <ErrorState
          body={(query.error as Error).message}
          onRetry={() => void query.refetch()}
        />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title={searchTerm ? 'No matching low stock items' : 'No items running low'}
          body={
            searchTerm
              ? 'Try changing your search terms or adjusting the threshold.'
              : `Everything has more than ${threshold} items in stock.`
          }
        />
      ) : (
        <>
          <ul className="space-y-2.5">
            {filteredItems.map((item) => (
              <Card key={`${item.item_type}-${item.id}`} className="rise p-4">
                <li className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold leading-snug">{item.product_name}</span>
                      <Badge
                        tone={item.item_type === 'SCREEN' ? 'info' : 'accent'}
                        className="text-[10px]"
                      >
                        {item.item_type === 'SCREEN' ? 'Screen' : 'Accessory'}
                      </Badge>
                    </div>

                    <div className="tnum mt-1 flex flex-wrap items-center gap-3 text-sm text-ink-3">
                      <span>Selling {formatKsh(item.selling_price || item.price || 0)}</span>
                      {item.buying_price ? (
                        <span>· Cost {formatKsh(item.buying_price)}</span>
                      ) : (
                        <span className="text-warn">· No cost recorded</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <StockLevel quantity={item.quantity} />

                    <div className="flex items-center gap-2">
                      {item.item_type === 'SCREEN' ? (
                        <Tooltip label="View or edit this screen in stock">
                          <Button asChild size="sm" variant="secondary">
                            <Link to={`/stock?item=${item.id}`}>
                              Manage <ChevronRight className="size-4" />
                            </Link>
                          </Button>
                        </Tooltip>
                      ) : (
                        <Tooltip label="View accessory in catalogue">
                          <Button asChild size="sm" variant="secondary">
                            <Link to={`/accessories?q=${encodeURIComponent(item.product_name)}`}>
                              Manage <ChevronRight className="size-4" />
                            </Link>
                          </Button>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </li>
              </Card>
            ))}
          </ul>

          {/* Pagination controls */}
          {totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1 || query.isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="tnum text-sm text-ink-3">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages || query.isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </>
      )}
    </>
  )
}
