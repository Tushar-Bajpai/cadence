import { NextRequest } from 'next/server'
import { apiHandler, ApiContext } from '@/lib/api'
import { db } from '@/lib/db'
import { DiscountType, DiscountScope, Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

// ADMIN only: edit a discount rule (fields + product targeting)
export const PATCH = apiHandler(['ADMIN'], async (req: NextRequest, _session, context?: ApiContext) => {
  const params = await context?.params
  const id = params?.id as string
  if (!id) throw new Error('Discount ID is required')

  const body = await req.json()
  const data: Record<string, unknown> = {}

  if (body.name !== undefined) {
    const name = String(body.name).trim()
    if (!name) throw new Error('Discount name cannot be empty')
    data.name = name
  }
  if (body.value !== undefined) {
    const value = Number(body.value)
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error('A positive discount value is required')
    }
    const type = body.type ?? (await db.discount.findUnique({ where: { id }, select: { type: true } }))?.type
    if (type === DiscountType.PERCENTAGE && value > 100) {
      throw new Error('A percentage discount cannot exceed 100%')
    }
    data.value = value
  }
  if (body.minPurchase !== undefined) {
    data.minPurchase =
      body.minPurchase === null || body.minPurchase === ''
        ? null
        : new Prisma.Decimal(Number(body.minPurchase))
  }
  if (body.minQuantity !== undefined) {
    const minQuantity = body.minQuantity === null ? null : Math.floor(Number(body.minQuantity))
    if (minQuantity !== null && minQuantity < 1) throw new Error('Minimum quantity must be at least 1')
    data.minQuantity = minQuantity
  }
  if (body.usageLimit !== undefined) {
    const usageLimit = Math.floor(Number(body.usageLimit))
    if (!Number.isFinite(usageLimit) || usageLimit < 1) {
      throw new Error('Usage limit must be at least 1')
    }
    data.usageLimit = usageLimit
  }
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive)
  if (body.startDate !== undefined) {
    const startDate = new Date(body.startDate)
    if (Number.isNaN(startDate.getTime())) throw new Error('Invalid start date')
    data.startDate = startDate
  }
  if (body.endDate !== undefined) {
    const endDate = new Date(body.endDate)
    if (Number.isNaN(endDate.getTime())) throw new Error('Invalid end date')
    data.endDate = endDate
  }

  // End date must not precede start date (either can be replaced here, so check combined values)
  const current = await db.discount.findUnique({
    where: { id },
    select: { startDate: true, endDate: true, type: true },
  })
  if (!current) throw new Error('Discount not found')
  const effStart = (data.startDate as Date | undefined) ?? current.startDate
  const effEnd = (data.endDate as Date | undefined) ?? current.endDate
  if (effEnd < effStart) throw new Error('End date must be on or after the start date')

  // Product targeting (replace the whole set when provided)
  const productUpdate: Prisma.DiscountUpdateInput = {}
  if (Array.isArray(body.productIds)) {
    productUpdate.products = {
      deleteMany: {},
      create: (body.productIds as string[]).map((productId) => ({ productId })),
    }
    data.products = productUpdate.products
  }

  const updated = await db.discount.update({
    where: { id },
    data: data as Prisma.DiscountUpdateInput,
    include: { products: { include: { product: true } } },
  })

  return {
    success: true,
    discount: {
      id: updated.id,
      name: updated.name,
      type: updated.type,
      value: Number(updated.value),
      scope: updated.scope,
      isActive: updated.isActive,
      productNames: updated.products.map((p) => p.product.name),
      endDate: updated.endDate.toISOString(),
    },
  }
})

// ADMIN only: delete a discount (SubscriptionDiscount links cascade)
export const DELETE = apiHandler(['ADMIN'], async (_req: NextRequest, _session, context?: ApiContext) => {
  const params = await context?.params
  const id = params?.id as string
  if (!id) throw new Error('Discount ID is required')

  await db.discount.delete({ where: { id } })
  return { success: true, deleted: true }
})
