import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { Loader2, Printer, PrinterCheck } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/useAuth'
import { encodeReceipt, money, receiptText, receiptTotal, type Receipt } from './escpos'
import { usePrinter } from './usePrinter'

interface ReceiptPromptState {
  pending: Receipt | null
  dismiss: () => void
}

const useReceiptPrompt = create<ReceiptPromptState>((set) => ({
  pending: null,
  dismiss: () => set({ pending: null }),
}))

/** Offer to print a receipt for a sale that has just been paid.
 *
 * Does nothing unless a receipt printer is connected right now: asking
 * "print a receipt?" with nothing to print on would be a question with only
 * one usable answer. Called from every place a sale becomes paid. */
export function offerReceipt(receipt: Omit<Receipt, 'servedBy' | 'at'> & { at?: Date }) {
  if (usePrinter.getState().status !== 'connected') return
  const email = useAuth.getState().session?.user?.email ?? null
  useReceiptPrompt.setState({
    pending: { ...receipt, at: receipt.at ?? new Date(), servedBy: email?.split('@')[0] ?? null },
  })
}

/** Mounted once, in the app shell. */
export function ReceiptPrompt() {
  const pending = useReceiptPrompt((s) => s.pending)
  const dismiss = useReceiptPrompt((s) => s.dismiss)
  const print = usePrinter((s) => s.print)
  const status = usePrinter((s) => s.status)
  const [busy, setBusy] = useState(false)

  // Unplugged while the question was showing: the answer can no longer be yes.
  useEffect(() => {
    if (pending && status === 'disconnected') dismiss()
  }, [pending, status, dismiss])

  async function onPrint() {
    if (!pending) return
    setBusy(true)
    try {
      await print(encodeReceipt(pending))
      toast.success('Receipt printed')
      dismiss()
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const preview = pending ? receiptText(pending) : null

  return (
    <Dialog open={pending !== null} onOpenChange={(o) => !o && !busy && dismiss()}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Print a receipt?</DialogTitle>
          <DialogDescription>
            The sale is recorded either way.
          </DialogDescription>
        </DialogHeader>
        {pending && preview ? (
          <DialogBody>
            {/* What will come out of the printer, line for line. */}
            <div className="overflow-x-auto rounded-xl bg-surface-2 px-3 py-3">
              <pre className="mx-auto w-max font-mono text-[10px] leading-snug text-ink sm:text-[11px]">
                <span className="block text-center font-bold">{preview.header[0]}</span>
                <span className="block text-center">{preview.header[1]}</span>
                {'\n'}{preview.body.join('\n')}
                {'\n'}<span className="font-bold">{`TOTAL  KSh ${money(receiptTotal(pending))}`}</span>
              </pre>
            </div>
          </DialogBody>
        ) : null}
        <DialogFooter>
          <Button variant="secondary" onClick={dismiss} disabled={busy}>No thanks</Button>
          <Button onClick={() => void onPrint()} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Printer />}
            Print receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Shows whether the receipt printer is connected, and pairs it the first time. */
export function PrinterControl({ className, compact = false }: { className?: string; compact?: boolean }) {
  const status = usePrinter((s) => s.status)
  const deviceName = usePrinter((s) => s.deviceName)
  const init = usePrinter((s) => s.init)
  const pair = usePrinter((s) => s.pair)
  const forget = usePrinter((s) => s.forget)
  const print = usePrinter((s) => s.print)
  const [open, setOpen] = useState(false)

  useEffect(() => { void init() }, [init])

  // A phone or iPad browser without USB access: nothing to show.
  if (status === 'unsupported') return null

  const connected = status === 'connected' || status === 'printing'

  async function onPair() {
    try { await pair() } catch (error) { toast.error((error as Error).message) }
  }

  async function onTest() {
    try {
      await print(encodeReceipt({
        saleId: 'TEST', customer: 'Test print', saleType: 'CUSTOMER', at: new Date(),
        lines: [{ name: 'Printer check', quantity: 1, unitPrice: 0 }],
      }))
      toast.success('Test receipt printed')
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  const button = (
    <Button
      variant="ghost"
      size={compact ? 'icon' : 'md'}
      className={cn(!compact && 'w-full justify-start', className)}
      onClick={() => (connected ? setOpen(true) : void onPair())}
      aria-label={connected ? 'Receipt printer connected' : 'Connect receipt printer'}
    >
      <span className="relative">
        {connected ? <PrinterCheck /> : <Printer />}
        <span
          className={cn(
            'absolute -right-0.5 -top-0.5 size-2 rounded-full ring-2 ring-surface',
            connected ? 'bg-accent' : 'bg-ink-3',
          )}
        />
      </span>
      {compact ? null : connected ? 'Printer connected' : 'Connect printer'}
    </Button>
  )

  return (
    <>
      <Tooltip
        label={connected
          ? `${deviceName} is connected. Receipts are offered when a sale is paid.`
          : 'Connect the USB receipt printer. Chrome remembers it after the first time.'}
        side="bottom"
      >
        {button}
      </Tooltip>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Receipt printer</DialogTitle>
            <DialogDescription>
              {deviceName} is connected. When a sale is paid you will be asked whether to print a receipt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-between">
            <Button variant="ghost" onClick={() => { void forget(); setOpen(false) }}>
              Forget printer
            </Button>
            <Button variant="secondary" disabled={status === 'printing'} onClick={() => void onTest()}>
              {status === 'printing' ? <Loader2 className="animate-spin" /> : <Printer />}
              Print test receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
