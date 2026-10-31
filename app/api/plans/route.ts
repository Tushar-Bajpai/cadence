import { NextRequest } from 'next/server'
import { apiHandler } from '@/lib/api'
import { db } from '@/lib/db'
import { formatCurrency } from '@/lib/format'
import { BillingPeriod } from '@prisma/client'

export const dynamic = 'force-dynamic'

export const GET = apiHandler(null, async (req: NextRequest) => {
  const plans = await db.plan.findMany({
    orderBy: { price: 'asc' },
    include: {
      subscriptions: { select: { id: true, status: true } },
    },
  })

  return plans.map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    formattedPrice: formatCurrency(p.price),
    billingPeriod: p.billingPeriod,
    minQuantity: p.minQuantity,
    pausable: p.pausable,
    closable: p.closable,
    renewable: p.renewable,
    autoCloseOnEnd: p.autoCloseOnEnd,
    isActive: p.isActive,
    activeSubscribersCount: p.subscriptions.filter((s) => s.status === 'ACTIVE').length,
  }))
})

export const POST = apiHandler(null, async (req: NextRequest) => {
  const body = await req.json()
  const {
    name,
    price,
    billingPeriod = BillingPeriod.MONTHLY,
    minQuantity = 1,
    pausable = true,
    closable = true,
    renewable = true,
    autoCloseOnEnd = false,
  } = body

  if (!name || price === undefined) {
    throw new Error('Name and price are required')
  }

  const plan = await db.plan.create({
    data: {
      name,
      price: Number(price),
      billingPeriod,
      minQuantity: Number(minQuantity) || 1,
      availableFrom: new Date(),
      pausable,
      closable,
      renewable,
      autoCloseOnEnd,
      isActive: true,
    },
  })

  return { success: true, plan }
})

