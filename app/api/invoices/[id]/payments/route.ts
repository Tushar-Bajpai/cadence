import { NextRequest } from 'next/server'
import { apiHandler, ApiContext } from '@/lib/api'
import { db } from '@/lib/db'
import { InvoiceStatus, InvoiceStatus as S, PayMethod, Prisma } from '@prisma/client'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const invoicePaymentInputSchema = z.object({
  action: z.enum(['mark_unpaid', 'record_payment']).optional(),
  amount: z.coerce.number().positive().optional(),
  method: z.enum(['CARD', 'BANK_TRANSFER', 'UPI', 'CASH', 'CHEQUE']).default('CARD'),
  note: z.string().optional(),
})

// Record a payment against a CONFIRMED invoice (admin/staff only).
// Rules (plan Phase 7): reject on draft/cancelled/paid or overpayment;
// in one transaction create the payment, recompute amountPaid from
// aggregate _sum (re-reading the invoice inside the tx to avoid double-pay
// races), and flip the status to PAID when fully settled.
export const POST = apiHandler(['ADMIN', 'STAFF'], async (
  req: NextRequest,
  session,
  context?: ApiContext
) => {
  const params = await context?.params
  const idOrSeq = params?.id as string
  if (!idOrSeq) throw new Error('Invoice ID is required')

  const isNumeric = /^\d+$/.test(idOrSeq)
  const body = await req.json()
  const { action, amount: inputAmount, method, note } = invoicePaymentInputSchema.parse(body)

  // Handle Mark as Unpaid action
  if (action === 'mark_unpaid') {
    const invoice = await db.invoice.findFirst({
      where: isNumeric ? { seq: parseInt(idOrSeq, 10) } : { id: idOrSeq },
    })
    if (!invoice) throw new Error('Invoice not found')

    const updated = await db.invoice.update({
      where: { id: invoice.id },
      data: {
        status: InvoiceStatus.CONFIRMED,
        amountPaid: 0,
      },
    })
    return { success: true, message: 'Invoice marked as unpaid', invoice: updated }
  }

  const result = await db.$transaction(async (tx) => {
    // Re-read inside the transaction to serialize concurrent payments.
    const invoice = await tx.invoice.findFirst({
      where: isNumeric ? { seq: parseInt(idOrSeq, 10) } : { id: idOrSeq },
    })
    if (!invoice) throw new Error('Invoice not found')

    if (invoice.status === InvoiceStatus.DRAFT) {
      throw new Error('Confirm the invoice before recording payments')
    }
    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new Error('Payments cannot be recorded against a cancelled invoice')
    }
    if (invoice.status === InvoiceStatus.PAID) {
      throw new Error('Invoice is already fully paid')
    }

    const outstanding = new Prisma.Decimal(invoice.total).minus(invoice.amountPaid)
    const amount = inputAmount != null ? new Prisma.Decimal(Number(inputAmount)) : outstanding

    if (amount.lessThanOrEqualTo(0)) {
      throw new Error('Payment amount must be greater than zero')
    }
    if (amount.greaterThan(outstanding)) {
      throw new Error(
        `Overpayment rejected: outstanding amount is ${outstanding.toFixed(2)}`
      )
    }

    const payment = await tx.payment.create({
      data: {
        invoiceId: invoice.id,
        customerId: invoice.customerId,
        method: (method as PayMethod) ?? PayMethod.CARD,
        amount: amount.toDecimalPlaces(2),
        date: new Date(),
        note: note || `Payment recorded by ${session?.name || 'admin'}`,
        recordedById: session?.userId || null,
      },
    })

    // Recompute from the ledger, never from client math.
    const aggregate = await tx.payment.aggregate({
      _sum: { amount: true },
      where: { invoiceId: invoice.id },
    })
    const amountPaid = new Prisma.Decimal(aggregate._sum.amount ?? 0)
    const isFullyPaid = amountPaid.greaterThanOrEqualTo(invoice.total)

    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        amountPaid: amountPaid.toDecimalPlaces(2),
        status: isFullyPaid ? S.PAID : invoice.status,
      },
    })

    return { payment, amountPaid, isFullyPaid }
  })

  return {
    success: true,
    message: result.isFullyPaid
      ? 'Invoice fully settled and marked as Paid.'
      : 'Partial payment recorded.',
    payment: result.payment,
    amountPaid: Number(result.amountPaid),
    isFullyPaid: result.isFullyPaid,
  }
})
