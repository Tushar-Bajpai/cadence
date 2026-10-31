import { Prisma, InvoiceStatus, SubStatus } from '@prisma/client'
import { db } from './db'
import { addPeriod } from './billing-period'
import { evaluateDiscount, LineForDiscount } from './discounts'

export interface BillingRunResult {
  created: number
  skipped: number
  failed: number
  errors: string[]
}

export async function runBillingBatch(now = new Date(), batchSize = 100): Promise<BillingRunResult> {
  const result: BillingRunResult = {
    created: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  }

  // 1. Fetch active subscriptions due for billing
  const dueSubscriptions = await db.subscription.findMany({
    where: {
      status: SubStatus.ACTIVE,
      isPaused: false,
      nextBillingDate: { lte: now },
    },
    include: {
      plan: true,
      lines: true,
      discounts: {
        include: {
          discount: {
            include: {
              products: true,
            },
          },
        },
      },
      customer: true,
    },
    take: batchSize,
  })

  // 2. Process each subscription
  for (const sub of dueSubscriptions) {
    let currentNext = new Date(sub.nextBillingDate || sub.startDate)
    let loopCount = 0
    const MAX_CATCHUP_CYCLES = 24

    while (currentNext <= now && loopCount < MAX_CATCHUP_CYCLES) {
      loopCount++
      const periodStart = new Date(currentNext)
      const periodEnd = addPeriod(periodStart, sub.plan.billingPeriod)

      try {
        await db.$transaction(async (tx) => {
          // Check if invoice already exists for this exact period
          const existing = await tx.invoice.findUnique({
            where: {
              subscriptionId_periodStart: {
                subscriptionId: sub.id,
                periodStart,
              },
            },
          })

          if (existing) {
            result.skipped++
            return
          }

          // Calculate subtotal and tax
          let subtotal = new Prisma.Decimal(0)
          let taxTotal = new Prisma.Decimal(0)
          const invoiceLinesData = []
          const linesForDiscount: LineForDiscount[] = []

          for (const line of sub.lines) {
            const lineAmount = new Prisma.Decimal(line.amount)
            const lineTax = lineAmount.times(line.taxRate).dividedBy(100).toDecimalPlaces(2)

            subtotal = subtotal.plus(lineAmount)
            taxTotal = taxTotal.plus(lineTax)

            invoiceLinesData.push({
              description: line.description,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              taxAmount: lineTax,
              amount: lineAmount,
            })

            linesForDiscount.push({
              productId: line.productId,
              quantity: line.quantity,
              amount: lineAmount,
            })
          }

          // Evaluate applicable discounts
          let discountTotal = new Prisma.Decimal(0)
          const discountLinesData = []
          const appliedDiscountIds: string[] = []

          for (const sd of sub.discounts) {
            const evaluation = evaluateDiscount(sd.discount, linesForDiscount, now)
            if (evaluation) {
              discountTotal = discountTotal.plus(evaluation.amount)
              discountLinesData.push({
                discountId: evaluation.discountId,
                label: evaluation.label,
                amount: evaluation.amount,
              })
              appliedDiscountIds.push(evaluation.discountId)
            }
          }

          // Cap discounts at subtotal
          discountTotal = Prisma.Decimal.min(discountTotal, subtotal).toDecimalPlaces(2)
          const finalTotal = subtotal.plus(taxTotal).minus(discountTotal).toDecimalPlaces(2)

          // Due date = issue date + paymentTermDays
          const issueDate = new Date()
          const dueDate = new Date(issueDate.getTime() + sub.paymentTermDays * 24 * 60 * 60 * 1000)

          // Create invoice
          await tx.invoice.create({
            data: {
              subscriptionId: sub.id,
              customerId: sub.customerId,
              status: InvoiceStatus.CONFIRMED,
              periodStart,
              periodEnd,
              issueDate,
              dueDate,
              subtotal,
              taxTotal,
              discountTotal,
              total: finalTotal,
              amountPaid: new Prisma.Decimal(0),
              lines: {
                create: invoiceLinesData,
              },
              discountLines: {
                create: discountLinesData,
              },
            },
          })

          // Update subscription next billing date
          const shouldAutoClose = sub.plan.autoCloseOnEnd && periodEnd >= sub.expiryDate
          await tx.subscription.update({
            where: { id: sub.id },
            data: {
              nextBillingDate: periodEnd,
              lastBilledThrough: periodEnd,
              status: shouldAutoClose ? SubStatus.CLOSED : undefined,
            },
          })

          // Increment discount usage counters
          for (const dId of appliedDiscountIds) {
            await tx.discount.updateMany({
              where: { id: dId, usedCount: { lt: tx.discount.fields.usageLimit } },
              data: { usedCount: { increment: 1 } },
            })
          }

          result.created++
        })

        // Advance loop
        currentNext = periodEnd
      } catch (err: unknown) {
        const error = err as { code?: string; message?: string }
        if (error.code === 'P2002') {
          // Idempotency constraint caught
          result.skipped++
          currentNext = periodEnd
        } else {
          result.failed++
          result.errors.push(`Sub ${sub.id}: ${error.message || 'Billing error'}`)
          break
        }
      }
    }
  }

  return result
}

