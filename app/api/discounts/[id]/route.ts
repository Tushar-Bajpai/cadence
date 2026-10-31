import { NextRequest } from 'next/server'
import { apiHandler, ApiContext } from '@/lib/api'
import { db } from '@/lib/db'
import { DiscountType, DiscountScope, Prisma } from '@prisma/client'
import { updateDiscountTargetedSchema } from '@/lib/validators'

export const dynamic = 'force-dynamic'

// ADMIN only: edit a discount rule (fields + product targeting)
export const PATCH = apiHandler(['ADMIN'], async (req: NextRequest, _session, context?: ApiContext) => {
  const params = await context?.params
  const id = params?.id as string
  if (!id) throw new Error('Discount ID is required')

  const parsed = updateDiscountTargetedSchema.parse(await req.json())
  const data: Record<string, unknown> = {}

  if (parsed.name !== undefined) data.name = parsed.name
  if (parsed.value !== undefined) {
    const type = parsed.type ?? (await db.discount.findUnique({ where: { id }, select: { type: true } }))?.type
    if (type === DiscountType.PERCENTAGE && parsed.value > 100) {
      throw new Error('A percentage discount cannot exceed 100%')
    }
    data.value = parsed.value
  }
  if (parsed.minPurchase !== undefined) {
    data.minPurchase =
      parsed.minPurchase === null
        ? null
        : new Prisma.Decimal(parsed.minPurchase)
  }
  if (parsed.minQuantity !== undefined) data.minQuantity = parsed.minQuantity
  if (parsed.usageLimit !== undefined) data.usageLimit = parsed.usageLimit
  if (parsed.isActive !== undefined) data.isActive = parsed.isActive
  if (parsed.startDate !== undefined) {
    const startDate = new Date(parsed.startDate)
    if (Number.isNaN(startDate.getTime())) throw new Error('Invalid start date')
    data.startDate = startDate
  }
  if (parsed.endDate !== undefined) {
    const endDate = new Date(parsed.endDate)
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
  if (Array.isArray(parsed.productIds)) {
    productUpdate.products = {
      deleteMany: {},
      create: parsed.productIds.map((productId) => ({ productId })),
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
