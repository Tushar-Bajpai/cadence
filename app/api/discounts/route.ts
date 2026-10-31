import { NextRequest } from 'next/server'
import { apiHandler } from '@/lib/api'
import { db } from '@/lib/db'
import { DiscountType, DiscountScope, TaxType } from '@prisma/client'

export const dynamic = 'force-dynamic'

export const GET = apiHandler(null, async (req: NextRequest) => {
  const [discounts, taxes] = await Promise.all([
    db.discount.findMany({
      orderBy: { startDate: 'desc' },
      include: {
        products: { include: { product: true } },
      },
    }),
    db.tax.findMany({
      orderBy: { name: 'asc' },
    }),
  ])

  return {
    discounts: discounts.map((d) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      value: Number(d.value),
      scope: d.scope,
      usageLimit: d.usageLimit,
      usedCount: d.usedCount,
      startDate: d.startDate.toISOString(),
      endDate: d.endDate.toISOString(),
      isActive: d.isActive,
      isExpired: new Date() > d.endDate || d.usedCount >= d.usageLimit,
    })),
    taxes: taxes.map((t) => ({
      id: t.id,
      name: t.name,
      type: t.type,
      value: Number(t.value),
      isActive: t.isActive,
    })),
  }
})

export const POST = apiHandler(null, async (req: NextRequest) => {
  const body = await req.json()
  const { name, type = DiscountType.PERCENTAGE, value, scope = DiscountScope.SUBSCRIPTION, usageLimit = 100, days = 30 } = body

  const start = new Date()
  const end = new Date()
  end.setDate(end.getDate() + (Number(days) || 30))

  const discount = await db.discount.create({
    data: {
      name,
      type,
      value: Number(value),
      scope,
      startDate: start,
      endDate: end,
      usageLimit: Number(usageLimit) || 100,
      usedCount: 0,
      isActive: true,
    },
  })

  return { success: true, discount }
})
