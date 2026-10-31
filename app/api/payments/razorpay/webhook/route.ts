import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { InvoiceStatus, PayMethod } from '@prisma/client'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

/**
 * POST /api/payments/razorpay/webhook
 * Handles incoming Razorpay webhooks (e.g. payment.captured, order.paid).
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-razorpay-signature')
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

    // A webhook must be authenticated before it can mutate the ledger.
    if (!webhookSecret) {
      console.error(
        'Razorpay webhook rejected: RAZORPAY_WEBHOOK_SECRET is not configured'
      )
      return NextResponse.json(
        { error: 'Webhook not configured (missing RAZORPAY_WEBHOOK_SECRET)' },
        { status: 503 }
      )
    }
    if (!signature) {
      return NextResponse.json({ error: 'Missing webhook signature' }, { status: 400 })
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex')

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
    }

    const event = JSON.parse(rawBody)

    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const paymentEntity = event.payload?.payment?.entity
      const orderEntity = event.payload?.order?.entity
      const notes = paymentEntity?.notes || orderEntity?.notes || {}
      const invoiceId = notes.invoiceId
      const paymentId = paymentEntity?.id
      const orderId = paymentEntity?.order_id || orderEntity?.id

      if (invoiceId && paymentId) {
        await db.$transaction(async (tx) => {
          // Idempotency: skip if payment already recorded
          const existing = await tx.payment.findFirst({
            where: { note: { contains: paymentId } },
          })
          if (existing) return

          const invoice = await tx.invoice.findUnique({
            where: { id: invoiceId },
          })
          if (
            !invoice ||
            invoice.status === InvoiceStatus.PAID ||
            invoice.status === InvoiceStatus.CANCELLED
          ) {
            return
          }

          const balanceDue = Math.max(0, Number(invoice.total) - Number(invoice.amountPaid))
          const amount = paymentEntity.amount ? paymentEntity.amount / 100 : balanceDue

          let mappedMethod: PayMethod = PayMethod.CARD
          if (paymentEntity?.method === 'upi') mappedMethod = PayMethod.UPI
          else if (paymentEntity?.method === 'netbanking') mappedMethod = PayMethod.BANK_TRANSFER

          await tx.payment.create({
            data: {
              invoiceId: invoice.id,
              customerId: invoice.customerId,
              method: mappedMethod,
              amount: amount,
              date: new Date(),
              note: `Razorpay Webhook | Order: ${orderId} | Payment: ${paymentId}`,
            },
          })

          const agg = await tx.payment.aggregate({
            where: { invoiceId: invoice.id },
            _sum: { amount: true },
          })

          const newAmountPaid = Number(agg._sum.amount || 0)
          const isFullyPaid = newAmountPaid >= Number(invoice.total) - 0.001

          await tx.invoice.update({
            where: { id: invoice.id },
            data: {
              amountPaid: newAmountPaid,
              status: isFullyPaid ? InvoiceStatus.PAID : invoice.status,
            },
          })
        })
      }
    }

    return NextResponse.json({ status: 'ok' })
  } catch (err: any) {
    console.error('Razorpay webhook error:', err)
    return NextResponse.json({ error: err.message || 'Webhook processing failed' }, { status: 500 })
  }
}
