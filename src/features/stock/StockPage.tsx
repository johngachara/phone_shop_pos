import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Boxes, ChevronRight, Loader2, Plus, Search } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StockLevel } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ListSkeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/ui/empty'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Tooltip } from '@/components/ui/tooltip'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatKsh } from '@/lib/utils'
import { useDebounced } from '@/lib/useDebounced'
import { deleteStock, fetchStock, type StockItem } from './api'
import { SellSheet } from './SellSheet'
import { StockFormSheet } from './StockFormSheet'
import { ProductSheet } from './ProductSheet'

export default function StockPage() {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [selling, setSelling] = useState<StockItem | null>(null)
  const [editing, setEditing] = useState<StockItem | null>(null)
  const [adding, setAdding] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<StockItem | null>(null)
  const [viewing, setViewing] = useState<StockItem | null>(null)

  const search = useDebounced(query)
  const [params, setParams] = useSearchParams()

  const stock = useQuery({
    queryKey: ['stock', search],
    queryFn: () => fetchStock(search),
    // Keeps the previous results on screen while the next search loads, so the
    // list does not blank out between keystrokes.
    placeholderData: (previous) => previous,
  })

  const items = stock.data ?? []

  // Arriving from the dashboard with ?item=<id> opens that item straight away.
  // The parameter is cleared once used, so a refresh does not reopen a sheet
  // the person has already dealt with.
  useEffect(() => {
    const wanted = params.get('item')
    if (!wanted || !stock.data) return
    const match = stock.data.find((row) => String(row.id) === wanted)
    if (match) {
      setEditing(match)
      params.delete('item')
      setParams(params, { replace: true })
    }
  }, [params, stock.data, setParams])

  const removal = useMutation({
    mutationFn: (item: StockItem) => deleteStock(item.id),
    onSuccess: () => {
      toast.success('Item deleted')
      queryClient.invalidateQueries({ queryKey: ['stock'] })
      queryClient.invalidateQueries({ queryKey: ['low-stock'] })
      setConfirmDelete(null)
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <>
      <PageHeader
        title="Phone screens"
        subtitle={!search && stock.data ? `${stock.data.length} items` : undefined}
        action={
          <Tooltip label="Add a new screen to stock, with its selling and buying price.">
            <Button onClick={() => setAdding(true)}><Plus /> Add item</Button>
          </Tooltip>
        }
      />

      <div className="relative mb-4">
        {/* The spinner replaces the magnifier while a search is in flight.
            Results stay on screen during a refetch, so without this there is
            no sign anything is happening between typing and the list changing. */}
        {stock.isFetching ? (
          <Loader2 className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-accent" />
        ) : (
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
        )}
        <Input
          className="pl-10"
          placeholder="Search phone screens"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          type="search"
        />
      </div>

      {stock.isLoading ? (
        <ListSkeleton />
      ) : stock.isError ? (
        <ErrorState
          body={(stock.error as Error).message}
          onRetry={() => void stock.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title={query ? 'Nothing matches that' : 'No phone screens yet'}
          body={query ? 'Try a shorter search.' : 'Add your first item to start selling.'}
          action={query ? undefined : { label: 'Add item', onClick: () => setAdding(true) }}
        />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <Card key={item.id} className="rise p-4">
              {/* Stacked on a phone, one row from sm up. Squeezing the name,
                  a badge and three controls onto a 375px line truncated every
                  product to three characters, which is the one thing on this
                  screen that has to be readable. */}
              {/* The row itself opens the product. Sell stays on the row
                  because it is the action taken dozens of times a day and
                  should not need a second tap; everything else lives in the
                  product sheet rather than crowding a line that has to stay
                  readable at 375px. */}
              <li className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <button
                  type="button"
                  onClick={() => setViewing(item)}
                  className="-m-1 flex items-start justify-between gap-3 rounded-xl p-1 text-left
                             transition-colors hover:bg-surface-2 sm:min-w-0 sm:flex-1"
                >
                  <span className="min-w-0">
                    <span className="block font-semibold leading-snug">{item.product_name}</span>
                    <span className="tnum mt-0.5 block text-sm text-ink-3">
                      {formatKsh(item.selling_price)}
                      {item.buying_price ? (
                        <span> · cost {formatKsh(item.buying_price)}</span>
                      ) : (
                        <span className="text-warn"> · no cost</span>
                      )}
                    </span>
                  </span>
                  <span className="shrink-0 sm:hidden">
                    <StockLevel quantity={item.quantity} />
                  </span>
                </button>

                <div className="hidden shrink-0 sm:block">
                  <StockLevel quantity={item.quantity} />
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Tooltip
                    label={
                      item.quantity <= 0
                        ? 'Out of stock. Add more before selling.'
                        : 'Put this on hold for a customer, or record it as paid.'
                    }
                  >
                    <Button
                      className="flex-1 sm:flex-none"
                      disabled={item.quantity <= 0}
                      onClick={() => setSelling(item)}
                    >
                      Sell
                    </Button>
                  </Tooltip>
                  <Tooltip label="Open this item to see its margin and act on it.">
                    <Button
                      variant="secondary"
                      onClick={() => setViewing(item)}
                      aria-label={`Open ${item.product_name}`}
                    >
                      Details <ChevronRight />
                    </Button>
                  </Tooltip>
                </div>
              </li>
            </Card>
          ))}
        </ul>
      )}

      <ProductSheet
        product={viewing}
        open={viewing !== null}
        kind="screen"
        onOpenChange={(o) => !o && setViewing(null)}
        onSell={() => { setSelling(viewing); setViewing(null) }}
        onEdit={() => { setEditing(viewing); setViewing(null) }}
        onDelete={() => { setConfirmDelete(viewing); setViewing(null) }}
      />

      <SellSheet item={selling} open={selling !== null} onOpenChange={(o) => !o && setSelling(null)} />
      <StockFormSheet
        item={editing}
        open={adding || editing !== null}
        onOpenChange={(o) => { if (!o) { setAdding(false); setEditing(null) } }}
      />

      <Dialog open={confirmDelete !== null} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {confirmDelete?.product_name}?</DialogTitle>
            <DialogDescription>
              This removes the item from stock. Sales already recorded against it
              are kept.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button
              variant="danger"
              disabled={removal.isPending}
              onClick={() => confirmDelete && removal.mutate(confirmDelete)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
