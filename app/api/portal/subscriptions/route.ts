import { NextRequest } from 'next/server'
import { apiHandler } from '@/lib/api'
import { db } from '@/lib/db'
import { getPortalCustomer } from '@/lib/portal-customer'
import { formatCurrency, formatDate, formatSubNumber } from '@/lib/format'
import { addPeriod } from '@/lib/billing-period'
import { getUnitPrice } from '@/lib/pricing'

export const dynamic = 'force-dynamic'

export const GET = apiHandler(null, async (req: NextRequest, session) => {
  const customer = await getPortalCustomer(session)
  if (!customer) throw new Error('Customer not found')

  const subscriptions = await db.subscription.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: 'desc' },
    include: {
      plan: true,
      lines: true,
      invoices: {
        orderBy: { issueDate: 'desc' },
        take: 3,
      },
    },
  })

  return subscriptions.map((sub) => ({
    id: sub.id,
    seq: sub.seq,
    number: formatSubNumber(sub.seq),
    status: sub.status,
    isPaused: sub.isPaused,
    startDate: formatDate(sub.startDate),
    expiryDate: formatDate(sub.expiryDate),
    nextBillingDate: formatDate(sub.nextBillingDate),
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
      description: l.description,
      quantity: l.quantity,
      unitPrice: Number(l.unitPrice),
      formattedUnitPrice: formatCurrency(l.unitPrice),
      amount: Number(l.amount),
      formattedAmount: formatCurrency(l.amount),
    })),
    recentInvoices: sub.invoices.map((inv) => ({
      id: inv.id,
      seq: inv.seq,
      status: inv.status,
      total: Number(inv.total),
      formattedTotal: formatCurrency(inv.total),
    })),
  }))
})

export const POST = apiHandler(null, async (req: NextRequest, session) => {
  const customer = await getPortalCustomer(session)
  if (!customer) throw new Error('Customer not found')

  const body = await req.json()
  const { planId, variantId, productId, quantity = 1 } = body

  if (!planId) throw new Error('Plan ID is required')

  const plan = await db.plan.findUnique({
    where: { id: planId },
  })

  if (!plan) throw new Error('Plan not found')

  const qty = Math.max(Number(quantity) || 1, plan.minQuantity)

  // Calculate pricing
  let unitPrice = plan.price
  let description = `${plan.name} Subscription`

  if (productId) {
    const product = await db.product.findUnique({
      where: { id: productId },
      include: { variants: true },
    })

    if (product) {
      const variant = product.variants.find((v) => v.id === variantId)
      unitPrice = getUnitPrice(product.salesPrice, variant?.extraPrice)
      description = variant
        ? `${product.name} (${variant.attribute}: ${variant.value})`
        : product.name
    }
  }

  const startDate = new Date()
  const expiryDate = addPeriod(startDate, plan.billingPeriod)
  const lineAmount = Number(unitPrice) * qty

  const subscription = await db.subscription.create({
    data: {
      customerId: customer.id,
      planId: plan.id,
      status: 'ACTIVE',
      startDate,
      expiryDate,
      nextBillingDate: expiryDate,
      lines: {
        create: {
          productId: productId || 'base-plan',
          variantId: variantId || null,
          description,
          quantity: qty,
          unitPrice: Number(unitPrice),
          amount: lineAmount,
        },
      },
    },
    include: {
      plan: true,
      lines: true,
    },
  })

  return {
    success: true,
    message: `Subscribed successfully to ${plan.name}!`,
    subscription,
  }
})
