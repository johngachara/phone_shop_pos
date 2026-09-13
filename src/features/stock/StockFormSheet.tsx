import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { formatKsh } from '@/lib/utils'
import { addStock, updateStock, type StockItem } from './api'

export function StockFormSheet({
  item, open, onOpenChange,
}: {
  item: StockItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const editing = item !== null

  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [sellingPrice, setSellingPrice] = useState('')
  const [buyingPrice, setBuyingPrice] = useState('')

  useEffect(() => {
    if (!open) return
    setName(item?.product_name ?? '')
    setQuantity(item ? String(item.quantity) : '')
    setSellingPrice(item?.selling_price ?? '')
    setBuyingPrice(item?.buying_price ?? '')
  }, [item, open])

  const margin =
    Number(sellingPrice) > 0 && Number(buyingPrice) > 0
      ? Number(sellingPrice) - Number(buyingPrice)
      : null

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        product_name: name.trim(),
        quantity: Number(quantity),
        selling_price: sellingPrice,
        // Sent as null rather than omitted when cleared, so an existing cost
        // can actually be removed instead of silently persisting.
        buying_price: buyingPrice,
      }
      return editing ? updateStock(item.id, payload) : addStock(payload)
    },
    onSuccess: () => {
      toast.success(editing ? 'Item updated' : 'Item added')
      queryClient.invalidateQueries({ queryKey: ['stock'] })
      queryClient.invalidateQueries({ queryKey: ['low-stock'] })
      onOpenChange(false)
    },
    onError: (error) => toast.error(error.message),
  })

  // Buying price is required now. An item without one is invisible to every
  // profit figure it contributes to -- silently, because the sale still
  // happens and revenue still counts. Zero is allowed: a giveaway is a real
  // answer, absent is not.
  const valid =
    name.trim().length > 1 &&
    Number(quantity) >= 0 &&
    Number(sellingPrice) > 0 &&
    buyingPrice !== '' &&
    Number(buyingPrice) >= 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit item' : 'Add stock'}</DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <Field label="Product name">
            <Input
              value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. iPhone 12 Screen" autoComplete="off"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity">
              <Input
                type="number" inputMode="numeric" min="0"
                value={quantity} onChange={(e) => setQuantity(e.target.value)}
              />
            </Field>
            <Field label="Selling price">
              <Input
                type="number" inputMode="decimal" step="0.01" min="0"
                value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)}
              />
            </Field>
          </div>

          <Field
            label="Buying price"
            hint="What you paid for it. Used to work out profit."
            error={
              buyingPrice !== '' && Number(buyingPrice) < 0
                ? 'Cannot be negative.'
                : null
            }
          >
            <Input
              type="number" inputMode="decimal" step="0.01" min="0"
              value={buyingPrice} onChange={(e) => setBuyingPrice(e.target.value)}
              placeholder="0.00"
            />
          </Field>

          {margin !== null ? (
            <div className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3">
              <span className="text-sm font-semibold text-ink-2">Margin per unit</span>
              <span
                className={`tnum font-semibold ${margin > 0 ? 'text-accent' : 'text-danger'}`}
              >
                {formatKsh(margin)}
              </span>
            </div>
          ) : null}
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!valid || mutation.isPending}>
            {mutation.isPending ? <Loader2 className="animate-spin" /> : null}
            {editing ? 'Save changes' : 'Add item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
