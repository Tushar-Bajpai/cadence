import { NextRequest } from 'next/server'
import { apiHandler } from '@/lib/api'
import { db } from '@/lib/db'
import { DiscountType, DiscountScope, Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export const GET = apiHandler(null, async () => {
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

// ADMIN only: create a discount rule with full targeting:
// type/value, scope (product list or whole subscription),
// min purchase / min quantity, validity window and usage ceiling.
export const POST = apiHandler(['ADMIN'], async (req: NextRequest) => {
  const body = await req.json()

  const name = String(body.name || '').trim()
  if (!name) throw new Error('Discount name is required')

  const type: DiscountType = body.type === 'FIXED' ? DiscountType.FIXED : DiscountType.PERCENTAGE
  const value = Number(body.value)
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('A positive discount value is required')
  }
  if (type === DiscountType.PERCENTAGE && value > 100) {
    throw new Error('A percentage discount cannot exceed 100%')
  }

  const scope: DiscountScope =
    body.scope === 'PRODUCT' ? DiscountScope.PRODUCT : DiscountScope.SUBSCRIPTION

  const usageLimit = Math.max(1, Math.floor(Number(body.usageLimit) || 100))
  const minPurchase =
    body.minPurchase !== undefined && body.minPurchase !== null && body.minPurchase !== ''
      ? new Prisma.Decimal(Number(body.minPurchase))
      : null
  const minQuantity =
    body.minQuantity !== undefined && body.minQuantity !== null ? Math.floor(Number(body.minQuantity)) : null
  if (minQuantity !== null && minQuantity < 1) {
    throw new Error('Minimum quantity must be at least 1')
  }

  // Validity window: explicit dates, falling back to the "days" duration
  const startDate = body.startDate ? new Date(body.startDate) : new Date()
  const endDate = body.endDate
    ? new Date(body.endDate)
    : (() => {
        const d = new Date(startDate)
        d.setDate(d.getDate() + (Math.floor(Number(body.days)) || 30))
        return d
      })()
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error('Invalid validity dates')
  }
  if (endDate < startDate) {
    throw new Error('End date must be on or after the start date')
  }

  const productIds: string[] =
    scope === DiscountScope.PRODUCT
      ? Array.isArray(body.productIds)
        ? body.productIds
        : []
      : []
  if (scope === DiscountScope.PRODUCT && productIds.length === 0) {
    throw new Error('Product-scoped discounts need at least one product')
  }

  const discount = await db.discount.create({
    data: {
      name,
      type,
      value,
      scope,
      minPurchase,
      minQuantity,
      startDate,
      endDate,
      usageLimit,
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
