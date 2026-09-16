import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Clock, Loader2, Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { formatKsh } from '@/lib/utils'
import { Tooltip } from '@/components/ui/tooltip'
import { CustomerSearchInput } from '@/components/CustomerSearchInput'
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
    mutationFn: (complete: boolean) =>
      sellStock(item!.id, {
        product_name: item!.product_name,
        price,
        quantity,
        customer_name: customer.trim(),
        complete,
      }),
    onSuccess: (_data, complete) => {
      toast.success(
        complete
          ? `Sold ${item!.product_name} to ${customer.trim()}`
          : `${item!.product_name} on hold for ${customer.trim()}`,
      )
      queryClient.invalidateQueries({ queryKey: ['stock'] })
      queryClient.invalidateQueries({ queryKey: ['unpaid'] })
      queryClient.invalidateQueries({ queryKey: ['low-stock'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
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
            <CustomerSearchInput
              value={customer}
              onChange={setCustomer}
              customers={customers.data}
              isLoading={customers.isLoading}
              placeholder="Name"
            />
          </Field>

          <div className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3">
            <span className="text-sm font-semibold text-ink-2">Total</span>
            <span className="tnum font-display text-xl font-semibold text-accent">
              {formatKsh(total)}
            </span>
          </div>
        </DialogBody>

        {/* Two ways out, because the counter does both. Holding is for an
            item handed over before payment; selling outright is for one paid
            there and then, which would otherwise sit in Orders forever waiting
            for a completion nobody is going to perform. */}
        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Tooltip label="Hand the item over now and record payment later, under Orders.">
              <Button
                variant="secondary"
                onClick={() => mutation.mutate(false)}
                disabled={!canSell || mutation.isPending}
              >
                {mutation.isPending && mutation.variables === false
                  ? <Loader2 className="animate-spin" /> : <Clock />}
                Put on hold
              </Button>
            </Tooltip>
            <Tooltip label="The customer has paid. This counts towards today's sales straight away.">
              <Button
                onClick={() => mutation.mutate(true)}
                disabled={!canSell || mutation.isPending}
              >
                {mutation.isPending && mutation.variables === true
                  ? <Loader2 className="animate-spin" /> : <Check />}
                Sell — paid
              </Button>
            </Tooltip>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
