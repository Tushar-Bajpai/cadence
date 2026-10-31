import { NextRequest } from 'next/server'
import { apiHandler } from '@/lib/api'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export const GET = apiHandler(null, async (req: NextRequest) => {
  let templates = await db.quotationTemplate.findMany({
    include: {
      plan: true,
      lines: {
        include: {
          template: false,
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  // Auto-seed default quotation templates if none exist
  if (templates.length === 0) {
    const plans = await db.plan.findMany({ take: 2 })
    const products = await db.product.findMany({ take: 3 })

    if (plans.length > 0 && products.length > 0) {
      const template1 = await db.quotationTemplate.create({
        data: {
          name: 'Standard Pro Quotation Template',
          planId: plans[0].id,
          validityDays: 14,
          lines: {
            create: [
              {
                productId: products[0].id,
                quantity: plans[0].minQuantity || 1,
              },
            ],
          },
        },
        include: { plan: true, lines: true },
      })

      if (plans.length > 1 && products.length > 1) {
        await db.quotationTemplate.create({
          data: {
            name: 'Enterprise Full Suite Template',
            planId: plans[1].id,
            validityDays: 30,
            lines: {
              create: products.map((p) => ({
                productId: p.id,
                quantity: plans[1].minQuantity || 1,
              })),
            },
          },
        })
      }

      templates = await db.quotationTemplate.findMany({
        include: { plan: true, lines: true },
        orderBy: { name: 'asc' },
      })
    }
  }

  // Fetch product details for the lines
  const allProductIds = Array.from(
    new Set(templates.flatMap((t) => t.lines.map((l) => l.productId)))
  )
  const products = await db.product.findMany({
    where: { id: { in: allProductIds } },
    select: { id: true, name: true, salesPrice: true },
  })
  const productMap = new Map(products.map((p) => [p.id, p]))

  return templates.map((t) => ({
    id: t.id,
    name: t.name,
    planId: t.planId,
    planName: t.plan.name,
    validityDays: t.validityDays,
    lines: t.lines.map((l) => ({
      id: l.id,
      productId: l.productId,
      productName: productMap.get(l.productId)?.name || 'Product',
      salesPrice: Number(productMap.get(l.productId)?.salesPrice || 0),
      quantity: l.quantity,
    })),
  }))
})

export const POST = apiHandler(null, async (req: NextRequest) => {
  const body = await req.json()
  const { name, planId, validityDays = 30, lines = [] } = body

  if (!name || !planId) {
    throw new Error('Template name and planId are required')
  }

  const created = await db.quotationTemplate.create({
    data: {
      name,
      planId,
      validityDays: Number(validityDays) || 30,
      lines: {
        create: lines.map((l: any) => ({
          productId: l.productId,
          variantId: l.variantId || null,
          quantity: Number(l.quantity) || 1,
        })),
      },
    },
    include: {
      plan: true,
      lines: true,
    },
  })

  return { success: true, template: created }
})

