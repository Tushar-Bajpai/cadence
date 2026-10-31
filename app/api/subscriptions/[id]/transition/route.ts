import { NextRequest, NextResponse } from 'next/server'
import { apiHandler, ApiContext } from '@/lib/api'
import { db } from '@/lib/db'
import { SubStatus } from '@prisma/client'
import {
  isValidTransition,
  canPauseOrResume,
  canCloseEarly,
  canRenew,
} from '@/lib/subscription-state'
import { addPeriod } from '@/lib/billing-period'
import { z } from 'zod'

export const dynamic = 'force-dynamic'


const transitionInputSchema = z
  .object({
    action: z.enum(['pause', 'resume', 'renew']).optional(),
    to: z.enum(['DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'CLOSED']).optional(),
    targetStatus: z.enum(['DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'CLOSED']).optional(),
  })
  .refine((data) => data.action || data.to || data.targetStatus, {
    message: 'Either action, to, or targetStatus is required',
  })


export const POST = apiHandler(['ADMIN', 'STAFF'], async (req: NextRequest, session, context?: ApiContext) => {
  const params = await context?.params
  const id = params?.id as string

  if (!id) throw new Error('Subscription ID is required')

  const parsed = transitionInputSchema.parse(await req.json())
  const targetStatus = (parsed.to || parsed.targetStatus) as SubStatus | undefined
  const action = parsed.action

  const sub = await db.subscription.findUnique({
    where: { id },
    include: { plan: true },
  })

  if (!sub) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
  }

  // Handle Pause (only if ACTIVE and plan.pausable)
  if (action === 'pause') {
    if (sub.status !== SubStatus.ACTIVE) {
      return NextResponse.json(
        { error: `Only ACTIVE subscriptions can be paused (current: ${sub.status}).` },
        { status: 400 }
      )
    }
    if (sub.isPaused) {
      return NextResponse.json({ error: 'Subscription is already paused.' }, { status: 400 })
    }
    if (!canPauseOrResume(sub.plan)) {
      return NextResponse.json(
        { error: `Plan "${sub.plan.name}" does not allow pausing (pausable=false).` },
        { status: 400 }
      )
    }
    const updated = await db.subscription.update({
      where: { id },
      data: { isPaused: true },
    })
    return { success: true, message: 'Subscription paused', subscription: updated }
  }

  // Handle Resume (only if paused and plan.pausable)
  if (action === 'resume') {
    if (!sub.isPaused) {
      return NextResponse.json({ error: 'Subscription is not paused.' }, { status: 400 })
    }
    if (!canPauseOrResume(sub.plan)) {
      return NextResponse.json(
        { error: `Plan "${sub.plan.name}" does not allow resuming (pausable=false).` },
        { status: 400 }
      )
    }
    const updated = await db.subscription.update({
      where: { id },
      data: { isPaused: false },
    })
    return { success: true, message: 'Subscription resumed', subscription: updated }
  }

  // Handle Renew (only if plan.renewable)
  if (action === 'renew') {
    if (!canRenew(sub.plan)) {
      return NextResponse.json(
        { error: `Plan "${sub.plan.name}" is not renewable (renewable=false).` },
        { status: 400 }
      )
    }
    const newExpiry = addPeriod(sub.expiryDate, sub.plan.billingPeriod)
    const updated = await db.subscription.update({
      where: { id },
      data: {
        expiryDate: newExpiry,
        status: SubStatus.ACTIVE,
        nextBillingDate: sub.nextBillingDate || sub.startDate || new Date(),
      },
    })
    return { success: true, message: 'Subscription renewed', subscription: updated }
  }

  // Handle Lifecycle State Transitions: DRAFT -> QUOTATION -> CONFIRMED -> ACTIVE -> CLOSED
  if (targetStatus) {
    const valid = isValidTransition(sub.status, targetStatus)
    if (!valid) {
      const allowed =
        sub.status === 'DRAFT'
          ? 'QUOTATION'
          : sub.status === 'QUOTATION'
          ? 'CONFIRMED or CLOSED'
          : sub.status === 'CONFIRMED'
          ? 'ACTIVE or CLOSED'
          : sub.status === 'ACTIVE'
          ? 'CLOSED'
          : 'None (CLOSED is terminal)'

      return NextResponse.json(
        {
          error: `Illegal state transition from "${sub.status}" to "${targetStatus}". Allowed next transitions: ${allowed}.`,
        },
        { status: 400 }
      )
    }

    // Plan switch: close early applies when actively running subscription is closed before expiry
    if (
      sub.status === SubStatus.ACTIVE &&
      targetStatus === SubStatus.CLOSED &&
      !canCloseEarly(sub.plan)
    ) {
      return NextResponse.json(
        { error: `Plan "${sub.plan.name}" does not allow early closing (closable=false).` },
        { status: 400 }
      )
    }

    const dataToUpdate: any = { status: targetStatus }

    // On → ACTIVE: set nextBillingDate = startDate
    if (targetStatus === SubStatus.ACTIVE) {
      dataToUpdate.nextBillingDate = sub.startDate
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

  return NextResponse.json(
    { error: 'Either "to" (or targetStatus) or "action" is required' },
    { status: 400 }
  )
})
