import { NextRequest } from 'next/server'
import { apiHandler, ApiContext } from '@/lib/api'
import { db } from '@/lib/db'
import { getPortalCustomer } from '@/lib/portal-customer'
import { InvoiceStatus, PayMethod } from '@prisma/client'

export const dynamic = 'force-dynamic'

export const POST = apiHandler(null, async (req: NextRequest, session, context?: ApiContext) => {
  const customer = await getPortalCustomer(session)
  if (!customer) throw new Error('Customer not found')

  const params = await context?.params
  const idOrSeq = params?.id as string
  if (!idOrSeq) throw new Error('Invoice ID is required')

  const isNumeric = /^\d+$/.test(idOrSeq)
  const invoice = await db.invoice.findFirst({
    where: {
      ...(isNumeric ? { seq: parseInt(idOrSeq, 10) } : { id: idOrSeq }),
      customerId: customer.id, // Strictly scoped to authenticated customer!
    },
  })

  if (!invoice) {
    throw new Error('Invoice not found or access denied')
  }

  if (invoice.status === 'PAID') {
    return { success: true, message: 'Invoice is already paid in full.' }
  }

  const body = await req.json().catch(() => ({}))
  const { method = 'CARD', note = 'Settled via Customer Portal' } = body

  const amountToPay = Number(invoice.total) - Number(invoice.amountPaid)

  const payment = await db.$transaction(async (tx) => {
    const p = await tx.payment.create({
      data: {
        invoiceId: invoice.id,
        customerId: customer.id,
        method: (method as PayMethod) || PayMethod.CARD,
        amount: amountToPay,
        date: new Date(),
        note,
      },
    })

    const updatedInvoice = await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        amountPaid: Number(invoice.total),
        status: InvoiceStatus.PAID,
      },
    })

    return { payment: p, invoice: updatedInvoice }
  })

  return {
    success: true,
    message: `Invoice #${invoice.seq} paid successfully! Receipt generated.`,
    payment,
  }
})
