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
import { cn } from '@/lib/utils'

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

/** Render the small amount of markdown the model actually emits.
 *
 * It returns **bold** and bullet lines however firmly the prompt asks for
 * plain text, and printing the asterisks verbatim looks like a bug. This is
 * deliberately not a markdown parser: the input is model output rendered as
 * text nodes, never as HTML, so there is nothing here that can inject markup. */
function renderLightMarkdown(text: string) {
  return text.split('\n').map((line, lineIndex) => {
    const bullet = /^\s*[-*]\s+/.test(line)
    const body = bullet ? line.replace(/^\s*[-*]\s+/, '') : line
    const parts = body.split(/(\*\*[^*]+\*\*)/g).filter(Boolean)

    return (
      <span key={lineIndex} className={cn('block', bullet && 'pl-4 -indent-4')}>
        {bullet ? '• ' : null}
        {parts.map((part, i) =>
          part.startsWith('**') && part.endsWith('**') ? (
            <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
          ) : (
            <span key={i}>{part}</span>
          ),
        )}
      </span>
    )
  })
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
                  'max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed',
                  message.role === 'user'
                    ? 'bg-accent text-accent-ink'
                    : 'surface text-ink',
                )}
              >
                {message.role === 'assistant'
                  ? renderLightMarkdown(message.content)
                  : message.content}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-warn" /> Approve this change?
            </DialogTitle>
            <DialogDescription>
              Alltech AI has suggested this. Nothing has been changed yet.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            {/* The plain-language description, not the raw arguments. If the
                person approving cannot tell what will happen, the confirmation
                step is theatre. */}
            <p className="rounded-xl bg-surface-2 px-4 py-3.5 text-sm font-medium">
              {pending?.description}
            </p>
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
