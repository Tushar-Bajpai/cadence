import { NextRequest } from 'next/server'
import { apiHandler, ApiContext } from '@/lib/api'
import { db } from '@/lib/db'
import { getPortalCustomer } from '@/lib/portal-customer'

export const dynamic = 'force-dynamic'

export const POST = apiHandler(null, async (req: NextRequest, session, context?: ApiContext) => {
  const customer = await getPortalCustomer(session)
  if (!customer) throw new Error('Customer not found')

  const params = await context?.params
  const id = params?.id as string
  if (!id) throw new Error('Subscription ID is required')

  const subscription = await db.subscription.findFirst({
    where: { id, customerId: customer.id },
    include: { plan: true },
  })

  if (!subscription) {
    throw new Error('Subscription not found or access denied')
  }

  const body = await req.json()
  const { action } = body

  if (action === 'pause') {
    if (!subscription.plan.pausable) {
      throw new Error(`Plan "${subscription.plan.name}" does not allow pausing as per its policy.`)
    }
    if (subscription.isPaused) {
      throw new Error('Subscription is already paused.')
    }
    const updated = await db.subscription.update({
      where: { id },
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
      where: { id },
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
      where: { id },
      data: { status: 'CLOSED', isPaused: false },
    })
    return { success: true, message: 'Subscription has been cancelled.', subscription: updated }
  }

  throw new Error(`Invalid action: ${action}. Allowed: pause, resume, close`)
})
