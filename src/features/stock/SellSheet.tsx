import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { formatKsh } from '@/lib/utils'
import { fetchCustomers, sellStock, type StockItem } from './api'

/** Put an item on hold against a customer name.
 *
 * Selling creates a pending sale; it is not money until someone completes it
 * on the Orders screen. That two-step is how the shop already works -- an item
 * is handed over before it is paid for. */
export function SellSheet({
  item, open, onOpenChange,
}: {
  item: StockItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [quantity, setQuantity] = useState(1)
  const [price, setPrice] = useState('')
  const [customer, setCustomer] = useState('')

  useEffect(() => {
    if (item) {
      setQuantity(1)
      setPrice(item.selling_price)
      setCustomer('')
    }
  }, [item])

  const customers = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
    enabled: open,
    staleTime: 5 * 60_000,
  })

  const total = useMemo(() => {
    const value = Number(price)
    return Number.isFinite(value) ? value * quantity : 0
  }, [price, quantity])

  const mutation = useMutation({
    mutationFn: () =>
      sellStock(item!.id, {
        product_name: item!.product_name,
        price,
        quantity,
        customer_name: customer.trim(),
      }),
    onSuccess: () => {
      toast.success(`${item!.product_name} put on hold for ${customer.trim()}`)
      queryClient.invalidateQueries({ queryKey: ['stock'] })
      queryClient.invalidateQueries({ queryKey: ['unpaid'] })
      queryClient.invalidateQueries({ queryKey: ['low-stock'] })
      onOpenChange(false)
    },
    onError: (error) => toast.error(error.message),
  })

  if (!item) return null

  const overStock = quantity > item.quantity
  const priceInvalid = !Number.isFinite(Number(price)) || Number(price) <= 0
  const canSell = !overStock && !priceInvalid && customer.trim().length > 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sell {item.product_name}</DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <Field label="Quantity" error={overStock ? `Only ${item.quantity} in stock.` : null}>
            <div className="flex items-center gap-2">
              {/* Stepper as well as a field: at a counter, tapping is faster
                  and less error-prone than selecting and retyping a number. */}
              <Button
                type="button" variant="secondary" size="icon"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="One fewer"
              >
                <Minus />
              </Button>
              <Input
                type="number" min={1} max={item.quantity} inputMode="numeric"
                className="text-center text-lg font-semibold"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              />
              <Button
                type="button" variant="secondary" size="icon"
                onClick={() => setQuantity((q) => Math.min(item.quantity, q + 1))}
                disabled={quantity >= item.quantity}
                aria-label="One more"
              >
                <Plus />
              </Button>
            </div>
          </Field>

          <Field
            label="Unit price"
            hint="Change it for a discount. The item's listed price is not altered."
            error={priceInvalid ? 'Enter a price above zero.' : null}
          >
            <Input
              type="number" inputMode="decimal" step="0.01" min="0"
              value={price} onChange={(e) => setPrice(e.target.value)}
            />
          </Field>

          <Field label="Customer" hint="Used to find the order again and to track spend.">
            <Input
              list="known-customers"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="Name"
              autoComplete="off"
            />
            <datalist id="known-customers">
              {customers.data?.map((c) => (
                <option key={c.customer_name} value={c.customer_name} />
              ))}
            </datalist>
          </Field>

          <div className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3">
            <span className="text-sm font-semibold text-ink-2">Total</span>
            <span className="tnum font-display text-xl font-semibold text-accent">
              {formatKsh(total)}
            </span>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!canSell || mutation.isPending}
          >
            {mutation.isPending ? <Loader2 className="animate-spin" /> : null}
            Put on hold
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
