import { NextRequest } from 'next/server'
import { apiHandler } from '@/lib/api'
import { db } from '@/lib/db'
import { DiscountType, DiscountScope, Prisma } from '@prisma/client'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export const GET = apiHandler(['ADMIN', 'STAFF'], async () => {
  const discounts = await db.discount.findMany({
    orderBy: { startDate: 'desc' },
    include: {
      products: { include: { product: true } },
    },
  })

  return {
    discounts: discounts.map((d) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      value: Number(d.value),
      scope: d.scope,
      minPurchase: d.minPurchase ? Number(d.minPurchase) : null,
      minQuantity: d.minQuantity ?? null,
      usageLimit: d.usageLimit,
      usedCount: d.usedCount,
      startDate: d.startDate.toISOString(),
      endDate: d.endDate.toISOString(),
      isActive: d.isActive,
      isExpired: new Date() > d.endDate || d.usedCount >= d.usageLimit,
      productIds: d.products.map((p) => p.productId),
      productNames: d.products.map((p) => p.product.name),
    })),
  }
})

const createDiscountInputSchema = z
  .object({
    name: z.string().min(1, 'Discount name is required').trim(),
    type: z.enum(['PERCENTAGE', 'FIXED']).default('PERCENTAGE'),
    value: z.coerce.number().positive('A positive discount value is required'),
    scope: z.enum(['PRODUCT', 'SUBSCRIPTION']).default('SUBSCRIPTION'),
    usageLimit: z.coerce.number().int().min(1).default(100),
    days: z.coerce.number().int().min(1).default(30),
    startDate: z.string().or(z.date()).optional(),
    endDate: z.string().or(z.date()).optional(),
    minPurchase: z.coerce.number().min(0).optional().nullable(),
    minQuantity: z.coerce.number().int().min(1).optional().nullable(),
    productIds: z.array(z.string()).optional().default([]),
  })
  .refine(
    (data) => {
      if (data.type === 'PERCENTAGE' && data.value > 100) return false
      return true
    },
    {
      message: 'A percentage discount cannot exceed 100%',
      path: ['value'],
    }
  )
  .refine(
    (data) => {
      if (data.scope === 'PRODUCT' && (!data.productIds || data.productIds.length === 0)) return false
      return true
    },
    {
      message: 'Product-scoped discounts need at least one product',
      path: ['productIds'],
    }
  )

// ADMIN only: create a discount rule with full targeting:
export const POST = apiHandler(['ADMIN'], async (req: NextRequest) => {
  const data = createDiscountInputSchema.parse(await req.json())

  // Validity window: explicit dates, falling back to the "days" duration
  const startDate = data.startDate ? new Date(data.startDate) : new Date()
  const endDate = data.endDate
    ? new Date(data.endDate)
    : (() => {
        const d = new Date(startDate)
        d.setDate(d.getDate() + (data.days || 30))
        return d
      })()

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error('Invalid validity dates')
  }
  if (endDate < startDate) {
    throw new Error('End date must be on or after the start date')
  }

  const minPurchase =
    data.minPurchase !== undefined && data.minPurchase !== null
      ? new Prisma.Decimal(data.minPurchase)
      : null

  const productIds = data.scope === 'PRODUCT' ? data.productIds : []

  const discount = await db.discount.create({
    data: {
      name: data.name,
      type: data.type as DiscountType,
      value: data.value,
      scope: data.scope as DiscountScope,
      minPurchase,
      minQuantity: data.minQuantity ?? null,
      startDate,
      endDate,
      usageLimit: data.usageLimit,
      usedCount: 0,
      isActive: true,
      ...(productIds.length > 0 && {
        products: { create: productIds.map((productId) => ({ productId })) },
      }),
    },
    include: { products: { include: { product: true } } },
  })

  return {
    success: true,
    discount: {
      id: discount.id,
      name: discount.name,
      type: discount.type,
      value: Number(discount.value),
      scope: discount.scope,
      productNames: discount.products.map((p) => p.product.name),
      endDate: discount.endDate.toISOString(),
    },
  }
})
