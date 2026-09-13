import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, BellRing, FileText } from 'lucide-react'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ListSkeleton, Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/ui/empty'
import { PageHeader } from '@/components/layout/PageHeader'
import { usePush } from '@/features/push/usePush'

interface InsightSummary {
  id: number
  kind: 'DAILY' | 'WEEKLY'
  title: string
  created_at: string
}

interface Insight extends InsightSummary {
  body: string
}

/** Render the light markdown the model emits.
 *
 * Text nodes only -- the report is model output and never becomes HTML. */
function report(text: string) {
  return text.split('\n').map((line, i) => {
    const bullet = /^\s*[-*]\s+/.test(line)
    const heading = /^#{1,3}\s+/.test(line)
    const body = line.replace(/^\s*[-*]\s+/, '').replace(/^#{1,3}\s+/, '')
    const parts = body.split(/(\*\*[^*]+\*\*)/g).filter(Boolean)

    if (!line.trim()) return <div key={i} className="h-3" />

    const content = parts.map((part, j) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={j} className="font-semibold text-ink">{part.slice(2, -2)}</strong>
        : <span key={j}>{part}</span>,
    )

    if (heading) {
      return <h3 key={i} className="mt-5 font-display text-base font-semibold">{content}</h3>
    }
    return (
      <p key={i} className={bullet ? 'pl-5 -indent-3 text-ink-2' : 'text-ink-2'}>
        {bullet ? '• ' : null}{content}
      </p>
    )
  })
}

export function InsightsListPage() {
  const { state, register, eligible } = usePush()

  const insights = useQuery({
    queryKey: ['insights'],
    queryFn: () => api<{ insights: InsightSummary[] }>('/api/insights/').then((b) => b.insights),
  })

  const rows = insights.data ?? []

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Daily and weekly sales summaries."
        action={
          eligible && state !== 'granted' ? (
            <Button onClick={() => void register()} disabled={state === 'registering'}>
              <BellRing /> Turn on notifications
            </Button>
          ) : null
        }
      />

      {eligible && state === 'granted' ? (
        <p className="mb-4 flex items-center gap-2 rounded-xl bg-surface-2 px-4 py-3 text-sm text-ink-2">
          <BellRing className="size-4 shrink-0 text-accent" />
          Notifications are on for this device. New reports arrive here and on your phone.
        </p>
      ) : null}

      {insights.isLoading ? (
        <ListSkeleton rows={3} />
      ) : insights.isError ? (
        <ErrorState body={(insights.error as Error).message} onRetry={() => void insights.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No reports yet"
          body="The daily summary is generated each morning and the weekly one on Saturday evening."
        />
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <Card key={row.id} className="rise p-0">
              <li>
                <Link
                  to={`/insights/${row.id}`}
                  className="flex items-center gap-3 px-4 py-4 transition-transform active:scale-[0.99]"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/12 text-accent">
                    <FileText className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{row.title}</span>
                    <span className="block text-xs text-ink-3">{formatDate(row.created_at)}</span>
                  </span>
                  <Badge tone={row.kind === 'WEEKLY' ? 'info' : 'neutral'}>
                    {row.kind === 'WEEKLY' ? 'Weekly' : 'Daily'}
                  </Badge>
                </Link>
              </li>
            </Card>
          ))}
        </ul>
      )}
    </>
  )
}

/** One report, in full.
 *
 * This is where a notification lands. The push body is truncated by the
 * operating system; this is the whole thing. */
export function InsightDetailPage() {
  const { id } = useParams<{ id: string }>()

  const insight = useQuery({
    queryKey: ['insight', id],
    queryFn: () => api<Insight>(`/api/insights/${id}/`),
    enabled: Boolean(id),
  })

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
        <Link to="/insights"><ArrowLeft /> All reports</Link>
      </Button>

      {insight.isLoading ? (
        <Card className="p-6 space-y-3">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </Card>
      ) : insight.isError ? (
        <ErrorState
          title="That report could not be opened"
          body={(insight.error as Error).message}
          onRetry={() => void insight.refetch()}
        />
      ) : insight.data ? (
        <Card className="rise p-6">
          <h1 className="font-display text-xl font-semibold">{insight.data.title}</h1>
          <p className="mt-1 text-xs text-ink-3">{formatDate(insight.data.created_at)}</p>
          <div className="mt-5 space-y-1 text-sm leading-relaxed">
            {report(insight.data.body)}
          </div>
        </Card>
      ) : null}
    </>
  )
}
