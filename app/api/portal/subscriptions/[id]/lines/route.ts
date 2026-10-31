import { NextRequest } from 'next/server'
import { apiHandler, ApiContext } from '@/lib/api'
import { db } from '@/lib/db'
import { getPortalCustomer } from '@/lib/portal-customer'
import { getUnitPrice } from '@/lib/pricing'
import { portalAddLineSchema } from '@/lib/validators'

export const dynamic = 'force-dynamic'

export const POST = apiHandler(null, async (req: NextRequest, session, context?: ApiContext) => {
  const customer = await getPortalCustomer(session)
  if (!customer) throw new Error('Customer not found')

  const params = await context?.params
  const subscriptionId = params?.id as string
  if (!subscriptionId) throw new Error('Subscription ID is required')

  const subscription = await db.subscription.findFirst({
    where: { id: subscriptionId, customerId: customer.id },
    include: { plan: true },
  })

  if (!subscription) throw new Error('Subscription not found or access denied')

  const { productId, variantId, quantity } = portalAddLineSchema.parse(await req.json())

  const product = await db.product.findUnique({
    where: { id: productId },
    include: { variants: true, taxes: { include: { tax: true } } },
  })

  if (!product) throw new Error('Product not found')

  const variant = product.variants.find((v) => v.id === variantId)
  const unitPrice = getUnitPrice(product.salesPrice, variant?.extraPrice)
  const qty = Math.max(1, Number(quantity) || 1)
  const amount = Number(unitPrice) * qty

  const description = variant
    ? `${product.name} (${variant.attribute}: ${variant.value})`
    : product.name

  const newLine = await db.subscriptionLine.create({
    data: {
      subscriptionId: subscription.id,
      productId: product.id,
      variantId: variant?.id || null,
      description,
      quantity: qty,
      unitPrice: Number(unitPrice),
      amount,
    },
  })

  return {
    success: true,
    message: `Added ${description} to your subscription!`,
    line: newLine,
  }
})

export const DELETE = apiHandler(null, async (req: NextRequest, session, context?: ApiContext) => {
  const customer = await getPortalCustomer(session)
  if (!customer) throw new Error('Customer not found')

  const params = await context?.params
  const subscriptionId = params?.id as string
  const { searchParams } = new URL(req.url)
  const lineId = searchParams.get('lineId')

  if (!subscriptionId || !lineId) {
    throw new Error('Subscription ID and Line ID are required')
  }

  const subscription = await db.subscription.findFirst({
    where: { id: subscriptionId, customerId: customer.id },
    include: { lines: true },
  })

  if (!subscription) throw new Error('Subscription not found')

  if (subscription.lines.length <= 1) {
    throw new Error('Cannot remove the primary base plan line from an active subscription.')
  }

  const line = subscription.lines.find((l) => l.id === lineId)
  if (!line) throw new Error('Subscription line not found')

  await db.subscriptionLine.delete({ where: { id: lineId } })

  return {
    success: true,
    message: `Removed ${line.description} from subscription.`,
  }
})

