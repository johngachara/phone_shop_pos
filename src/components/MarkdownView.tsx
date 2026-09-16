import * as React from 'react'
import { useMemo } from 'react'
import { marked, type Token, type Tokens } from 'marked'
import { cn } from '@/lib/utils'

export interface MarkdownViewProps {
  content: string
  className?: string
}

function renderInlineToken(token: Token, key: React.Key): React.ReactNode {
  switch (token.type) {
    case 'strong': {
      const t = token as Tokens.Strong
      return (
        <strong key={key} className="font-semibold text-ink">
          {t.tokens ? t.tokens.map((child, i) => renderInlineToken(child, i)) : t.text}
        </strong>
      )
    }
    case 'em': {
      const t = token as Tokens.Em
      return (
        <em key={key} className="italic text-ink">
          {t.tokens ? t.tokens.map((child, i) => renderInlineToken(child, i)) : t.text}
        </em>
      )
    }
    case 'codespan': {
      const t = token as Tokens.Codespan
      return (
        <code
          key={key}
          className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-accent"
        >
          {t.text}
        </code>
      )
    }
    case 'del': {
      const t = token as Tokens.Del
      return (
        <del key={key} className="line-through text-ink-3">
          {t.tokens ? t.tokens.map((child, i) => renderInlineToken(child, i)) : t.text}
        </del>
      )
    }
    case 'link': {
      const t = token as Tokens.Link
      return (
        <a
          key={key}
          href={t.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline hover:text-accent-dim"
        >
          {t.tokens ? t.tokens.map((child, i) => renderInlineToken(child, i)) : t.text}
        </a>
      )
    }
    case 'br':
      return <br key={key} />
    case 'escape': {
      const t = token as Tokens.Escape
      return <React.Fragment key={key}>{t.text}</React.Fragment>
    }
    case 'text': {
      const t = token as Tokens.Text
      if ('tokens' in t && t.tokens && t.tokens.length > 0) {
        return (
          <React.Fragment key={key}>
            {t.tokens.map((child, i) => renderInlineToken(child, i))}
          </React.Fragment>
        )
      }
      return <React.Fragment key={key}>{t.text}</React.Fragment>
    }
    default: {
      if ('text' in token && typeof token.text === 'string') {
        return <React.Fragment key={key}>{token.text}</React.Fragment>
      }
      return null
    }
  }
}

function renderBlockToken(token: Token, key: React.Key): React.ReactNode {
  switch (token.type) {
    case 'heading': {
      const t = token as Tokens.Heading
      const children = t.tokens ? t.tokens.map((child, i) => renderInlineToken(child, i)) : t.text
      if (t.depth === 1) {
        return (
          <h1 key={key} className="mt-4 mb-2 font-display text-lg font-bold text-ink first:mt-0">
            {children}
          </h1>
        )
      }
      if (t.depth === 2) {
        return (
          <h2 key={key} className="mt-3.5 mb-1.5 font-display text-base font-semibold text-ink first:mt-0">
            {children}
          </h2>
        )
      }
      if (t.depth === 3) {
        return (
          <h3 key={key} className="mt-3 mb-1 font-display text-sm font-semibold text-ink first:mt-0">
            {children}
          </h3>
        )
      }
      return (
        <h4 key={key} className="mt-2.5 mb-1 font-display text-xs font-semibold text-ink first:mt-0">
          {children}
        </h4>
      )
    }

    case 'paragraph': {
      const t = token as Tokens.Paragraph
      return (
        <p key={key} className="my-1.5 leading-relaxed text-ink-2 first:mt-0 last:mb-0">
          {t.tokens ? t.tokens.map((child, i) => renderInlineToken(child, i)) : t.text}
        </p>
      )
    }

    case 'list': {
      const t = token as Tokens.List
      const ListTag = t.ordered ? 'ol' : 'ul'
      return (
        <ListTag
          key={key}
          className={cn(
            'my-2 space-y-1 text-ink-2 first:mt-0 last:mb-0',
            t.ordered ? 'list-decimal pl-5' : 'list-disc pl-5',
          )}
        >
          {t.items.map((item, i) => (
            <li key={i} className="leading-relaxed">
              {item.tokens && item.tokens.length > 0
                ? item.tokens.map((child, j) => {
                    if (child.type === 'text' && !('tokens' in child && child.tokens)) {
                      return <span key={j}>{child.text}</span>
                    }
                    if (child.type === 'list') {
                      return renderBlockToken(child, j)
                    }
                    if ('tokens' in child && child.tokens) {
                      return child.tokens.map((grandchild, k) => renderInlineToken(grandchild, `${j}-${k}`))
                    }
                    return renderInlineToken(child, j)
                  })
                : item.text}
            </li>
          ))}
        </ListTag>
      )
    }

    case 'table': {
      const t = token as Tokens.Table
      return (
        <div key={key} className="my-3 overflow-x-auto rounded-xl border border-line bg-surface-2/30">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line bg-surface-2">
                {t.header.map((col, i) => (
                  <th
                    key={i}
                    style={{ textAlign: t.align[i] || 'left' }}
                    className="px-3 py-2 font-semibold text-ink"
                  >
                    {col.tokens ? col.tokens.map((child, j) => renderInlineToken(child, j)) : col.text}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {t.rows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-line-soft last:border-0 hover:bg-surface-2/50 transition-colors"
                >
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      style={{ textAlign: t.align[j] || 'left' }}
                      className="px-3 py-2 text-ink-2"
                    >
                      {cell.tokens ? cell.tokens.map((child, k) => renderInlineToken(child, k)) : cell.text}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    case 'blockquote': {
      const t = token as Tokens.Blockquote
      return (
        <blockquote
          key={key}
          className="my-2 border-l-2 border-accent/60 pl-3.5 italic text-ink-3 first:mt-0 last:mb-0"
        >
          {t.tokens ? t.tokens.map((child, i) => renderBlockToken(child, i)) : t.text}
        </blockquote>
      )
    }

    case 'code': {
      const t = token as Tokens.Code
      return (
        <div
          key={key}
          className="my-2 overflow-x-auto rounded-xl border border-line bg-surface-2 p-3 font-mono text-xs text-ink"
        >
          {t.lang ? (
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ink-3">
              {t.lang}
            </div>
          ) : null}
          <pre>
            <code>{t.text}</code>
          </pre>
        </div>
      )
    }

    case 'hr':
      return <hr key={key} className="my-3 border-line" />

    case 'space':
      return null

    default:
      return renderInlineToken(token, key)
  }
}

export function MarkdownView({ content, className }: MarkdownViewProps) {
  const tokens = useMemo(() => {
    if (!content) return []
    try {
      return marked.lexer(content)
    } catch {
      return []
    }
  }, [content])

  if (!content) return null

  if (tokens.length === 0) {
    return <span className={className}>{content}</span>
  }

  return (
    <div className={cn('text-sm leading-relaxed', className)}>
      {tokens.map((token, i) => renderBlockToken(token, i))}
    </div>
  )
}
