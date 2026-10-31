import { NextRequest } from 'next/server'
import { apiHandler, ApiContext, NotFoundError, UnauthorizedError } from '@/lib/api'
import { db } from '@/lib/db'
import { getPortalCustomer } from '@/lib/portal-customer'
import { InvoiceStatus, PayMethod } from '@prisma/client'

export const dynamic = 'force-dynamic'

export const POST = apiHandler(null, async (req: NextRequest, session, context?: ApiContext) => {
  const customer = await getPortalCustomer(session)
  if (!customer) throw new UnauthorizedError('Customer not authenticated')

  const params = await context?.params
  const idOrSeq = params?.id as string
  if (!idOrSeq) throw new NotFoundError('Invoice ID is required')

  const isNumeric = /^\d+$/.test(idOrSeq)
  const invoice = await db.invoice.findFirst({
    where: {
      ...(isNumeric ? { seq: parseInt(idOrSeq, 10) } : { id: idOrSeq }),
      customerId: customer.id, // Strictly scoped to authenticated customer!
    },
  })

  if (!invoice) {
    throw new NotFoundError('Invoice not found')
  }

  if (invoice.status === 'PAID') {
    return { success: true, message: 'Invoice is already paid in full.' }
  }

  const body = await req.json().catch(() => ({}))
  const { method = 'CARD', note = 'Settled via Customer Portal', amount } = body

  const balanceDue = Number(invoice.total) - Number(invoice.amountPaid)
  const amountToPay = amount ? Math.min(Number(amount), balanceDue) : balanceDue

  const paymentResult = await db.$transaction(async (tx) => {
    // Re-read invoice inside transaction to avoid race conditions
    const currentInv = await tx.invoice.findUnique({
      where: { id: invoice.id },
    })
    if (!currentInv) throw new NotFoundError('Invoice not found')

    const newAmountPaid = Number(currentInv.amountPaid) + amountToPay
    const isFullyPaid = newAmountPaid >= Number(currentInv.total)

    const payment = await tx.payment.create({
      data: {
        invoiceId: currentInv.id,
        customerId: customer.id,
        method: (method as PayMethod) || PayMethod.CARD,
        amount: amountToPay,
        date: new Date(),
        note,
      },
    })

    const updatedInvoice = await tx.invoice.update({
      where: { id: currentInv.id },
      data: {
        amountPaid: newAmountPaid,
        status: isFullyPaid ? InvoiceStatus.PAID : currentInv.status,
      },
    })

    return { payment, invoice: updatedInvoice }
  })

  return {
    success: true,
    message: `Payment of ₹${amountToPay} recorded successfully.`,
    payment: paymentResult.payment,
    invoice: paymentResult.invoice,
  }
})
