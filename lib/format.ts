import { format } from 'date-fns'

export function formatSubNumber(seq: number): string {
  return `SUB-${String(seq).padStart(6, '0')}`
}

export function formatInvNumber(seq: number): string {
  return `INV-${String(seq).padStart(6, '0')}`
}

export const formatInvoiceNumber = formatInvNumber

export function formatCurrency(
  amount: number | string | { toString(): string },
  currency: string = 'INR'
): string {
  const num = typeof amount === 'number' ? amount : Number(amount.toString())
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 2,
  }).format(num)
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'dd MMM yyyy')
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'dd MMM yyyy, HH:mm')
}
