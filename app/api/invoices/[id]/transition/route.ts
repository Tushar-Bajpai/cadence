import { NextRequest } from 'next/server'
import { apiHandler, ApiContext, ApiError } from '@/lib/api'
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

  const body = await req.json().catch(() => ({}))
  const to = body?.to as InvoiceStatus
  if (!to || !Object.values(InvoiceStatus).includes(to)) {
    throw new ApiError(400, 'A valid target status ("to") is required')
  }

  const isNumeric = /^\d+$/.test(idOrSeq)
  const invoice = await db.invoice.findFirst({
    where: isNumeric ? { seq: parseInt(idOrSeq, 10) } : { id: idOrSeq },
  })
  if (!invoice) throw new ApiError(404, 'Invoice not found')

  if (!isValidInvoiceTransition(invoice.status, to)) {
    throw new ApiError(400, invoiceTransitionError(invoice.status))
  }

  // Conditional update: only transition if the status is still what we read.
  // This prevents a race where a concurrent payment (setting PAID) or another
  // transition silently gets overwritten (last write wins).
  const updated = await db.invoice.updateMany({
    where: { id: invoice.id, status: invoice.status },
    data: { status: to },
  })
  if (updated.count === 0) {
    throw new ApiError(
      409,
      'Invoice status changed concurrently. Re-check its current state and retry.'
    )
  }

  const fresh = await db.invoice.findUnique({ where: { id: invoice.id } })

  return {
    success: true,
    message: `Invoice ${fresh!.seq} moved to ${to}`,
    invoice: { id: fresh!.id, seq: fresh!.seq, status: fresh!.status },
  }
})
