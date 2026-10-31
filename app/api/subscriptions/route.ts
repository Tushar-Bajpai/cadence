import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api'
import { db } from '@/lib/db'
import { SubStatus, Prisma, TaxType } from '@prisma/client'
import { formatSubNumber, formatCurrency } from '@/lib/format'
import { addPeriod } from '@/lib/billing-period'
import { calcLineTax, getUnitPrice } from '@/lib/pricing'

export const dynamic = 'force-dynamic'

export const GET = apiHandler(['ADMIN', 'STAFF'], async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') as SubStatus | null
  const search = searchParams.get('search') || ''

  const where: Prisma.SubscriptionWhereInput = {}
  if (status && Object.values(SubStatus).includes(status)) {
    where.status = status
  }
  if (search) {
    where.OR = [
      { customer: { user: { name: { contains: search, mode: 'insensitive' } } } },
      { customer: { user: { email: { contains: search, mode: 'insensitive' } } } },
      { customer: { companyName: { contains: search, mode: 'insensitive' } } },
      { plan: { name: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const subscriptions = await db.subscription.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      customer: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
      plan: true,
      lines: true,
      invoices: {
        select: { id: true, seq: true, status: true, total: true },
      },
    },
  })

  return subscriptions.map((sub) => {
    const totalAmount = sub.lines.reduce((acc, line) => acc + Number(line.amount), 0)
    return {
      id: sub.id,
      seq: sub.seq,
      number: formatSubNumber(sub.seq),
      customerId: sub.customerId,
      customerName: sub.customer.user.name,
      customerEmail: sub.customer.user.email,
      companyName: sub.customer.companyName,
      planId: sub.planId,
      planName: sub.plan.name,
      billingPeriod: sub.plan.billingPeriod,
      status: sub.status,
      isPaused: sub.isPaused,
      startDate: sub.startDate.toISOString(),
      expiryDate: sub.expiryDate.toISOString(),
      nextBillingDate: sub.nextBillingDate ? sub.nextBillingDate.toISOString() : null,
      paymentTermDays: sub.paymentTermDays,
      totalAmount,
      formattedTotal: formatCurrency(totalAmount),
      invoicesCount: sub.invoices.length,
      lines: sub.lines,
    }
  })
})

export const POST = apiHandler(['ADMIN', 'STAFF'], async (req: NextRequest) => {
  let body: any = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 })
  }

  const {
    customerId,
    templateId,
    planId: rawPlanId,
    startDate = new Date(),
    expiryMonths = 12,
    paymentTermDays = 15,
    lines: inputLines = [],
    status: inputStatus,
  } = body

  if (!customerId) {
    return NextResponse.json({ error: 'customerId is required' }, { status: 400 })
  }

  let targetPlanId = rawPlanId
  let targetLines = Array.isArray(inputLines) ? inputLines : []
  let start = new Date(startDate)
  if (isNaN(start.getTime())) start = new Date()

  const safeMonths = Math.max(1, Number(expiryMonths) || 12)
  let expiry = new Date(start)
  expiry.setMonth(expiry.getMonth() + safeMonths)

  let initialStatus: SubStatus = inputStatus || SubStatus.DRAFT

  // If created from Quotation Template
  if (templateId) {
    const template = await db.quotationTemplate.findUnique({
      where: { id: templateId },
      include: {
        plan: true,
        lines: true,
      },
    })

    if (!template) {
      return NextResponse.json(
        { error: `Quotation template "${templateId}" not found` },
        { status: 404 }
      )
    }

    targetPlanId = template.planId
    initialStatus = inputStatus || SubStatus.QUOTATION

    // Validity days: quote validity as today + validityDays
    expiry = new Date(start)
    expiry.setDate(expiry.getDate() + (template.validityDays || 30))

    // Fetch products and active tax associations
    const productIds = template.lines.map((l) => l.productId)
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      include: {
        taxes: {
          include: { tax: true },
          where: { tax: { isActive: true } },
        },
        variants: true,
      },
    })

    const productMap = new Map(products.map((p) => [p.id, p]))

    targetLines = template.lines.map((tl) => {
      const prod = productMap.get(tl.productId)
      const variant = tl.variantId
        ? prod?.variants.find((v) => v.id === tl.variantId)
        : null

      const unitPrice = prod
        ? getUnitPrice(prod.salesPrice, variant?.extraPrice)
        : new Prisma.Decimal(0)

      const activeTaxes = prod?.taxes.map((pt) => ({
        id: pt.tax.id,
        name: pt.tax.name,
        type: pt.tax.type,
        value: pt.tax.value,
      })) || []

      const { taxRate } = calcLineTax(tl.quantity, unitPrice, activeTaxes)
      const primaryTax = activeTaxes[0]

      const lineTotal = new Prisma.Decimal(unitPrice).times(tl.quantity)

      return {
        productId: tl.productId,
        variantId: tl.variantId || null,
        description: prod?.name || 'Product',
        quantity: tl.quantity,
        unitPrice: Number(unitPrice),
        taxRate: Number(taxRate),
        taxType: primaryTax ? primaryTax.type : TaxType.PERCENTAGE,
        amount: Number(lineTotal),
      }
    })
  }

  if (!targetPlanId) {
    return NextResponse.json(
      { error: 'Either planId or templateId is required' },
      { status: 400 }
    )
  }

  const plan = await db.plan.findUnique({ where: { id: targetPlanId } })
  if (!plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  }

  // Default fallback line if no lines specified
  if (targetLines.length === 0) {
    const defaultProduct = await db.product.findFirst({ where: { isActive: true } })
    if (defaultProduct) {
      targetLines = [
        {
          productId: defaultProduct.id,
          variantId: null,
          description: `${plan.name} - ${defaultProduct.name}`,
          quantity: plan.minQuantity || 1,
          unitPrice: Number(plan.price),
          taxRate: 0,
          taxType: TaxType.PERCENTAGE,
          amount: (plan.minQuantity || 1) * Number(plan.price),
        },
      ]
    }
  }

  // Enforce quantity >= plan.minQuantity
  const totalQty = targetLines.reduce(
    (sum: number, line: any) => sum + (Number(line.quantity) || 1),
    0
  )
  if (totalQty < plan.minQuantity) {
    return NextResponse.json(
      {
        error: `Plan "${plan.name}" requires a minimum quantity of ${plan.minQuantity}. Given: ${totalQty}.`,
      },
      { status: 400 }
    )
  }

  const nextBilling = initialStatus === SubStatus.ACTIVE ? start : null

  const newSub = await db.subscription.create({
    data: {
      customerId,
      planId: targetPlanId,
      status: initialStatus,
      startDate: start,
      expiryDate: expiry,
      paymentTermDays: Number(paymentTermDays) || 15,
      nextBillingDate: nextBilling,
      lines: {
        create: targetLines.map((l: any) => {
          const qty = Number(l.quantity) || 1
          const unitPrice = Number(l.unitPrice) || Number(plan.price)
          const amount = Number(l.amount) || qty * unitPrice
          return {
            productId: l.productId,
            variantId: l.variantId || null,
            description: l.description || plan.name,
            quantity: qty,
            unitPrice,
            taxRate: Number(l.taxRate) || 0,
            taxType: l.taxType || TaxType.PERCENTAGE,
            amount,
          }
        }),
      },
    },
    include: {
      customer: { include: { user: true } },
      plan: true,
      lines: true,
    },
  })

  const totalAmount = newSub.lines.reduce((s, l) => s + Number(l.amount), 0)

  return {
    success: true,
    subscription: {
      id: newSub.id,
      seq: newSub.seq,
      number: formatSubNumber(newSub.seq),
      status: newSub.status,
      startDate: newSub.startDate.toISOString(),
      expiryDate: newSub.expiryDate.toISOString(),
      totalAmount,
      formattedTotal: formatCurrency(totalAmount),
      customerName: newSub.customer.user.name,
      planName: newSub.plan.name,
    },
  }
})
