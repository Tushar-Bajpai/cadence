import { NextRequest } from 'next/server'
import { apiHandler, ApiContext } from '@/lib/api'
import { db } from '@/lib/db'
import { InvoiceStatus } from '@prisma/client'
import {
  isValidInvoiceTransition,
  invoiceTransitionError,
} from '@/lib/invoice-state'

export const dynamic = 'force-dynamic'

// Admin/staff only: invoice lifecycle transitions (DRAFT -> CONFIRMED -> PAID,
// CANCELLED from DRAFT/CONFIRMED). PAID flips automatically via payments.
export const POST = apiHandler(['ADMIN', 'STAFF'], async (
  req: NextRequest,
  session,
  context?: ApiContext
) => {
  const params = await context?.params
  const idOrSeq = params?.id as string
  if (!idOrSeq) throw new Error('Invoice ID is required')

  const body = await req.json()
  const to = body?.to as InvoiceStatus
  if (!to || !Object.values(InvoiceStatus).includes(to)) {
    throw new Error('A valid target status ("to") is required')
  }

  const isNumeric = /^\d+$/.test(idOrSeq)
  const invoice = await db.invoice.findFirst({
    where: isNumeric ? { seq: parseInt(idOrSeq, 10) } : { id: idOrSeq },
  })
  if (!invoice) throw new Error('Invoice not found')

  if (!isValidInvoiceTransition(invoice.status, to)) {
    throw new Error(invoiceTransitionError(invoice.status))
  }

  const updated = await db.invoice.update({
    where: { id: invoice.id },
    data: { status: to },
  })

  return {
    success: true,
    message: `Invoice ${updated.seq} moved to ${to}`,
    invoice: { id: updated.id, seq: updated.seq, status: updated.status },
  }
})
