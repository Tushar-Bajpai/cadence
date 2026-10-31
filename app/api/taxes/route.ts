import { NextRequest } from 'next/server'
import { apiHandler } from '@/lib/api'
import { db } from '@/lib/db'
import { TaxType } from '@prisma/client'
import { createTaxSchema } from '@/lib/validators'

export const dynamic = 'force-dynamic'

export const GET = apiHandler(['ADMIN', 'STAFF'], async () => {
  const taxes = await db.tax.findMany({
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    include: {
      _count: { select: { products: true } },
    },
  })

  return taxes.map((t) => ({
    id: t.id,
    name: t.name,
    type: t.type,
    value: Number(t.value),
    isActive: t.isActive,
    productCount: t._count.products,
  }))
})

// Admin only: create a tax (percentage or fixed)
export const POST = apiHandler(['ADMIN'], async (req: NextRequest) => {
  const data = createTaxSchema.parse(await req.json())

  const tax = await db.tax.create({
    data: {
      name: data.name,
      type: data.type as TaxType,
      value: data.value,
      isActive: data.isActive,
    },
  })

  return {
    success: true,
    tax: {
      id: tax.id,
      name: tax.name,
      type: tax.type,
      value: Number(tax.value),
      isActive: tax.isActive,
    },
  }
})
