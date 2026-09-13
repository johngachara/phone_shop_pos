import type { ReactNode } from 'react'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card'

/** A chart with its title, an optional note, and a table fallback.
 *
 * The table is not decoration: it is how the same numbers stay available to a
 * screen reader, to anyone who cannot separate the hues, and to whoever needs
 * the exact figure rather than a position on an axis. */
export function ChartFrame({
  title, note, children, table,
}: {
  title: string
  note?: string
  children: ReactNode
  table?: ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {note ? <p className="mt-1 text-xs text-ink-3">{note}</p> : null}
      </CardHeader>
      <CardBody>
        <div className="h-64 w-full">{children}</div>
        {table ? (
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-semibold text-ink-3 hover:text-ink">
              Show the numbers
            </summary>
            <div className="mt-2 overflow-x-auto">{table}</div>
          </details>
        ) : null}
      </CardBody>
    </Card>
  )
}

export function DataTable({
  columns, rows,
}: {
  columns: string[]
  rows: (string | number)[][]
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-line-soft text-left">
          {columns.map((c) => (
            <th key={c} className="py-2 pr-4 text-xs font-semibold uppercase tracking-wide text-ink-3">
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-line-soft/60 last:border-0">
            {row.map((cell, j) => (
              <td key={j} className={`py-2 pr-4 ${j > 0 ? 'tnum' : ''}`}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
