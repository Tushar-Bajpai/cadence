import { NextRequest } from 'next/server'
import { apiHandler } from '@/lib/api'
import { db } from '@/lib/db'
import { formatCurrency } from '@/lib/format'
import { BillingPeriod } from '@prisma/client'
import { createPlanSchema } from '@/lib/validators'

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

export const POST = apiHandler(['ADMIN', 'STAFF'], async (req: NextRequest) => {
  const data = createPlanSchema.parse(await req.json())

  const plan = await db.plan.create({
    data: {
      name: data.name,
      price: data.price,
      billingPeriod: data.billingPeriod as BillingPeriod,
      minQuantity: data.minQuantity,
      availableFrom: new Date(),
      pausable: data.pausable,
      closable: data.closable,
      renewable: data.renewable,
      autoCloseOnEnd: data.autoCloseOnEnd,
      isActive: true,
    },
  })

  return { success: true, plan }
})
