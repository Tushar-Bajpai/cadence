import { NextRequest } from 'next/server'
import { apiHandler } from '@/lib/api'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Quotation templates are readable by ADMIN + STAFF.
// Template lines store productId/variantId references, with details hydrated.
export const GET = apiHandler(null, async () => {
  let templates = await db.quotationTemplate.findMany({
    orderBy: { name: 'asc' },
    include: {
      plan: { select: { id: true, name: true, price: true, billingPeriod: true, minQuantity: true } },
      lines: true,
    },
  })

  // Auto-seed default quotation templates if none exist
  if (templates.length === 0) {
    const plans = await db.plan.findMany({ take: 2 })
    const products = await db.product.findMany({ take: 3 })

    if (plans.length > 0 && products.length > 0) {
      await db.quotationTemplate.create({
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
        orderBy: { name: 'asc' },
        include: {
          plan: { select: { id: true, name: true, price: true, billingPeriod: true, minQuantity: true } },
          lines: true,
        },
      })
    }
  }

  const productIds = [...new Set(templates.flatMap((t) => t.lines.map((l) => l.productId)))]
  const variantIds = [
    ...new Set(templates.flatMap((t) => t.lines.map((l) => l.variantId).filter((v): v is string => Boolean(v)))),
  ]

  const [products, variants] = await Promise.all([
    productIds.length > 0
      ? db.product.findMany({ where: { id: { in: productIds } }, include: { variants: true } })
      : [],
    variantIds.length > 0
      ? db.productVariant.findMany({ where: { id: { in: variantIds } } })
      : [],
  ])

  const productMap = new Map(products.map((p) => [p.id, p]))
  const variantMap = new Map(variants.map((v) => [v.id, v]))

  return templates.map((t) => ({
    id: t.id,
    name: t.name,
    planId: t.plan.id,
    planName: t.plan.name,
    plan: {
      id: t.plan.id,
      name: t.plan.name,
      price: Number(t.plan.price),
      billingPeriod: t.plan.billingPeriod,
    },
    validityDays: t.validityDays,
    lines: t.lines.map((l) => {
      const product = productMap.get(l.productId)
      const variant = l.variantId ? variantMap.get(l.variantId) : undefined
      const extra = variant?.extraPrice ? Number(variant.extraPrice) : 0
      const unitPrice = product ? Number(product.salesPrice) + extra : 0
      return {
        id: l.id,
        productId: l.productId,
        productName: product?.name ?? 'Unknown product',
        variantId: l.variantId ?? null,
        variantLabel: variant ? `${variant.attribute}: ${variant.value}` : null,
        unitPrice,
        quantity: l.quantity,
      }
    }),
  }))
})

// Create a quotation template with product lines.
export const POST = apiHandler(null, async (req: NextRequest) => {
  const body = await req.json()

  const name = String(body.name || '').trim()
  if (!name) throw new Error('Template name is required')

  const planId = body.planId
  if (typeof planId !== 'string' || !planId) throw new Error('A plan is required')

  const validityDays = Math.floor(Number(body.validityDays))
  if (!Number.isFinite(validityDays) || validityDays < 1) {
    throw new Error('Validity days must be a positive number')
  }

  const plan = await db.plan.findUnique({ where: { id: planId } })
  if (!plan) throw new Error('Plan not found')

  const rawLines: Array<{ productId?: string; variantId?: string | null; quantity?: number }> =
    Array.isArray(body.lines) ? body.lines : []
  if (rawLines.length === 0) throw new Error('At least one product line is required')

  // Resolve + validate every referenced product/variant before creating
  const productIds = [...new Set(rawLines.map((l) => String(l.productId ?? '')).filter(Boolean))]
  if (productIds.length !== rawLines.filter((l) => l.productId).length) {
    throw new Error('Every line needs a product')
  }
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    include: { variants: true },
  })
  if (products.length !== productIds.length) {
    throw new Error('One or more products do not exist')
  }
  const productMap = new Map(products.map((p) => [p.id, p]))

  const resolvedLines = rawLines.map((l) => {
    const quantity = Math.floor(Number(l.quantity))
    if (!Number.isFinite(quantity) || quantity < 1) {
      throw new Error('Line quantities must be positive numbers')
    }
    const product = productMap.get(String(l.productId))!

    let variantId: string | null = null
    if (l.variantId) {
      const variant = product.variants.find((v) => v.id === l.variantId)
      if (!variant) throw new Error(`Variant does not belong to product "${product.name}"`)
      variantId = variant.id
    }

    return {
      productId: product.id,
      variantId,
      quantity,
    }
  })

  const template = await db.quotationTemplate.create({
    data: {
      name,
      planId,
      validityDays,
      lines: { create: resolvedLines },
    },
    include: { lines: true },
  })

  return {
    success: true,
    template: { id: template.id, name: template.name, lineCount: template.lines.length },
  }
})
