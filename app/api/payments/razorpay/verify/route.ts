import { NextRequest } from 'next/server'
import { apiHandler, ApiError } from '@/lib/api'
import { db } from '@/lib/db'
import { verifyRazorpaySignature } from '@/lib/razorpay'
import { InvoiceStatus, PayMethod, Prisma, Role } from '@prisma/client'

export const dynamic = 'force-dynamic'

/**
 * POST /api/payments/razorpay/verify
 * Verifies the Razorpay payment signature and records the payment.
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, invoiceId }
 *
 * Used by both the admin panel and the customer portal checkout, so any
 * authenticated session may call it — but customers can only settle
 * invoices that belong to them. The Razorpay signature keeps the payment
 * data itself un-forgeable.
 */
export const POST = apiHandler(null, async (req: NextRequest, session) => {
  if (!session) throw new ApiError(401, 'Please sign in to complete this payment')

  const body = await req.json().catch(() => ({}))
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    invoiceId,
  } = body

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !invoiceId) {
    throw new ApiError(400, 'Missing required payment verification fields')
  }

  // Step 1: Verify signature
  const isValid = await verifyRazorpaySignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  )

  if (!isValid) {
    throw new ApiError(400, 'Payment verification failed: invalid signature')
  }

  // Step 2: Record payment in an isolated transaction
  const result = await db.$transaction(
    async (tx) => {
      // Re-read the invoice inside the transaction to prevent double-pay races
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
      })

      if (!invoice) throw new ApiError(404, 'Invoice not found')

      // Customers may only pay their own invoices.
      if (session.role === Role.CUSTOMER && invoice.customerId !== session.customerId) {
        throw new ApiError(403, 'You can only pay invoices on your own account')
      }

      // Idempotency check: don't double record if verify is retried
      const existing = await tx.payment.findFirst({
        where: { note: { contains: razorpay_payment_id } },
      })
      if (existing) {
        return {
          success: true,
          message: 'Payment already recorded',
          payment: existing,
          isFullyPaid: invoice.status === InvoiceStatus.PAID,
        }
      }

      if (invoice.status === InvoiceStatus.PAID) {
        return {
          success: true,
          message: 'Invoice is already paid',
          alreadyPaid: true,
        }
      }
      if (invoice.status === InvoiceStatus.DRAFT) {
        throw new ApiError(400, 'Invoice must be confirmed before payment')
      }
      if (invoice.status === InvoiceStatus.CANCELLED) {
        throw new ApiError(400, 'Cannot pay a cancelled invoice')
      }

      const balanceDue = Math.max(0, Number(invoice.total) - Number(invoice.amountPaid))

      // Determine payment method from Razorpay (card, upi, netbanking)
      let mappedMethod: PayMethod = PayMethod.CARD
      try {
        const { getRazorpay } = await import('@/lib/razorpay')
        const razorpay = getRazorpay()
        const rzpPayment = await razorpay.payments.fetch(razorpay_payment_id)
        if (rzpPayment?.method === 'upi') {
          mappedMethod = PayMethod.UPI
        } else if (rzpPayment?.method === 'netbanking') {
          mappedMethod = PayMethod.BANK_TRANSFER
        } else {
          mappedMethod = PayMethod.CARD
        }
      } catch {
        mappedMethod = PayMethod.CARD
      }

      // Create the payment record
      const payment = await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          method: mappedMethod,
          amount: balanceDue,
          date: new Date(),
          note: `Razorpay Payment | Order: ${razorpay_order_id} | Payment: ${razorpay_payment_id}`,
        },
      })

      // Recompute amountPaid from all payments (aggregate for accuracy)
      const agg = await tx.payment.aggregate({
        where: { invoiceId: invoice.id },
        _sum: { amount: true },
      })

      const newAmountPaid = Number(agg._sum.amount || 0)
      const isFullyPaid = newAmountPaid >= Number(invoice.total) - 0.001

      // Update the invoice
      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: newAmountPaid,
          status: isFullyPaid ? InvoiceStatus.PAID : invoice.status,
        },
      })

      return {
        success: true,
        message: isFullyPaid
          ? 'Payment successful! Invoice marked as paid.'
          : 'Partial payment recorded successfully.',
        payment,
        isFullyPaid,
      }
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  )

  return result
})
