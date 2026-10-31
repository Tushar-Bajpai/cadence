import { NextRequest } from 'next/server'
import { apiHandler, ApiContext, NotFoundError, UnauthorizedError } from '@/lib/api'
import { db } from '@/lib/db'
import { getPortalCustomer } from '@/lib/portal-customer'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const portalActionSchema = z.object({
  action: z.enum(['pause', 'resume', 'close']),
})

export const POST = apiHandler(null, async (req: NextRequest, session, context?: ApiContext) => {
  const customer = await getPortalCustomer(session)
  if (!customer) throw new UnauthorizedError('Customer not authenticated')

  const params = await context?.params
  const idOrSeq = params?.id as string
  if (!idOrSeq) throw new NotFoundError('Subscription ID is required')

  const isNumeric = /^\d+$/.test(idOrSeq)

  const subscription = await db.subscription.findFirst({
    where: {
      ...(isNumeric ? { seq: parseInt(idOrSeq, 10) } : { id: idOrSeq }),
      customerId: customer.id,
    },
    include: { plan: true },
  })

  if (!subscription) {
    throw new NotFoundError('Subscription not found')
  }

  const { action } = portalActionSchema.parse(await req.json())

  if (action === 'pause') {
    if (!subscription.plan.pausable) {
      throw new Error(`Plan "${subscription.plan.name}" does not allow pausing as per its policy.`)
    }
    if (subscription.isPaused) {
      throw new Error('Subscription is already paused.')
    }
    const updated = await db.subscription.update({
      where: { id: subscription.id },
      data: { isPaused: true },
    })
    return { success: true, message: 'Subscription paused successfully.', subscription: updated }
  }

  if (action === 'resume') {
    if (!subscription.plan.pausable) {
      throw new Error(`Plan "${subscription.plan.name}" does not allow pausing/resuming.`)
    }
    if (!subscription.isPaused) {
      throw new Error('Subscription is not paused.')
    }
    const updated = await db.subscription.update({
      where: { id: subscription.id },
      data: { isPaused: false },
    })
    return { success: true, message: 'Subscription resumed successfully.', subscription: updated }
  }

  if (action === 'close') {
    if (!subscription.plan.closable) {
      throw new Error(`Plan "${subscription.plan.name}" does not allow early cancellation as per contract terms.`)
    }
    if (subscription.status === 'CLOSED') {
      throw new Error('Subscription is already closed.')
    }
    const updated = await db.subscription.update({
      where: { id: subscription.id },
      data: { status: 'CLOSED', isPaused: false },
    })
    return { success: true, message: 'Subscription has been cancelled.', subscription: updated }
  }

  throw new Error(`Invalid action: ${action}. Allowed: pause, resume, close`)
})
