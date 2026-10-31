import { NextRequest } from 'next/server'
import { apiHandler, ApiContext, NotFoundError, UnauthorizedError } from '@/lib/api'
import { db } from '@/lib/db'
import { getPortalCustomer } from '@/lib/portal-customer'
import { formatCurrency, formatDate, formatSubNumber, formatInvoiceNumber } from '@/lib/format'

export const dynamic = 'force-dynamic'

export const GET = apiHandler(null, async (req: NextRequest, session, context?: ApiContext) => {
  const customer = await getPortalCustomer(session)
  if (!customer) throw new UnauthorizedError('Customer not authenticated')

  const params = await context?.params
  const idOrSeq = params?.id as string
  if (!idOrSeq) throw new NotFoundError('Subscription ID is required')

  const isNumeric = /^\d+$/.test(idOrSeq)

  // Strictly scoped to customer
  const sub = await db.subscription.findFirst({
    where: {
      ...(isNumeric ? { seq: parseInt(idOrSeq, 10) } : { id: idOrSeq }),
      customerId: customer.id,
    },
    include: {
      plan: true,
      lines: true,
      invoices: {
        orderBy: { issueDate: 'desc' },
      },
      discounts: {
        include: {
          discount: true,
        },
      },
    },
  })

  // Customer A guessing Customer B's subscription returns 404!
  if (!sub) {
    throw new NotFoundError('Subscription not found')
  }

  return {
    id: sub.id,
    seq: sub.seq,
    number: formatSubNumber(sub.seq),
    status: sub.status,
    isPaused: sub.isPaused,
    startDate: formatDate(sub.startDate),
    expiryDate: formatDate(sub.expiryDate),
    nextBillingDate: formatDate(sub.nextBillingDate),
    paymentTermDays: sub.paymentTermDays,
    plan: {
      id: sub.plan.id,
      name: sub.plan.name,
      price: Number(sub.plan.price),
      formattedPrice: formatCurrency(sub.plan.price),
      billingPeriod: sub.plan.billingPeriod,
      pausable: sub.plan.pausable,
      closable: sub.plan.closable,
      renewable: sub.plan.renewable,
      autoCloseOnEnd: sub.plan.autoCloseOnEnd,
    },
    lines: sub.lines.map((l) => ({
      id: l.id,
      productId: l.productId,
      variantId: l.variantId,
      description: l.description,
      quantity: l.quantity,
      unitPrice: Number(l.unitPrice),
      formattedUnitPrice: formatCurrency(l.unitPrice),
      taxRate: Number(l.taxRate),
      taxType: l.taxType,
      amount: Number(l.amount),
      formattedAmount: formatCurrency(l.amount),
    })),
    discounts: sub.discounts.map((d) => ({
      id: d.discount.id,
      name: d.discount.name,
      type: d.discount.type,
      value: Number(d.discount.value),
    })),
    invoices: sub.invoices.map((inv) => ({
      id: inv.id,
      seq: inv.seq,
      number: formatInvoiceNumber(inv.seq),
      status: inv.status,
      issueDate: formatDate(inv.issueDate),
      dueDate: formatDate(inv.dueDate),
      total: Number(inv.total),
      formattedTotal: formatCurrency(inv.total),
      amountPaid: Number(inv.amountPaid),
      formattedAmountPaid: formatCurrency(inv.amountPaid),
      balanceDue: Math.max(0, Number(inv.total) - Number(inv.amountPaid)),
      formattedBalanceDue: formatCurrency(Math.max(0, Number(inv.total) - Number(inv.amountPaid))),
    })),
  }
})

