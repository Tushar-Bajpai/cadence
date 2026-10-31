import { NextRequest } from 'next/server'
import { apiHandler, ApiContext } from '@/lib/api'
import { db } from '@/lib/db'
import { InvoiceStatus, PayMethod } from '@prisma/client'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const invoicePaymentInputSchema = z.object({
  action: z.enum(['mark_unpaid', 'record_payment']).optional(),
  amount: z.coerce.number().positive().optional(),
  method: z.enum(['CARD', 'BANK_TRANSFER', 'UPI', 'CASH', 'CHEQUE']).default('CARD'),
  note: z.string().optional(),
})

export const POST = apiHandler(null, async (req: NextRequest, session, context?: ApiContext) => {
  const params = await context?.params
  const idOrSeq = params?.id as string

  if (!idOrSeq) throw new Error('Invoice ID is required')

  const isNumeric = /^\d+$/.test(idOrSeq)
  const invoice = await db.invoice.findFirst({
    where: isNumeric ? { seq: parseInt(idOrSeq, 10) } : { id: idOrSeq },
  })

  if (!invoice) throw new Error('Invoice not found')

  const { action, amount, method, note } = invoicePaymentInputSchema.parse(await req.json())

  // Mark as Unpaid action (matching button in screenshot 2: "✕ Mark as Unpaid")
  if (action === 'mark_unpaid') {
    const updated = await db.invoice.update({
      where: { id: invoice.id },
      data: {
        status: InvoiceStatus.CONFIRMED,
        amountPaid: 0,
      },
    })
    return { success: true, message: 'Invoice marked as unpaid', invoice: updated }
  }

  // Record payment action
  const payAmount = Number(amount) || Number(invoice.total) - Number(invoice.amountPaid)
  if (payAmount <= 0) {
    throw new Error('Payment amount must be greater than zero')
  }

  const newAmountPaid = Number(invoice.amountPaid) + payAmount
  const isFullyPaid = newAmountPaid >= Number(invoice.total)

  const payment = await db.$transaction(async (tx) => {
    const p = await tx.payment.create({
      data: {
        invoiceId: invoice.id,
        customerId: invoice.customerId,
        method: (method as PayMethod) || PayMethod.CARD,
        amount: payAmount,
        date: new Date(),
        note: note || `Payment recorded via Admin Panel`,
      },
    })

    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        amountPaid: newAmountPaid,
        status: isFullyPaid ? InvoiceStatus.PAID : invoice.status,
      },
    })

    return p
  })

  return {
    success: true,
    message: isFullyPaid ? 'Invoice fully settled and marked as Paid!' : 'Partial payment recorded.',
    payment,
    isFullyPaid,
  }
})

