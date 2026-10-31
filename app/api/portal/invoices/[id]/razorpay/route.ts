import { NextRequest } from 'next/server'
import { apiHandler, ApiContext } from '@/lib/api'
import { db } from '@/lib/db'
import { getPortalCustomer } from '@/lib/portal-customer'
import { getRazorpay, toPaise } from '@/lib/razorpay'
import { InvoiceStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

/**
 * POST /api/portal/invoices/[id]/razorpay
 * Creates a Razorpay order for the customer's invoice.
 * Strictly scoped to the authenticated customer.
 */
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
      customerId: customer.id, // Strictly scoped to authenticated customer
    },
    include: {
      customer: {
        include: { user: { select: { name: true, email: true } } },
      },
    },
  })

  if (!invoice) throw new Error('Invoice not found or access denied')

  if (invoice.status === InvoiceStatus.PAID) {
    throw new Error('Invoice is already paid in full')
  }
  if (invoice.status === InvoiceStatus.CANCELLED) {
    throw new Error('Cannot pay a cancelled invoice')
  }
  if (invoice.status === InvoiceStatus.DRAFT) {
    throw new Error('Invoice must be confirmed before payment')
  }

  const balanceDue = Math.max(0, Number(invoice.total) - Number(invoice.amountPaid))
  if (balanceDue <= 0) {
    throw new Error('No outstanding balance on this invoice')
  }

  const razorpay = getRazorpay()

  const order = await razorpay.orders.create({
    amount: toPaise(balanceDue),
    currency: 'INR',
    receipt: `portal_inv_${invoice.seq}_${Date.now()}`,
    notes: {
      invoiceId: invoice.id,
      invoiceSeq: String(invoice.seq),
      customerId: customer.id,
      source: 'customer_portal',
    },
  })

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    invoiceId: invoice.id,
    invoiceSeq: invoice.seq,
    customerName: invoice.customer.user.name,
    customerEmail: invoice.customer.user.email,
    key: process.env.RAZORPAY_KEY_ID,
  }
})
