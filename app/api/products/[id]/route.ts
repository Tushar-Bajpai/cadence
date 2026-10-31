import { NextRequest } from 'next/server'
import { apiHandler, ApiContext } from '@/lib/api'
import { db } from '@/lib/db'
import { formatCurrency } from '@/lib/format'

export const dynamic = 'force-dynamic'

export const GET = apiHandler(null, async (req: NextRequest, session, context?: ApiContext) => {
  const params = await context?.params
  const id = params?.id as string

  if (!id) throw new Error('Product ID is required')

  const product = await db.product.findUnique({
    where: { id },
    include: {
      variants: true,
      taxes: { include: { tax: true } },
      discounts: { include: { discount: true } },
    },
  })

  if (!product) throw new Error('Product not found')

  return {
    id: product.id,
    name: product.name,
    type: product.type,
    salesPrice: Number(product.salesPrice),
    formattedSalesPrice: formatCurrency(product.salesPrice),
    costPrice: Number(product.costPrice),
    notes: product.notes,
    isActive: product.isActive,
    variants: product.variants.map((v) => ({
      id: v.id,
      attribute: v.attribute,
      value: v.value,
      extraPrice: Number(v.extraPrice),
      formattedExtraPrice: formatCurrency(v.extraPrice),
      effectivePrice: Number(product.salesPrice) + Number(v.extraPrice),
      formattedEffectivePrice: formatCurrency(Number(product.salesPrice) + Number(v.extraPrice)),
    })),
    taxes: product.taxes.map((t) => ({
      id: t.tax.id,
      name: t.tax.name,
      type: t.tax.type,
      value: Number(t.tax.value),
    })),
  }
})

export const PUT = apiHandler(['ADMIN'], async (req: NextRequest, session, context?: ApiContext) => {
  const params = await context?.params
  const id = params?.id as string
  if (!id) throw new Error('Product ID is required')

  const body = await req.json()
  const { name, type, salesPrice, costPrice, notes, isActive, variants, taxIds } = body

  const updated = await db.$transaction(async (tx) => {
    // If variants array is provided, replace or sync
    if (Array.isArray(variants)) {
      await tx.productVariant.deleteMany({ where: { productId: id } })
      if (variants.length > 0) {
        await tx.productVariant.createMany({
          data: variants.map((v: any) => ({
            productId: id,
            attribute: v.attribute || 'Addon',
            value: v.value,
            extraPrice: Number(v.extraPrice) || 0,
          })),
        })
      }
    }

    // If taxIds array is provided, sync taxes
    if (Array.isArray(taxIds)) {
      await tx.productTax.deleteMany({ where: { productId: id } })
      if (taxIds.length > 0) {
        await tx.productTax.createMany({
          data: taxIds.map((tId: string) => ({
            productId: id,
            taxId: tId,
          })),
        })
      }
    }

    return await tx.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(salesPrice !== undefined && { salesPrice: Number(salesPrice) }),
        ...(costPrice !== undefined && { costPrice: Number(costPrice) }),
        ...(notes !== undefined && { notes }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
      include: {
        variants: true,
        taxes: { include: { tax: true } },
      },
    })
  })

  return { success: true, product: updated }
})

export const DELETE = apiHandler(['ADMIN'], async (req: NextRequest, session, context?: ApiContext) => {
  const params = await context?.params
  const id = params?.id as string
  if (!id) throw new Error('Product ID is required')

  // Check if product is in use by subscription lines
  const usedInSubscriptions = await db.subscriptionLine.count({
    where: { productId: id },
  })

  if (usedInSubscriptions > 0) {
    // Soft delete to protect referential integrity
    const deactivated = await db.product.update({
      where: { id },
      data: { isActive: false },
    })
    return { success: true, message: 'Product is attached to existing subscriptions; marked as inactive.', product: deactivated }
  }

  await db.product.delete({ where: { id } })
  return { success: true, message: 'Product deleted permanently.' }
})

