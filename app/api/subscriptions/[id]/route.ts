import { NextRequest, NextResponse } from 'next/server'
import { apiHandler, ApiContext } from '@/lib/api'
import { db } from '@/lib/db'
import { SubStatus, TaxType } from '@prisma/client'
import { formatSubNumber, formatCurrency, formatInvoiceNumber } from '@/lib/format'
import { ALLOWED_TRANSITIONS } from '@/lib/subscription-state'

export const dynamic = 'force-dynamic'

export const GET = apiHandler(['ADMIN', 'STAFF'], async (req: NextRequest, session, context?: ApiContext) => {
  const params = await context?.params
  const id = params?.id as string

  if (!id) throw new Error('Subscription ID is required')

  const sub = await db.subscription.findUnique({
    where: { id },
    include: {
      customer: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      plan: true,
      lines: true,
      discounts: {
        include: {
          discount: true,
        },
      },
      invoices: {
        orderBy: { issueDate: 'desc' },
        include: {
          payments: {
            orderBy: { date: 'desc' },
          },
        },
      },
    },
  })

  if (!sub) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
  }

  const totalLinesAmount = sub.lines.reduce((acc, line) => acc + Number(line.amount), 0)
  const allowedNext = ALLOWED_TRANSITIONS[sub.status] || []

  // Extract all payments from linked invoices
  const allPayments = sub.invoices.flatMap((inv) =>
    inv.payments.map((p) => ({
      id: p.id,
      invoiceId: inv.id,
      invoiceNumber: formatInvoiceNumber(inv.seq),
      amount: Number(p.amount),
      formattedAmount: formatCurrency(Number(p.amount)),
      method: p.method,
      note: p.note,
      date: p.date.toISOString(),
    }))
  )

  const formattedInvoices = sub.invoices.map((inv) => ({
    id: inv.id,
    seq: inv.seq,
    number: formatInvoiceNumber(inv.seq),
    status: inv.status,
    periodStart: inv.periodStart.toISOString(),
    periodEnd: inv.periodEnd.toISOString(),
    issueDate: inv.issueDate.toISOString(),
    dueDate: inv.dueDate.toISOString(),
    total: Number(inv.total),
    formattedTotal: formatCurrency(Number(inv.total)),
    amountPaid: Number(inv.amountPaid),
    formattedAmountPaid: formatCurrency(Number(inv.amountPaid)),
    outstanding: Math.max(0, Number(inv.total) - Number(inv.amountPaid)),
    formattedOutstanding: formatCurrency(
      Math.max(0, Number(inv.total) - Number(inv.amountPaid))
    ),
    paymentsCount: inv.payments.length,
  }))

  return {
    id: sub.id,
    seq: sub.seq,
    number: formatSubNumber(sub.seq),
    customerId: sub.customerId,
    customer: {
      id: sub.customer.id,
      name: sub.customer.user.name,
      email: sub.customer.user.email,
      companyName: sub.customer.companyName,
      phone: sub.customer.phone,
      address: sub.customer.address,
    },
    planId: sub.planId,
    plan: {
      id: sub.plan.id,
      name: sub.plan.name,
      price: Number(sub.plan.price),
      formattedPrice: formatCurrency(Number(sub.plan.price)),
      billingPeriod: sub.plan.billingPeriod,
      minQuantity: sub.plan.minQuantity,
      autoCloseOnEnd: sub.plan.autoCloseOnEnd,
      closable: sub.plan.closable,
      pausable: sub.plan.pausable,
      renewable: sub.plan.renewable,
    },
    status: sub.status,
    isPaused: sub.isPaused,
    startDate: sub.startDate.toISOString(),
    expiryDate: sub.expiryDate.toISOString(),
    nextBillingDate: sub.nextBillingDate ? sub.nextBillingDate.toISOString() : null,
    lastBilledThrough: sub.lastBilledThrough ? sub.lastBilledThrough.toISOString() : null,
    paymentTermDays: sub.paymentTermDays,
    createdAt: sub.createdAt.toISOString(),
    totalAmount: totalLinesAmount,
    formattedTotal: formatCurrency(totalLinesAmount),
    lines: sub.lines.map((l) => ({
      id: l.id,
      productId: l.productId,
      variantId: l.variantId,
      description: l.description,
      quantity: l.quantity,
      unitPrice: Number(l.unitPrice),
      formattedUnitPrice: formatCurrency(Number(l.unitPrice)),
      taxRate: Number(l.taxRate),
      taxType: l.taxType,
      amount: Number(l.amount),
      formattedAmount: formatCurrency(Number(l.amount)),
    })),
    discounts: sub.discounts.map((sd) => ({
      id: sd.discount.id,
      name: sd.discount.name,
      type: sd.discount.type,
      value: Number(sd.discount.value),
      scope: sd.discount.scope,
      isActive: sd.discount.isActive,
    })),
    invoices: formattedInvoices,
    payments: allPayments,
    allowedTransitions: allowedNext,
  }
})

export const PATCH = apiHandler(['ADMIN', 'STAFF'], async (req: NextRequest, session, context?: ApiContext) => {
  const params = await context?.params
  const id = params?.id as string

  if (!id) throw new Error('Subscription ID is required')

  const sub = await db.subscription.findUnique({
    where: { id },
    include: { plan: true },
  })

  if (!sub) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
  }

  const body = await req.json()
  const { startDate, expiryDate, paymentTermDays, lines } = body

  // Only allow updating line items if subscription is DRAFT or QUOTATION
  if (lines && Array.isArray(lines)) {
    if (sub.status !== SubStatus.DRAFT && sub.status !== SubStatus.QUOTATION) {
      return NextResponse.json(
        { error: `Line items can only be modified when status is DRAFT or QUOTATION (current: ${sub.status})` },
        { status: 400 }
      )
    }

    const totalQty = lines.reduce(
      (sum: number, line: any) => sum + (Number(line.quantity) || 1),
      0
    )
    if (totalQty < sub.plan.minQuantity) {
      return NextResponse.json(
        {
          error: `Plan "${sub.plan.name}" requires minimum quantity of ${sub.plan.minQuantity}. Total provided: ${totalQty}.`,
        },
        { status: 400 }
      )
    }

    // Replace lines inside a transaction
    await db.$transaction([
      db.subscriptionLine.deleteMany({ where: { subscriptionId: id } }),
      db.subscriptionLine.createMany({
        data: lines.map((l: any) => {
          const qty = Number(l.quantity) || 1
          const unitPrice = Number(l.unitPrice) || Number(sub.plan.price)
          const amount = Number(l.amount) || qty * unitPrice
          return {
            subscriptionId: id,
            productId: l.productId,
            variantId: l.variantId || null,
            description: l.description || sub.plan.name,
            quantity: qty,
            unitPrice,
            taxRate: Number(l.taxRate) || 0,
            taxType: l.taxType || TaxType.PERCENTAGE,
            amount,
          }
        }),
      }),
    ])
  }

  // Update scalar fields if provided
  const updateData: any = {}
  if (startDate) updateData.startDate = new Date(startDate)
  if (expiryDate) updateData.expiryDate = new Date(expiryDate)
  if (paymentTermDays !== undefined) updateData.paymentTermDays = Number(paymentTermDays)

  if (Object.keys(updateData).length > 0) {
    await db.subscription.update({
      where: { id },
      data: updateData,
    })
  }

  return { success: true, message: 'Subscription updated successfully' }
})

export const DELETE = apiHandler(['ADMIN', 'STAFF'], async (req: NextRequest, session, context?: ApiContext) => {
  const params = await context?.params
  const id = params?.id as string

  if (!id) throw new Error('Subscription ID is required')

  const sub = await db.subscription.findUnique({
    where: { id },
  })

  if (!sub) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
  }

  if (sub.status !== SubStatus.DRAFT && sub.status !== SubStatus.QUOTATION) {
    return NextResponse.json(
      { error: `Cannot delete subscription in "${sub.status}" status. Only DRAFT or QUOTATION can be deleted.` },
      { status: 400 }
    )
  }

  await db.subscription.delete({ where: { id } })

  return { success: true, message: 'Subscription deleted' }
})
