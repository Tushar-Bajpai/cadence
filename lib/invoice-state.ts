import { InvoiceStatus } from '@prisma/client'

// Invoice lifecycle (plan Phase 6):
//   DRAFT -> CONFIRMED -> PAID, CANCELLED from DRAFT or CONFIRMED.
// PAID is set automatically by the payments flow (Phase 7), never directly.
export const INVOICE_ALLOWED_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  DRAFT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['CANCELLED'],
  PAID: [],
  CANCELLED: [],
}

export function isValidInvoiceTransition(
  from: InvoiceStatus,
  to: InvoiceStatus
): boolean {
  return INVOICE_ALLOWED_TRANSITIONS[from]?.includes(to) ?? false
}

export function invoiceTransitionError(from: InvoiceStatus): string {
  const allowed = INVOICE_ALLOWED_TRANSITIONS[from] ?? []
  return `Invalid invoice transition from "${from}". Allowed next: ${
    allowed.length > 0 ? allowed.join(', ') : 'None'
  }`
}
