import { NextRequest } from 'next/server'
import { apiHandler } from '@/lib/api'
import { db } from '@/lib/db'
import { formatCurrency } from '@/lib/format'
import { createProductSchema } from '@/lib/validators'

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

export const POST = apiHandler(null, async (req: NextRequest) => {
  const data = createProductSchema.parse(await req.json())

  const product = await db.product.create({
    data: {
      name: data.name,
      type: data.type,
      salesPrice: data.salesPrice,
      costPrice: data.costPrice,
      notes: data.notes,
      variants: {
        create: data.variants.map((v) => ({
          attribute: v.attribute,
          value: v.value,
          extraPrice: v.extraPrice,
        })),
      },
    },
    include: { variants: true },
  })

  return { success: true, product }
})

