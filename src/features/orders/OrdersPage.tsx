import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Loader2, Receipt, Undo2 } from 'lucide-react'
import { toast } from 'sonner'
import { api, listFrom } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ListSkeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/ui/empty'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Tooltip } from '@/components/ui/tooltip'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatDate, formatKsh } from '@/lib/utils'

interface PendingSale {
  id: number
  product_name: string
  quantity: number
  selling_price: string
  customer_name: string
  created_at: string
}

function fetchUnpaid() {
  return api<unknown>('/api/saved2').then(listFrom<PendingSale>)
}

export default function OrdersPage() {
  const queryClient = useQueryClient()
  const [refunding, setRefunding] = useState<PendingSale | null>(null)

  const orders = useQuery({ queryKey: ['unpaid'], queryFn: fetchUnpaid })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['unpaid'] })
    queryClient.invalidateQueries({ queryKey: ['stock'] })
    queryClient.invalidateQueries({ queryKey: ['low-stock'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
  }

  const complete = useMutation({
    mutationFn: (order: PendingSale) =>
      api(`/api/complete2/${order.id}`, { method: 'POST' }),
    onSuccess: (_data, order) => {
      toast.success(`Paid — ${order.product_name}`)
      invalidate()
    },
    onError: (error) => toast.error(error.message),
  })

  const refund = useMutation({
    mutationFn: (order: PendingSale) =>
      api(`/api/refund2/${order.id}`, { method: 'POST' }),
    onSuccess: (_data, order) => {
      toast.success(`Returned ${order.quantity} × ${order.product_name} to stock`)
      invalidate()
      setRefunding(null)
    },
    onError: (error) => toast.error(error.message),
  })

  const list = orders.data ?? []

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Items handed over but not yet paid for."
      />

      {orders.isLoading ? (
        <ListSkeleton />
      ) : orders.isError ? (
        <ErrorState
          body={(orders.error as Error).message}
          onRetry={() => void orders.refetch()}
        />
      ) : list.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Nothing on hold"
          body="Orders put on hold from the stock screen show up here until they are paid."
        />
      ) : (
        <ul className="space-y-2">
          {list.map((order) => {
            const busy =
              (complete.isPending && complete.variables?.id === order.id) ||
              (refund.isPending && refund.variables?.id === order.id)
            return (
              <Card key={order.id} className="rise p-4">
                <li className="flex flex-wrap items-center gap-x-4 gap-y-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{order.product_name}</p>
                    <p className="mt-0.5 text-sm capitalize text-ink-3">
                      {order.customer_name}
                      <span className="text-ink-3"> · {formatDate(order.created_at)}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="tnum font-display font-semibold">
                      {formatKsh(Number(order.selling_price) * order.quantity)}
                    </p>
                    <p className="tnum text-xs text-ink-3">
                      {order.quantity} × {formatKsh(order.selling_price)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Tooltip label="Record that the customer has paid. This counts towards today's sales and profit.">
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => complete.mutate(order)}
                      >
                        {busy ? <Loader2 className="animate-spin" /> : <Check />}
                        Mark paid
                      </Button>
                    </Tooltip>
                    <Tooltip label="Cancel this order and put the items back into stock. No money changes hands.">
                      <Button
                        size="sm" variant="secondary"
                        disabled={busy}
                        onClick={() => setRefunding(order)}
                      >
                        <Undo2 /> Return
                      </Button>
                    </Tooltip>
                  </div>
                </li>
              </Card>
            )
          })}
        </ul>
      )}

      <Dialog open={refunding !== null} onOpenChange={(o) => !o && setRefunding(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return this order?</DialogTitle>
            <DialogDescription>
              {refunding
                ? `${refunding.quantity} × ${refunding.product_name} goes back into stock and the order is cancelled. It was never paid for, so nothing is refunded.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRefunding(null)}>Keep it</Button>
            <Button
              variant="danger"
              disabled={refund.isPending}
              onClick={() => refunding && refund.mutate(refunding)}
            >
              {refund.isPending ? <Loader2 className="animate-spin" /> : null}
              Return to stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
