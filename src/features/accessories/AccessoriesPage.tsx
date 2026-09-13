import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Cable, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { StockLevel } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ListSkeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/ui/empty'
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Tooltip } from '@/components/ui/tooltip'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatKsh } from '@/lib/utils'

interface Accessory {
  id: number
  product_name: string
  quantity: number
  selling_price: string
  buying_price: string | null
}

interface AccessoryPage {
  totalItems: number
  totalPages: number
  currentPage: number
  items: Accessory[]
}

/** Accessories now come from this backend.
 *
 * They used to be served by a separate Express service against Firestore, on a
 * second origin with its own token stack. Same screen, one API. */
function fetchAccessories(page: number) {
  return api<AccessoryPage>(`/api/accessories/?page=${page}&limit=50`)
}

export default function AccessoriesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [selling, setSelling] = useState<Accessory | null>(null)
  const [editing, setEditing] = useState<Accessory | null>(null)
  const [adding, setAdding] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Accessory | null>(null)

  const accessories = useQuery({
    queryKey: ['accessories', page],
    queryFn: () => fetchAccessories(page),
  })

  const items = useMemo(() => {
    const all = accessories.data?.items ?? []
    const needle = query.trim().toLowerCase()
    return needle ? all.filter((a) => a.product_name.toLowerCase().includes(needle)) : all
  }, [accessories.data, query])

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['accessories'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
  }

  const removal = useMutation({
    mutationFn: (item: Accessory) =>
      api(`/api/accessories/${item.id}/delete/`, { method: 'DELETE' }),
    onSuccess: () => { toast.success('Accessory deleted'); invalidate(); setConfirmDelete(null) },
    onError: (error) => toast.error(error.message),
  })

  return (
    <>
      <PageHeader
        title="Accessories"
        subtitle={accessories.data ? `${accessories.data.totalItems} items` : undefined}
        action={
          <Tooltip label="Add a new accessory, with its selling and buying price.">
            <Button onClick={() => setAdding(true)}><Plus /> Add</Button>
          </Tooltip>
        }
      />

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
        <Input
          className="pl-10" type="search" placeholder="Search accessories"
          value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off"
        />
      </div>

      {accessories.isLoading ? (
        <ListSkeleton />
      ) : accessories.isError ? (
        <ErrorState
          body={(accessories.error as Error).message}
          onRetry={() => void accessories.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Cable}
          title={query ? 'Nothing matches that' : 'No accessories yet'}
          action={query ? undefined : { label: 'Add accessory', onClick: () => setAdding(true) }}
        />
      ) : (
        <>
          <ul className="space-y-2">
            {items.map((item) => (
              <Card key={item.id} className="rise p-4">
                <li className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex items-start justify-between gap-3 sm:min-w-0 sm:flex-1">
                    <div className="min-w-0">
                      <p className="font-semibold leading-snug">{item.product_name}</p>
                      <p className="tnum mt-0.5 text-sm text-ink-3">
                        {formatKsh(item.selling_price)}
                        {item.buying_price ? null : (
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
                          : 'Sell this accessory. It is recorded as paid straight away.'
                      }
                    >
                      <Button className="flex-1 sm:flex-none" disabled={item.quantity <= 0}
                        onClick={() => setSelling(item)}>Sell</Button>
                    </Tooltip>
                    <Tooltip label="Change the name, quantity or prices of this accessory.">
                      <Button size="icon" variant="secondary" onClick={() => setEditing(item)}
                        aria-label={`Edit ${item.product_name}`}><Pencil /></Button>
                    </Tooltip>
                    <Tooltip label="Remove this accessory. Past sales of it are kept.">
                      <Button size="icon" variant="secondary" onClick={() => setConfirmDelete(item)}
                        aria-label={`Delete ${item.product_name}`}><Trash2 /></Button>
                    </Tooltip>
                  </div>
                </li>
              </Card>
            ))}
          </ul>

          {(accessories.data?.totalPages ?? 1) > 1 ? (
            <div className="mt-4 flex items-center justify-center gap-3">
              <Button variant="secondary" size="sm" disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <span className="tnum text-sm text-ink-3">
                Page {accessories.data?.currentPage} of {accessories.data?.totalPages}
              </span>
              <Button variant="secondary" size="sm"
                disabled={page >= (accessories.data?.totalPages ?? 1)}
                onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          ) : null}
        </>
      )}

      <SellAccessory
        item={selling} open={selling !== null}
        onOpenChange={(o) => !o && setSelling(null)} onDone={invalidate}
      />
      <AccessoryForm
        item={editing} open={adding || editing !== null}
        onOpenChange={(o) => { if (!o) { setAdding(false); setEditing(null) } }}
        onDone={invalidate}
      />

      <Dialog open={confirmDelete !== null} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {confirmDelete?.product_name}?</DialogTitle>
            <DialogDescription>
              Sales already recorded against it are kept.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" disabled={removal.isPending}
              onClick={() => confirmDelete && removal.mutate(confirmDelete)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function SellAccessory({
  item, open, onOpenChange, onDone,
}: {
  item: Accessory | null
  open: boolean
  onOpenChange: (o: boolean) => void
  onDone: () => void
}) {
  const [quantity, setQuantity] = useState(1)
  const [customer, setCustomer] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      api(`/api/accessories/${item!.id}/sell/`, {
        method: 'POST',
        json: {
          product_name: item!.product_name,
          price: item!.selling_price,
          quantity,
          customer_name: customer.trim(),
        },
      }),
    onSuccess: () => {
      toast.success('Sold')
      onDone()
      onOpenChange(false)
      setQuantity(1)
      setCustomer('')
    },
    onError: (error) => toast.error(error.message),
  })

  if (!item) return null
  const over = quantity > item.quantity

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sell {item.product_name}</DialogTitle>
          {/* Accessories complete immediately -- unlike screens, they are not
              put on hold, which matches how the counter already works. */}
          <DialogDescription>This is recorded as paid straight away.</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <Field label="Quantity" error={over ? `Only ${item.quantity} in stock.` : null}>
            <Input type="number" min={1} max={item.quantity} inputMode="numeric"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))} />
          </Field>
          <Field label="Customer">
            <Input value={customer} onChange={(e) => setCustomer(e.target.value)}
              placeholder="Name" autoComplete="off" />
          </Field>
          <div className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3">
            <span className="text-sm font-semibold text-ink-2">Total</span>
            <span className="tnum font-display text-xl font-semibold text-accent">
              {formatKsh(Number(item.selling_price) * quantity)}
            </span>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={over || customer.trim().length < 2 || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? <Loader2 className="animate-spin" /> : null} Sell
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AccessoryForm({
  item, open, onOpenChange, onDone,
}: {
  item: Accessory | null
  open: boolean
  onOpenChange: (o: boolean) => void
  onDone: () => void
}) {
  const editing = item !== null
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [cost, setCost] = useState('')

  // useEffect, not useMemo: this sets state, and useMemo runs during render,
  // where setState is invalid and React warns or drops the update.
  useEffect(() => {
    if (!open) return
    setName(item?.product_name ?? '')
    setQuantity(item ? String(item.quantity) : '')
    setPrice(item?.selling_price ?? '')
    setCost(item?.buying_price ?? '')
  }, [item, open])

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        product_name: name.trim(),
        quantity: Number(quantity),
        selling_price: price,
        buying_price: cost === '' ? null : cost,
      }
      return editing
        ? api(`/api/accessories/${item.id}/update/`, { method: 'PATCH', json: payload })
        : api('/api/accessories/add/', { method: 'POST', json: payload })
    },
    onSuccess: () => {
      toast.success(editing ? 'Accessory updated' : 'Accessory added')
      onDone()
      onOpenChange(false)
    },
    onError: (error) => toast.error(error.message),
  })

  const valid = name.trim().length > 1 && Number(quantity) >= 0 && Number(price) > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit accessory' : 'Add accessory'}</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <Field label="Product name">
            <Input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. USB-C cable" autoComplete="off" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity">
              <Input type="number" inputMode="numeric" min="0"
                value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </Field>
            <Field label="Selling price">
              <Input type="number" inputMode="decimal" step="0.01" min="0"
                value={price} onChange={(e) => setPrice(e.target.value)} />
            </Field>
          </div>
          <Field label="Buying price" hint="Needed for this item to count towards profit.">
            <Input type="number" inputMode="decimal" step="0.01" min="0"
              value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Optional" />
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!valid || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? <Loader2 className="animate-spin" /> : null}
            {editing ? 'Save' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
