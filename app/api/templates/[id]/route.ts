import { NextRequest, NextResponse } from 'next/server'
import { apiHandler, ApiContext } from '@/lib/api'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export const GET = apiHandler(['ADMIN', 'STAFF'], async (_req: NextRequest, _session, context?: ApiContext) => {
  const params = await context?.params
  const id = params?.id as string
  if (!id) throw new Error('Template ID is required')

  const template = await db.quotationTemplate.findUnique({
    where: { id },
    include: {
      plan: true,
      lines: true,
    },
  })

  if (!template) {
    return NextResponse.json({ error: 'Quotation template not found' }, { status: 404 })
  }

  const productIds = template.lines.map((l) => l.productId)
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    include: { variants: true },
  })
  const productMap = new Map(products.map((p) => [p.id, p]))

  return {
    id: template.id,
    name: template.name,
    planId: template.planId,
    planName: template.plan.name,
    plan: {
      id: template.plan.id,
      name: template.plan.name,
      price: Number(template.plan.price),
      billingPeriod: template.plan.billingPeriod,
      minQuantity: template.plan.minQuantity,
    },
    validityDays: template.validityDays,
    lines: template.lines.map((l) => {
      const prod = productMap.get(l.productId)
      return {
        id: l.id,
        productId: l.productId,
        productName: prod?.name || 'Product',
        salesPrice: Number(prod?.salesPrice || 0),
        variantId: l.variantId,
        quantity: l.quantity,
      }
    }),
  }
})


// Delete template lines then the template itself

export const DELETE = apiHandler(['ADMIN', 'STAFF'], async (_req: NextRequest, _session, context?: ApiContext) => {
  const params = await context?.params
  const id = params?.id as string
  if (!id) throw new Error('Template ID is required')

  const template = await db.quotationTemplate.findUnique({ where: { id } })
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  await db.$transaction([
    db.quotationTemplateLine.deleteMany({ where: { templateId: id } }),
    db.quotationTemplate.delete({ where: { id } }),
  ])

  return { success: true, deleted: true }
})
