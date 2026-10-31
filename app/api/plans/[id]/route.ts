import { NextRequest } from 'next/server'
import { apiHandler, ApiContext } from '@/lib/api'
import { db } from '@/lib/db'
import { formatCurrency } from '@/lib/format'
import { BillingPeriod } from '@prisma/client'

export const dynamic = 'force-dynamic'

export const GET = apiHandler(['ADMIN', 'STAFF'], async (req: NextRequest, session, context?: ApiContext) => {
  const params = await context?.params
  const id = params?.id as string

  if (!id) throw new Error('Plan ID is required')

  const plan = await db.plan.findUnique({
    where: { id },
    include: {
      subscriptions: {
        select: { id: true, status: true, customer: { select: { companyName: true, user: { select: { name: true } } } } },
      },
    },
  })

  if (!plan) throw new Error('Plan not found')

  return {
    id: plan.id,
    name: plan.name,
    price: Number(plan.price),
    formattedPrice: formatCurrency(plan.price),
    billingPeriod: plan.billingPeriod,
    minQuantity: plan.minQuantity,
    availableFrom: plan.availableFrom,
    availableTo: plan.availableTo,
    pausable: plan.pausable,
    closable: plan.closable,
    renewable: plan.renewable,
    autoCloseOnEnd: plan.autoCloseOnEnd,
    isActive: plan.isActive,
    activeSubscribersCount: plan.subscriptions.filter((s) => s.status === 'ACTIVE').length,
    subscriptions: plan.subscriptions,
  }
})

export const PUT = apiHandler(['ADMIN'], async (req: NextRequest, session, context?: ApiContext) => {
  const params = await context?.params
  const id = params?.id as string
  if (!id) throw new Error('Plan ID is required')

  const body = await req.json()
  const {
    name,
    price,
    billingPeriod,
    minQuantity,
    availableFrom,
    availableTo,
    pausable,
    closable,
    renewable,
    autoCloseOnEnd,
    isActive,
  } = body

  const updated = await db.plan.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(price !== undefined && { price: Number(price) }),
      ...(billingPeriod !== undefined && { billingPeriod: billingPeriod as BillingPeriod }),
      ...(minQuantity !== undefined && { minQuantity: Number(minQuantity) }),
      ...(availableFrom !== undefined && { availableFrom: new Date(availableFrom) }),
      ...(availableTo !== undefined && { availableTo: availableTo ? new Date(availableTo) : null }),
      ...(pausable !== undefined && { pausable: Boolean(pausable) }),
      ...(closable !== undefined && { closable: Boolean(closable) }),
      ...(renewable !== undefined && { renewable: Boolean(renewable) }),
      ...(autoCloseOnEnd !== undefined && { autoCloseOnEnd: Boolean(autoCloseOnEnd) }),
      ...(isActive !== undefined && { isActive: Boolean(isActive) }),
    },
  })

  return { success: true, plan: updated }
})

export const DELETE = apiHandler(['ADMIN'], async (req: NextRequest, session, context?: ApiContext) => {
  const params = await context?.params
  const id = params?.id as string
  if (!id) throw new Error('Plan ID is required')

  const subCount = await db.subscription.count({
    where: { planId: id },
  })

  if (subCount > 0) {
    const deactivated = await db.plan.update({
      where: { id },
      data: { isActive: false },
    })
    return {
      success: true,
      message: 'Plan has active subscriptions; marked as inactive.',
      plan: deactivated,
    }
  }

  await db.plan.delete({ where: { id } })
  return { success: true, message: 'Plan deleted permanently.' }
})
