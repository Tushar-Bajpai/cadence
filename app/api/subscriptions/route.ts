import { NextRequest } from 'next/server'
import { apiHandler } from '@/lib/api'
import { db } from '@/lib/db'
import { SubStatus, Prisma } from '@prisma/client'
import { formatSubNumber, formatCurrency } from '@/lib/format'
import { addPeriod } from '@/lib/billing-period'
import { createSubscriptionSchema } from '@/lib/validators'

export const dynamic = 'force-dynamic'

export const GET = apiHandler(null, async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') as SubStatus | null
  const search = searchParams.get('search') || ''

  const where: Prisma.SubscriptionWhereInput = {}
  if (status && Object.values(SubStatus).includes(status)) {
    where.status = status
  }
  if (search) {
    where.OR = [
      { customer: { user: { name: { contains: search, mode: 'insensitive' } } } },
      { customer: { user: { email: { contains: search, mode: 'insensitive' } } } },
      { customer: { companyName: { contains: search, mode: 'insensitive' } } },
      { plan: { name: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const subscriptions = await db.subscription.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      customer: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
      plan: true,
      lines: true,
      invoices: {
        select: { id: true, seq: true, status: true, total: true },
      },
    },
  })

  return subscriptions.map((sub) => {
    const totalAmount = sub.lines.reduce((acc, line) => acc + Number(line.amount), 0)
    return {
      id: sub.id,
      seq: sub.seq,
      number: formatSubNumber(sub.seq),
      customerId: sub.customerId,
      customerName: sub.customer.user.name,
      customerEmail: sub.customer.user.email,
      companyName: sub.customer.companyName,
      planId: sub.planId,
      planName: sub.plan.name,
      billingPeriod: sub.plan.billingPeriod,
      status: sub.status,
      isPaused: sub.isPaused,
      startDate: sub.startDate.toISOString(),
      expiryDate: sub.expiryDate.toISOString(),
      nextBillingDate: sub.nextBillingDate ? sub.nextBillingDate.toISOString() : null,
      totalAmount,
      formattedTotal: formatCurrency(totalAmount),
      invoicesCount: sub.invoices.length,
      lines: sub.lines,
    }
  })
})

export const POST = apiHandler(null, async (req: NextRequest) => {
  const data = createSubscriptionSchema.parse(await req.json())

  const plan = await db.plan.findUnique({ where: { id: data.planId } })
  if (!plan) throw new Error('Plan not found')

  const start = data.startDate ? new Date(data.startDate) : new Date()
  const expiry = new Date(start)
  expiry.setMonth(expiry.getMonth() + data.expiryMonths)

  const nextBilling = data.status === SubStatus.ACTIVE ? start : null

  const newSub = await db.subscription.create({
    data: {
      customerId: data.customerId,
      planId: data.planId,
      status: data.status as SubStatus,
      startDate: start,
      expiryDate: expiry,
      nextBillingDate: nextBilling,
      lines: {
        create: data.lines.map((l) => {
          const qty = l.quantity
          const unit = l.unitPrice !== undefined ? l.unitPrice : Number(plan.price)
          return {
            productId: l.productId,
            variantId: l.variantId || null,
            description: l.description || plan.name,
            quantity: qty,
            unitPrice: unit,
            taxRate: l.taxRate,
            amount: qty * unit,
          }
        }),
      },
    },
    include: {
      customer: { include: { user: true } },
      plan: true,
      lines: true,
    },
  })

  return {
    success: true,
    subscription: {
      id: newSub.id,
      number: formatSubNumber(newSub.seq),
      status: newSub.status,
    },
  }
})

