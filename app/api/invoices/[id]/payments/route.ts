import { NextRequest } from 'next/server'
import { apiHandler, ApiContext } from '@/lib/api'
import { db } from '@/lib/db'
import { InvoiceStatus, PayMethod } from '@prisma/client'

export const dynamic = 'force-dynamic'

export const POST = apiHandler(null, async (req: NextRequest, session, context?: ApiContext) => {
  const params = await context?.params
  const idOrSeq = params?.id as string

  if (!idOrSeq) throw new Error('Invoice ID is required')

  const isNumeric = /^\d+$/.test(idOrSeq)
  const invoice = await db.invoice.findFirst({
    where: isNumeric ? { seq: parseInt(idOrSeq, 10) } : { id: idOrSeq },
  })

  if (!invoice) throw new Error('Invoice not found')

  const body = await req.json()
  const { action, amount, method = PayMethod.CARD, date, note } = body

  // Mark as Unpaid action
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

  // Validate: only CONFIRMED invoices can receive payments
  if (invoice.status === InvoiceStatus.DRAFT) {
    throw new Error('Cannot record payment on a DRAFT invoice. Please confirm it first.')
  }
  if (invoice.status === InvoiceStatus.CANCELLED) {
    throw new Error('Cannot record payment on a CANCELLED invoice.')
  }
  if (invoice.status === InvoiceStatus.PAID) {
    throw new Error('Invoice is already fully paid.')
  }

  // Record payment action
  const payAmount = Number(amount)
  if (isNaN(payAmount) || payAmount <= 0) {
    throw new Error('Payment amount must be greater than zero')
  }

  // Reject overpayment
  const balanceDue = Number(invoice.total) - Number(invoice.amountPaid)
  if (payAmount > balanceDue + 0.01) {
    throw new Error(`Payment amount (${payAmount}) exceeds outstanding balance (${balanceDue.toFixed(2)})`)
  }

  const result = await db.$transaction(async (tx) => {
    // Re-read inside the transaction to prevent double-pay races
    const freshInvoice = await tx.invoice.findUnique({
      where: { id: invoice.id },
    })
    if (!freshInvoice) throw new Error('Invoice not found')
    if (freshInvoice.status === InvoiceStatus.PAID) {
      return { success: true, message: 'Invoice is already paid', alreadyPaid: true }
    }
    const freshBalanceDue = Number(freshInvoice.total) - Number(freshInvoice.amountPaid)
    if (payAmount > freshBalanceDue + 0.01) {
      throw new Error(`Payment amount exceeds current balance due (${freshBalanceDue.toFixed(2)})`)
    }

    const paymentDate = date ? new Date(date) : new Date()

    const p = await tx.payment.create({
      data: {
        invoiceId: freshInvoice.id,
        customerId: freshInvoice.customerId,
        method: (method as PayMethod) || PayMethod.CARD,
        amount: payAmount,
        date: paymentDate,
        note: note || `Payment recorded via Admin Panel`,
        recordedById: session?.userId || null,
      },
    })

    // Recompute amountPaid from all payments (aggregate for accuracy)
    const agg = await tx.payment.aggregate({
      where: { invoiceId: freshInvoice.id },
      _sum: { amount: true },
    })

    const newAmountPaid = Number(agg._sum.amount || 0)
    const isFullyPaid = newAmountPaid >= Number(freshInvoice.total) - 0.001

    await tx.invoice.update({
      where: { id: freshInvoice.id },
      data: {
        amountPaid: newAmountPaid,
        status: isFullyPaid ? InvoiceStatus.PAID : freshInvoice.status,
      },
    })

    return {
      success: true,
      message: isFullyPaid ? 'Invoice fully settled and marked as Paid!' : 'Partial payment recorded.',
      payment: p,
      isFullyPaid,
    }
  })

  return result
})
