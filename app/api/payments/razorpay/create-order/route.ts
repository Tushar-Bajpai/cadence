import { NextRequest } from 'next/server'
import { apiHandler, ApiError } from '@/lib/api'
import { db } from '@/lib/db'
import { getRazorpay, toPaise } from '@/lib/razorpay'
import { InvoiceStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

/**
 * POST /api/payments/razorpay/create-order
 * Creates a Razorpay order for a given invoice. Admin/staff only —
 * customers go through /api/portal/invoices/[id]/razorpay, which is
 * scoped to their own invoices.
 * Body: { invoiceId: string }
 * Returns: { orderId, amount, currency, invoiceId, key }
 */
export const POST = apiHandler(['ADMIN', 'STAFF'], async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}))
  const { invoiceId } = body

  if (!invoiceId) {
    throw new ApiError(400, 'invoiceId is required')
  }

  // Fetch the invoice
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      customer: {
        include: { user: { select: { name: true, email: true } } },
      },
    },
  })

  if (!invoice) throw new ApiError(404, 'Invoice not found')

  // Only allow payment on CONFIRMED invoices
  if (invoice.status === InvoiceStatus.PAID) {
    throw new ApiError(400, 'Invoice is already fully paid')
  }
  if (invoice.status === InvoiceStatus.CANCELLED) {
    throw new ApiError(400, 'Cannot pay a cancelled invoice')
  }
  if (invoice.status === InvoiceStatus.DRAFT) {
    throw new ApiError(400, 'Invoice must be confirmed before payment')
  }

  const balanceDue = Math.max(0, Number(invoice.total) - Number(invoice.amountPaid))
  if (balanceDue <= 0) {
    throw new ApiError(400, 'No outstanding balance on this invoice')
  }

  const razorpay = getRazorpay()

  const order = await razorpay.orders.create({
    amount: toPaise(balanceDue),
    currency: 'INR',
    receipt: `inv_${invoice.seq}_${Date.now()}`,
    notes: {
      invoiceId: invoice.id,
      invoiceSeq: String(invoice.seq),
      customerId: invoice.customerId,
      customerName: invoice.customer.user.name,
      customerEmail: invoice.customer.user.email,
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
