import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Kenyan shillings, always with grouping and two decimals.
 *
 * Amounts arrive from the API as strings because they are DecimalField values:
 * sending them as JSON numbers would round them through a float on the way.
 * Parse only at the point of display. */
export function formatKsh(amount: string | number | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return '—'
  const value = typeof amount === 'string' ? Number(amount) : amount
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('en-KE').format(value)
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-KE', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(date)
}
