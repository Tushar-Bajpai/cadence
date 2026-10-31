import { NextRequest } from 'next/server'
import { apiHandler, ApiError } from '@/lib/api'
import { db } from '@/lib/db'
import { formatCurrency } from '@/lib/format'

export const dynamic = 'force-dynamic'

export const GET = apiHandler(null, async (req: NextRequest) => {
  const products = await db.product.findMany({
    orderBy: { name: 'asc' },
    include: {
      variants: true,
      taxes: { include: { tax: true } },
    },
  })

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    salesPrice: Number(p.salesPrice),
    formattedSalesPrice: formatCurrency(p.salesPrice),
    costPrice: Number(p.costPrice),
    notes: p.notes,
    isActive: p.isActive,
    variants: p.variants.map((v) => ({
      id: v.id,
      attribute: v.attribute,
      value: v.value,
      extraPrice: Number(v.extraPrice),
      formattedExtraPrice: formatCurrency(v.extraPrice),
    })),
    taxes: p.taxes.map((t) => ({
      id: t.tax.id,
      name: t.tax.name,
      type: t.tax.type,
      value: Number(t.tax.value),
    })),
  }))
})

export const POST = apiHandler(['ADMIN'], async (req: NextRequest) => {
  const body = await req.json()
  const { name, type = 'service', salesPrice, costPrice = 0, notes, variants = [] } = body

  if (!name || salesPrice === undefined) {
    throw new ApiError(400, 'Name and salesPrice are required')
  }
  const salesPriceNum = Number(salesPrice)
  const costPriceNum = Number(costPrice)
  if (!Number.isFinite(salesPriceNum) || salesPriceNum < 0) {
    throw new ApiError(400, 'salesPrice must be a non-negative number')
  }
  if (!Number.isFinite(costPriceNum) || costPriceNum < 0) {
    throw new ApiError(400, 'costPrice must be a non-negative number')
  }

  const product = await db.product.create({
    data: {
      name,
      type,
      salesPrice: salesPriceNum,
      costPrice: costPriceNum,
      notes,
      variants: {
        create: variants.map((v: any) => ({
          attribute: v.attribute || 'Addon',
          value: v.value,
          extraPrice: Number(v.extraPrice) || 0,
        })),
      },
    },
    include: { variants: true },
  })

  return { success: true, product }
})

