import { Prisma, InvoiceStatus, SubStatus, TaxType } from '@prisma/client'
import { db } from './db'
import { addPeriod } from './billing-period'
import { evaluateDiscount, LineForDiscount } from './discounts'
import { calcLineTax, TaxInfo } from './pricing'

export interface BillingRunResult {
  created: number
  skipped: number
  failed: number
  errors: string[]
}

// Safety caps: 24 missed periods per catch-up loop (plan spec), and a bound on
// invoices created per run so a pathological DB state can never loop forever.
const MAX_CATCHUP_CYCLES = 24
const MAX_CREATED_PER_RUN = 5000

export async function runBillingBatch(now = new Date(), batchSize = 100): Promise<BillingRunResult> {
  const result: BillingRunResult = {
    created: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  }
  const processedIds = new Set<string>()

  // Drain loop: keep pulling fresh batches of due subscriptions until none
  // remain. Already-processed ids are excluded so a subscription that has hit
  // its catch-up cap can never wedge the run (it stays due for the next run).
  while (result.created + result.skipped < MAX_CREATED_PER_RUN) {
    const dueSubscriptions = await db.subscription.findMany({
      where: {
        status: SubStatus.ACTIVE,
        isPaused: false,
        OR: [{ nextBillingDate: { lte: now } }, { nextBillingDate: null }],
        ...(processedIds.size > 0 ? { id: { notIn: Array.from(processedIds) } } : {}),
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
        invoices: {
          orderBy: { periodEnd: 'desc' },
          take: 1,
          select: { periodEnd: true },
        },
      },
      take: batchSize,
      orderBy: { nextBillingDate: 'asc' },
    })

    if (dueSubscriptions.length === 0) break

    for (const sub of dueSubscriptions) {
      processedIds.add(sub.id)
      await billSubscription(sub, now, result)
    }
  }

  return result
}

/**
 * Bills every missed billing cycle of one subscription, one invoice per period,
 * one transaction per period. The @@unique([subscriptionId, periodStart])
 * constraint on Invoice makes billing the same cycle twice impossible:
 * a P2002 error is treated as "already billed" (skip + advance).
 */
async function billSubscription(
  sub: Prisma.SubscriptionGetPayload<{
    include: {
      plan: true
      lines: true
      discounts: { include: { discount: { include: { products: true } } } }
      customer: true
      invoices: {
        orderBy: { periodEnd: 'desc' }
        take: 1
        select: { periodEnd: true }
      }
    }
  }>,
  now: Date,
  result: BillingRunResult
) {
  // Resolve each line product's CURRENT taxes so we can compute exact line tax
  // at billing time. This keeps taxes "auto-calculated" and correctly handles
  // FIXED-type taxes (which cannot be expressed via the percentage snapshot
  // in SubscriptionLine.taxRate). The snapshot is only a fallback.
  const productIds = [...new Set(sub.lines.map((line) => line.productId))]
  const productsWithTaxes = productIds.length
    ? await db.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          taxes: { select: { tax: { select: { name: true, type: true, value: true } } } },
        },
      })
    : []
  const taxesByProduct = new Map<string, TaxInfo[]>(
    productsWithTaxes.map((p) => [
      p.id,
      p.taxes.map((pt) => ({
        name: pt.tax.name,
        type: pt.tax.type,
        value: pt.tax.value,
      })),
    ])
  )

  // Older active subscriptions may not have had a billing cursor persisted.
  // Resume after the latest invoice when available; otherwise start at the
  // subscription's original start date.
  let currentNext = sub.nextBillingDate
    ? new Date(sub.nextBillingDate)
    : sub.invoices[0]?.periodEnd
      ? new Date(sub.invoices[0].periodEnd)
      : new Date(sub.startDate)
  let cycles = 0

  while (currentNext <= now && cycles < MAX_CATCHUP_CYCLES) {
    cycles++
    const periodStart = new Date(currentNext)
    const periodEnd = addPeriod(periodStart, sub.plan.billingPeriod)

    try {
      const outcome = await db.$transaction(async (tx) => {
        // Idempotency check against the hard guarantee (defensive fast path
        // with a clean skip; P2002 below is the backstop).
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
          return 'skipped' as const
        }

        // ---- Compute invoice lines, taxes, and totals (Decimal math only) ----
        const invoiceLinesData: {
          description: string
          quantity: number
          unitPrice: Prisma.Decimal
          taxAmount: Prisma.Decimal
          amount: Prisma.Decimal
        }[] = []
        const linesForDiscount: LineForDiscount[] = []
        let subtotal = new Prisma.Decimal(0)
        let taxTotal = new Prisma.Decimal(0)

        for (const line of sub.lines) {
          const amount = new Prisma.Decimal(line.amount)
          const productTaxes = taxesByProduct.get(line.productId) ?? []

          // Prefer exact product taxes resolved at billing time (supports
          // FIXED + multi-tier percentage). Fall back to the stored snapshot.
          let lineTax: Prisma.Decimal
          if (productTaxes.length > 0) {
            lineTax = calcLineTax(line.quantity, Number(line.unitPrice), productTaxes).taxTotal
          } else if (line.taxType === TaxType.FIXED) {
            lineTax = new Prisma.Decimal(line.taxRate).times(line.quantity).toDecimalPlaces(2)
          } else {
            lineTax = amount.times(line.taxRate).dividedBy(100).toDecimalPlaces(2)
          }

          subtotal = subtotal.plus(amount)
          taxTotal = taxTotal.plus(lineTax)

          invoiceLinesData.push({
            description: line.description,
            quantity: line.quantity,
            unitPrice: new Prisma.Decimal(line.unitPrice),
            taxAmount: lineTax,
            amount,
          })
          linesForDiscount.push({
            productId: line.productId,
            quantity: line.quantity,
            amount,
          })
        }

        // ---- Auto-apply discounts with an atomic usage claim ----
        // Claiming usedCount (updateMany WHERE usedCount < usageLimit) before
        // writing the invoice guarantees an exhausted discount can never appear
        // on an invoice even under concurrent billing runs.
        const discountLinesData: {
          discountId: string
          label: string
          amount: Prisma.Decimal
        }[] = []
        let discountTotal = new Prisma.Decimal(0)

        for (const sd of sub.discounts) {
          const evaluation = evaluateDiscount(sd.discount, linesForDiscount, now)
          if (!evaluation) continue

          const claimed = await tx.discount.updateMany({
            where: {
              id: evaluation.discountId,
              usedCount: { lt: tx.discount.fields.usageLimit },
              isActive: true,
            },
            data: { usedCount: { increment: 1 } },
          })
          if (claimed.count === 0) continue // exhausted in this instant: stop applying

          discountTotal = discountTotal.plus(evaluation.amount)
          discountLinesData.push({
            discountId: evaluation.discountId,
            label: evaluation.label,
            amount: evaluation.amount,
          })
        }

        // Cap discounts at subtotal, round at the edge only.
        discountTotal = Prisma.Decimal.min(discountTotal, subtotal).toDecimalPlaces(2)
        const total = subtotal.plus(taxTotal).minus(discountTotal).toDecimalPlaces(2)

        // Due date = issue date + payment term days.
        const issueDate = new Date()
        const dueDate = new Date(issueDate.getTime() + sub.paymentTermDays * 24 * 60 * 60 * 1000)

        // ---- Create the DRAFT invoice ----
        await tx.invoice.create({
          data: {
            subscriptionId: sub.id,
            customerId: sub.customerId,
            status: InvoiceStatus.DRAFT,
            periodStart,
            periodEnd,
            issueDate,
            dueDate,
            subtotal: subtotal.toDecimalPlaces(2),
            taxTotal: taxTotal.toDecimalPlaces(2),
            discountTotal,
            total,
            amountPaid: new Prisma.Decimal(0),
            lines: { create: invoiceLinesData },
            discountLines: { create: discountLinesData },
          },
        })

        // ---- Advance the subscription billing cursor ----
        const shouldAutoClose = sub.plan.autoCloseOnEnd && periodEnd >= sub.expiryDate
        await tx.subscription.update({
          where: { id: sub.id },
          data: {
            nextBillingDate: periodEnd,
            lastBilledThrough: periodEnd,
            ...(shouldAutoClose ? { status: SubStatus.CLOSED } : {}),
          },
        })

        result.created++
        return 'created' as const
      })

      if (outcome === 'skipped' || outcome === 'created') {
        currentNext = periodEnd
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string }
      if (error.code === 'P2002') {
        // Unique constraint fired: this period was already billed. Treat as
        // skipped and advance, never bills twice.
        result.skipped++
        currentNext = periodEnd
      } else {
        result.failed++
        result.errors.push(
          `Sub ${sub.id} (period ${periodStart.toISOString()}): ${error.message || 'Billing error'}`
        )
        break
      }
    }
  }

  // Catch-up cap reached while still behind: report it so the run is visible.
  if (currentNext <= now && cycles >= MAX_CATCHUP_CYCLES) {
    result.errors.push(
      `Sub ${sub.id}: catch-up cap of ${MAX_CATCHUP_CYCLES} periods reached; remaining periods bill on the next run`
    )
  }
}
