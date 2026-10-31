import { NextRequest } from 'next/server'
import { apiHandler, ApiContext, ApiError } from '@/lib/api'
import { db } from '@/lib/db'
import { getPortalCustomer } from '@/lib/portal-customer'
import { InvoiceStatus, PayMethod, Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export const POST = apiHandler(null, async (req: NextRequest, session, context?: ApiContext) => {
  const customer = await getPortalCustomer(session)
  if (!customer) {
    throw new ApiError(401, 'Please sign in as a customer to pay invoices')
  }

  const params = await context?.params
  const idOrSeq = params?.id as string
  if (!idOrSeq) throw new ApiError(400, 'Invoice ID is required')

  const isNumeric = /^\d+$/.test(idOrSeq)
  const invoice = await db.invoice.findFirst({
    where: {
      ...(isNumeric ? { seq: parseInt(idOrSeq, 10) } : { id: idOrSeq }),
      customerId: customer.id, // Strictly scoped to authenticated customer!
    },
  })

  if (!invoice) {
    throw new ApiError(404, 'Invoice not found or access denied')
  }

  // Only CONFIRMED invoices can be paid. DRAFT must be confirmed by the
  // team first; CANCELLED and PAID cannot be settled.
  if (invoice.status === InvoiceStatus.PAID) {
    return { success: true, message: 'Invoice is already paid in full.' }
  }
  if (invoice.status === InvoiceStatus.DRAFT) {
    throw new ApiError(400, 'This invoice has not been confirmed yet — contact the billing team.')
  }
  if (invoice.status === InvoiceStatus.CANCELLED) {
    throw new ApiError(400, 'This invoice was cancelled and cannot be paid.')
  }

  const body = await req.json().catch(() => ({}))
  const { method = PayMethod.CARD, note = 'Settled via Customer Portal' } = body

  if (!Object.values(PayMethod).includes(method)) {
    throw new ApiError(400, 'Invalid payment method')
  }

  const payment = await db.$transaction(
    async (tx) => {
      // Re-read inside the transaction so two concurrent "Pay now" calls
      // cannot both charge the same invoice.
      const current = await tx.invoice.findUnique({ where: { id: invoice.id } })
      if (!current) throw new ApiError(404, 'Invoice no longer exists')
      if (current.status !== InvoiceStatus.CONFIRMED) {
        throw new ApiError(409, 'Invoice status changed while processing payment. Please retry.')
      }

      const outstanding = new Prisma.Decimal(current.total).minus(current.amountPaid)
      if (outstanding.lessThanOrEqualTo(0)) {
        return { alreadyPaid: true as const }
      }

      const amountToPay = Prisma.Decimal.min(outstanding, outstanding.toDecimalPlaces(2))
      const p = await tx.payment.create({
        data: {
          invoiceId: current.id,
          customerId: customer.id,
          method: method as PayMethod,
          amount: amountToPay,
          date: new Date(),
          note,
        },
      })

      // Recompute from the ledger, never from client math.
      const aggregate = await tx.payment.aggregate({
        _sum: { amount: true },
        where: { invoiceId: current.id },
      })
      const amountPaid = new Prisma.Decimal(aggregate._sum.amount ?? 0).toDecimalPlaces(2)
      const isFullyPaid = amountPaid.greaterThanOrEqualTo(current.total)

      const updatedInvoice = await tx.invoice.update({
        where: { id: current.id },
        data: {
          amountPaid,
          status: isFullyPaid ? InvoiceStatus.PAID : current.status,
        },
      })

      return { payment: p, invoice: updatedInvoice, alreadyPaid: false as const }
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  )

  if (payment.alreadyPaid) {
    return { success: true, message: 'Invoice is already paid in full.' }
  }

  return {
    success: true,
    message: `Invoice #${invoice.seq} paid successfully! Receipt generated.`,
    payment,
  }
})
