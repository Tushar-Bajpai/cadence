import { NextRequest } from 'next/server'
import { apiHandler, ApiContext } from '@/lib/api'
import { db } from '@/lib/db'
import { SubStatus } from '@prisma/client'
import { isValidTransition, canPauseOrResume, canCloseEarly, canRenew } from '@/lib/subscription-state'
import { addPeriod } from '@/lib/billing-period'

export const dynamic = 'force-dynamic'

export const POST = apiHandler(null, async (req: NextRequest, session, context?: ApiContext) => {
  const params = await context?.params
  const id = params?.id as string

  if (!id) throw new Error('Subscription ID is required')

  const body = await req.json()
  const { action, targetStatus } = body

  const sub = await db.subscription.findUnique({
    where: { id },
    include: { plan: true },
  })

  if (!sub) throw new Error('Subscription not found')

  // Handle Pause
  if (action === 'pause') {
    if (!canPauseOrResume(sub.plan)) {
      throw new Error(`Plan "${sub.plan.name}" does not allow pausing.`)
    }
    const updated = await db.subscription.update({
      where: { id },
      data: { isPaused: true },
    })
    return { success: true, message: 'Subscription paused', subscription: updated }
  }

  // Handle Resume
  if (action === 'resume') {
    if (!canPauseOrResume(sub.plan)) {
      throw new Error(`Plan "${sub.plan.name}" does not allow pausing/resuming.`)
    }
    const updated = await db.subscription.update({
      where: { id },
      data: { isPaused: false },
    })
    return { success: true, message: 'Subscription resumed', subscription: updated }
  }

  // Handle Renew
  if (action === 'renew') {
    if (!canRenew(sub.plan)) {
      throw new Error(`Plan "${sub.plan.name}" is not renewable.`)
    }
    const newExpiry = addPeriod(sub.expiryDate, sub.plan.billingPeriod)
    const updated = await db.subscription.update({
      where: { id },
      data: {
        expiryDate: newExpiry,
        status: SubStatus.ACTIVE,
        nextBillingDate: sub.nextBillingDate || new Date(),
      },
    })
    return { success: true, message: 'Subscription renewed', subscription: updated }
  }

  // Handle State Transition
  if (targetStatus) {
    const valid = isValidTransition(sub.status, targetStatus as SubStatus)
    if (!valid) {
      throw new Error(
        `Invalid status transition from "${sub.status}" to "${targetStatus}". Allowed next: ${
          // @ts-ignore
          sub.status === 'DRAFT'
            ? 'QUOTATION'
            : sub.status === 'QUOTATION'
            ? 'CONFIRMED or CLOSED'
            : sub.status === 'CONFIRMED'
            ? 'ACTIVE or CLOSED'
            : sub.status === 'ACTIVE'
            ? 'CLOSED'
            : 'None'
        }`
      )
    }

    if (targetStatus === SubStatus.CLOSED && !canCloseEarly(sub.plan)) {
      throw new Error(`Plan "${sub.plan.name}" does not allow early closing.`)
    }

    const dataToUpdate: any = { status: targetStatus as SubStatus }
    if (targetStatus === SubStatus.ACTIVE && !sub.nextBillingDate) {
      dataToUpdate.nextBillingDate = new Date()
    }

    const updated = await db.subscription.update({
      where: { id },
      data: dataToUpdate,
    })

    return {
      success: true,
      message: `Status moved to ${targetStatus}`,
      subscription: updated,
    }
  }

  throw new Error('Action or targetStatus is required')
})

