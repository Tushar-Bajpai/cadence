import { NextRequest } from 'next/server'
import { apiHandler } from '@/lib/api'
import { db } from '@/lib/db'
import { TaxType } from '@prisma/client'

export const dynamic = 'force-dynamic'

export const GET = apiHandler(null, async () => {
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
  const body = await req.json()
  const name = String(body.name || '').trim()
  const type = body.type === 'FIXED' ? TaxType.FIXED : TaxType.PERCENTAGE
  const value = Number(body.value)

  if (!name) throw new Error('Tax name is required')
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('A non-negative tax value is required')
  }
  if (type === TaxType.PERCENTAGE && value > 100) {
    throw new Error('A percentage tax cannot exceed 100%')
  }

  const tax = await db.tax.create({
    data: { name, type, value, isActive: true },
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
