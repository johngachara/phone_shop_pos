import { Pencil, ShoppingCart, Trash2 } from 'lucide-react'
import {
  Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { StockLevel } from '@/components/ui/badge'
import { Tooltip } from '@/components/ui/tooltip'
import { formatDate, formatKsh } from '@/lib/utils'

export interface Product {
  id: number
  product_name: string
  quantity: number
  selling_price: string
  buying_price: string | null
  created_at?: string
  updated_at?: string
}

/** Everything about one product, with its actions in the same place.
 *
 * The list is built for scanning: a name, a price and a stock badge. Anything
 * more makes a row that cannot be read at a glance. The detail that does not
 * fit there -- margin, what it cost, when it was last touched -- lives here,
 * and the actions sit beside the numbers they act on rather than as icons on a
 * crowded row.
 */
export function ProductSheet({
  product, open, kind, onOpenChange, onSell, onEdit, onDelete,
}: {
  product: Product | null
  open: boolean
  kind: 'screen' | 'accessory'
  onOpenChange: (open: boolean) => void
  onSell: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  if (!product) return null

  const selling = Number(product.selling_price)
  const cost = product.buying_price === null ? null : Number(product.buying_price)
  const margin = cost === null ? null : selling - cost
  const marginPercent =
    margin === null || selling <= 0 ? null : Math.round((margin / selling) * 100)
  const outOfStock = product.quantity <= 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="pr-4">{product.product_name}</DialogTitle>
          <div className="mt-2">
            <StockLevel quantity={product.quantity} />
          </div>
        </DialogHeader>

        <DialogBody className="space-y-3">
          <dl className="divide-y divide-line-soft rounded-xl bg-surface-2 px-4">
            <Row label="Selling price" value={formatKsh(product.selling_price)} />
            <Row
              label="Buying price"
              value={cost === null ? 'Not recorded' : formatKsh(product.buying_price)}
              muted={cost === null}
            />
            <Row
              label="Margin per unit"
              value={
                margin === null
                  ? 'Needs a buying price'
                  : `${formatKsh(margin)}${marginPercent !== null ? ` · ${marginPercent}%` : ''}`
              }
              tone={margin === null ? 'muted' : margin > 0 ? 'good' : 'bad'}
            />
            <Row
              label="Stock value at cost"
              value={cost === null ? '—' : formatKsh(cost * product.quantity)}
              muted={cost === null}
            />
            {product.updated_at ? (
              <Row label="Last updated" value={formatDate(product.updated_at)} muted />
            ) : null}
          </dl>

          {margin !== null && margin <= 0 ? (
            <p className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-xs text-danger">
              This sells for no more than it cost. Every sale loses money.
            </p>
          ) : null}
        </DialogBody>

        <DialogFooter className="sm:justify-between">
          <div className="flex gap-2">
            <Tooltip label="Change the name, quantity or prices.">
              <Button variant="secondary" size="icon" onClick={onEdit} aria-label="Edit">
                <Pencil />
              </Button>
            </Tooltip>
            <Tooltip label={`Remove this ${kind}. Past sales of it are kept.`}>
              <Button variant="secondary" size="icon" onClick={onDelete} aria-label="Delete">
                <Trash2 />
              </Button>
            </Tooltip>
          </div>
          <Tooltip
            label={
              outOfStock
                ? 'Out of stock. Add more before selling.'
                : 'Put on hold for a customer, or record it as paid.'
            }
          >
            <Button size="lg" disabled={outOfStock} onClick={onSell}>
              <ShoppingCart /> Sell
            </Button>
          </Tooltip>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Row({
  label, value, muted, tone,
}: {
  label: string
  value: string
  muted?: boolean
  tone?: 'good' | 'bad' | 'muted'
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-sm text-ink-2">{label}</dt>
      <dd
        className={
          'tnum text-sm font-semibold ' +
          (tone === 'good' ? 'text-accent'
            : tone === 'bad' ? 'text-danger'
            : muted || tone === 'muted' ? 'text-ink-3' : 'text-ink')
        }
      >
        {value}
      </dd>
    </div>
  )
}
