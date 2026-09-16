import * as React from 'react'
import { useState, useRef, useEffect, useMemo } from 'react'
import { Search, User, Check, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { scrollInputIntoView } from '@/lib/useMobileKeyboardScroll'

export interface CustomerSearchInputProps {
  value: string
  onChange: (value: string) => void
  customers?: { customer_name: string }[]
  isLoading?: boolean
  placeholder?: string
  autoFocus?: boolean
  disabled?: boolean
  id?: string
}

export function CustomerSearchInput({
  value,
  onChange,
  customers = [],
  isLoading = false,
  placeholder = 'Search or enter customer name...',
  autoFocus = false,
  disabled = false,
  id,
}: CustomerSearchInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Normalize and deduplicate customer names
  const customerNames = useMemo(() => {
    const names = new Set<string>()
    for (const c of customers) {
      const name = c.customer_name?.trim()
      if (name) names.add(name)
    }
    return Array.from(names)
  }, [customers])

  // Filter customers by query
  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase()
    if (!q) {
      return customerNames.slice(0, 15)
    }
    return customerNames
      .filter((name) => name.toLowerCase().includes(q))
      .slice(0, 15)
  }, [customerNames, value])

  // Reset highlight on query change or open
  useEffect(() => {
    setHighlightedIndex(-1)
  }, [value, isOpen])

  // Keep highlighted item in view when using arrow keys
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex] as HTMLElement | undefined
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex])

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  const handleSelect = (name: string) => {
    onChange(name)
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true)
      return
    }

    if (!isOpen) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1))
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
        e.preventDefault()
        handleSelect(filtered[highlightedIndex])
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setIsOpen(false)
    }
  }

  const hasExactMatch = useMemo(() => {
    const val = value.trim().toLowerCase()
    return customerNames.some((name) => name.toLowerCase() === val)
  }, [customerNames, value])

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-3.5 text-ink-3">
          <Search className="size-4" />
        </span>

        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete="off"
          placeholder={placeholder}
          onFocus={(e) => {
            scrollInputIntoView(e.currentTarget)
            setIsOpen(true)
          }}
          onChange={(e) => {
            onChange(e.target.value)
            setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-full min-h-11 rounded-xl bg-surface-2 border border-line pl-10 pr-9 text-sm text-ink',
            'placeholder:text-ink-3 transition-colors',
            'focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25',
            'disabled:opacity-50 text-[16px] sm:text-sm',
          )}
        />

        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange('')
              inputRef.current?.focus()
              setIsOpen(true)
            }}
            className="absolute right-2.5 rounded-md p-1 text-ink-3 hover:bg-surface-3 hover:text-ink"
            aria-label="Clear customer"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {isOpen && (
        <div
          className={cn(
            'absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto',
            'rounded-xl border border-line bg-surface shadow-[var(--shadow-float)]',
            'p-1 animate-in fade-in-0 zoom-in-95',
          )}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-4 text-xs text-ink-3">
              <Loader2 className="size-4 animate-spin" />
              <span>Loading customers...</span>
            </div>
          ) : filtered.length > 0 ? (
            <ul ref={listRef} role="listbox" className="space-y-0.5">
              {filtered.map((name, idx) => {
                const isSelected = name.toLowerCase() === value.trim().toLowerCase()
                const isHighlighted = idx === highlightedIndex

                return (
                  <li
                    key={name}
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(name)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={cn(
                      'flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors',
                      isHighlighted ? 'bg-surface-2 text-ink' : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
                      isSelected && 'font-medium text-accent',
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <User className="size-4 shrink-0 text-ink-3" />
                      <span className="truncate capitalize">{name}</span>
                    </div>
                    {isSelected ? <Check className="size-4 shrink-0 text-accent" /> : null}
                  </li>
                )
              })}

              {value.trim().length > 0 && !hasExactMatch ? (
                <li
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(value.trim())}
                  className={cn(
                    'mt-1 border-t border-line-soft pt-1.5 pb-1 px-3 text-xs text-ink-3 flex items-center justify-between gap-2',
                    'hover:bg-surface-2 rounded-lg cursor-pointer',
                  )}
                >
                  <span className="truncate">
                    Use new customer: <strong className="text-ink capitalize">"{value.trim()}"</strong>
                  </span>
                  <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent shrink-0">
                    New
                  </span>
                </li>
              ) : null}
            </ul>
          ) : (
            <div className="py-3 px-3 text-center">
              <p className="text-xs text-ink-3">No customers found.</p>
              {value.trim().length > 0 ? (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(value.trim())}
                  className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-3 transition-colors"
                >
                  Use new customer "{value.trim()}"
                </button>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
