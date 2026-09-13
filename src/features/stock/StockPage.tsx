import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Boxes, Pencil, Plus, Search, Trash2 } from 'lucide-react'
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
import { deleteStock, fetchStock, type StockItem } from './api'
import { SellSheet } from './SellSheet'
import { StockFormSheet } from './StockFormSheet'

export default function StockPage() {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [selling, setSelling] = useState<StockItem | null>(null)
  const [editing, setEditing] = useState<StockItem | null>(null)
  const [adding, setAdding] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<StockItem | null>(null)

  const stock = useQuery({ queryKey: ['stock'], queryFn: fetchStock })

  // Filtered in the browser rather than by round-tripping the API on every
  // keystroke: the whole list is already loaded, and a counter search has to
  // feel instant on a slow connection.
  const items = useMemo(() => {
    const all = stock.data ?? []
    const needle = query.trim().toLowerCase()
    if (!needle) return all
    return all.filter((item) => item.product_name.toLowerCase().includes(needle))
  }, [stock.data, query])

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
        title="Stock"
        subtitle={stock.data ? `${stock.data.length} items` : undefined}
        action={
          <Tooltip label="Add a new screen to stock, with its selling and buying price.">
            <Button onClick={() => setAdding(true)}><Plus /> Add item</Button>
          </Tooltip>
        }
      />

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
        <Input
          className="pl-10"
          placeholder="Search stock"
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
          title={query ? 'Nothing matches that' : 'No stock yet'}
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
              <li className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex items-start justify-between gap-3 sm:min-w-0 sm:flex-1">
                  <div className="min-w-0">
                    <p className="font-semibold leading-snug">{item.product_name}</p>
                    <p className="tnum mt-0.5 text-sm text-ink-3">
                      {formatKsh(item.selling_price)}
                      {item.buying_price ? (
                        <span> · cost {formatKsh(item.buying_price)}</span>
                      ) : (
                        <span className="text-warn"> · no cost</span>
                      )}
                    </p>
                  </div>
                  <div className="shrink-0 sm:hidden">
                    <StockLevel quantity={item.quantity} />
                  </div>
                </div>

                <div className="hidden shrink-0 sm:block">
                  <StockLevel quantity={item.quantity} />
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Tooltip
                    label={
                      item.quantity <= 0
                        ? 'Out of stock. Add more before selling.'
                        : 'Put this on hold for a customer. It is not paid for until you mark it paid under Orders.'
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
                  <Tooltip label="Change the name, quantity or prices of this item.">
                    <Button
                      size="icon" variant="secondary"
                      onClick={() => setEditing(item)}
                      aria-label={`Edit ${item.product_name}`}
                    >
                      <Pencil />
                    </Button>
                  </Tooltip>
                  <Tooltip label="Remove this item from stock. Past sales of it are kept.">
                    <Button
                      size="icon" variant="secondary"
                      onClick={() => setConfirmDelete(item)}
                      aria-label={`Delete ${item.product_name}`}
                    >
                      <Trash2 />
                    </Button>
                  </Tooltip>
                </div>
              </li>
            </Card>
          ))}
        </ul>
      )}

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
