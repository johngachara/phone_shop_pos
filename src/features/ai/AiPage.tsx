import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Loader2, Send, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { MarkdownView } from '@/components/MarkdownView'
import { cn, formatKsh } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface PendingAction {
  action_id: string
  tool: string
  arguments: Record<string, unknown>
  description: string
}

interface ChatReply {
  reply: string
  pending_actions: PendingAction[]
  tools_used: string[]
}

const SUGGESTIONS = [
  'What is running low?',
  'How did we do this week?',
  'Which screens sell best?',
]

export default function AiPage() {
  const queryClient = useQueryClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState<PendingAction | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, pending])

  const chat = useMutation({
    mutationFn: (history: Message[]) =>
      api<ChatReply>('/api/ai/chat/', { method: 'POST', json: { messages: history } }),
    onSuccess: (reply) => {
      setMessages((prev) => [...prev, { role: 'assistant', content: reply.reply }])
      // A proposed change opens the confirmation immediately. Nothing has
      // happened at this point -- the server has only written down what it
      // would do, and will not act until this dialog is accepted.
      if (reply.pending_actions.length > 0) setPending(reply.pending_actions[0])
    },
    onError: (error) => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `I could not answer that. ${error.message}` },
      ])
    },
  })

  const confirm = useMutation({
    mutationFn: (action: PendingAction) =>
      api<{ executed: boolean; description: string }>('/api/ai/confirm/', {
        method: 'POST', json: { action_id: action.action_id },
      }),
    onSuccess: (result) => {
      toast.success(result.executed ? 'Done' : 'That did not go through')
      queryClient.invalidateQueries({ queryKey: ['stock'] })
      queryClient.invalidateQueries({ queryKey: ['low-stock'] })
      setMessages((prev) => [
        ...prev, { role: 'assistant', content: `Done — ${result.description}` },
      ])
      setPending(null)
    },
    onError: (error) => { toast.error(error.message); setPending(null) },
  })

  function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || chat.isPending) return
    const next: Message[] = [...messages, { role: 'user', content: trimmed }]
    setMessages(next)
    setDraft('')
    chat.mutate(next)
  }

  return (
    <div className="flex min-h-[calc(100dvh-12rem)] flex-col lg:min-h-[calc(100dvh-8rem)]">
      <PageHeader
        title="Alltech AI"
        subtitle="Ask about phone screens, accessories and sales. It can suggest changes, but nothing happens until you approve it."
      />

      <div className="flex-1 space-y-3">
        {messages.length === 0 ? (
          <div className="surface rounded-2xl px-6 py-12 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-accent/12 text-accent">
              <Sparkles className="size-5" />
            </div>
            <h2 className="mt-4 font-display text-base font-semibold">Ask a question</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-ink-3">
              It can read phone screens, accessories and sales, and can propose
              changes to phone screens. It cannot sell, refund, or change anyone's account.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s} type="button" onClick={() => send(s)}
                  className="rounded-xl bg-surface-2 px-3.5 py-2.5 text-sm font-medium text-ink-2 hover:text-ink"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, i) => (
            <div
              key={i}
              className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                  message.role === 'user'
                    ? 'bg-accent text-accent-ink whitespace-pre-wrap'
                    : 'surface text-ink',
                )}
              >
                {message.role === 'assistant' ? (
                  <MarkdownView content={message.content} />
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))
        )}

        {chat.isPending ? (
          <div className="flex justify-start">
            <div className="surface flex items-center gap-2 rounded-2xl px-4 py-3 text-sm text-ink-3">
              <Loader2 className="size-4 animate-spin" /> Thinking
            </div>
          </div>
        ) : null}

        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(draft) }}
        className="glass sticky bottom-20 z-20 mt-4 flex gap-2 rounded-2xl p-2 lg:bottom-0"
      >
        <Input
          value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Explicit rather than relying on implicit form submission, which
            // did not fire here. A chat box where Enter does nothing reads as
            // broken.
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send(draft)
            }
          }}
          placeholder="Ask about phone screens or sales"
          className="border-0 bg-transparent focus:ring-0"
          autoComplete="off"
          disabled={chat.isPending}
        />
        <Button type="submit" size="icon" disabled={!draft.trim() || chat.isPending} aria-label="Send">
          <Send />
        </Button>
      </form>

      <Dialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-warn" /> Approve this change?
            </DialogTitle>
            <DialogDescription>
              Alltech AI has suggested this. Nothing has been changed yet.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            {pending ? <ActionProposalReview action={pending} /> : null}
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setPending(null)}>
              No, cancel
            </Button>
            <Button
              disabled={confirm.isPending}
              onClick={() => pending && confirm.mutate(pending)}
            >
              {confirm.isPending ? <Loader2 className="animate-spin" /> : null}
              Yes, do it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ActionProposalReview({ action }: { action: PendingAction }) {
  const isBatch = action.tool.endsWith('_batch') || Array.isArray(action.arguments?.items)
  const items = (Array.isArray(action.arguments?.items) ? action.arguments.items : []) as Array<Record<string, unknown> | number>

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-3">Proposed change</span>
        {isBatch ? (
          <Badge tone="warn" className="text-[11px]">
            Batch · {items.length} items
          </Badge>
        ) : null}
      </div>

      <p className="rounded-xl bg-surface-2 px-4 py-3 text-sm font-medium leading-relaxed text-ink">
        {action.description}
      </p>

      {isBatch && items.length > 0 ? (
        <div className="mt-2 space-y-2">
          <p className="text-xs font-semibold text-ink-2">
            Items to {action.tool.startsWith('add') ? 'add' : action.tool.startsWith('update') ? 'update' : 'delete'} ({items.length}):
          </p>
          <div className="max-h-56 overflow-y-auto rounded-xl border border-line-soft bg-surface-2 divide-y divide-line-soft">
            {items.map((item, idx) => {
              const obj = typeof item === 'object' && item !== null ? item : { id: item }
              return (
                <div key={idx} className="flex items-center justify-between gap-3 px-3.5 py-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-ink block truncate">
                      {String(obj.product_name || `Item #${obj.id}`)}
                    </span>
                    {action.tool.startsWith('update') ? (
                      <span className="text-ink-3 block truncate">
                        {Object.entries(obj)
                          .filter(([k, v]) => k !== 'id' && k !== 'product_name' && v !== undefined)
                          .map(([k, v]) => `${k.replace('_', ' ')}: ${String(v)}`)
                          .join(', ')}
                      </span>
                    ) : null}
                  </div>
                  <div className="shrink-0 flex items-center gap-2 tnum">
                    {obj.quantity !== undefined ? (
                      <span className="rounded-md bg-surface-3 px-1.5 py-0.5 font-medium text-ink-2">
                        Qty: {String(obj.quantity)}
                      </span>
                    ) : null}
                    {obj.selling_price !== undefined ? (
                      <span className="font-semibold text-accent">
                        {formatKsh(Number(obj.selling_price))}
                      </span>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
