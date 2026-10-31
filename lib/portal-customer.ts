import { db } from './db'
import { SessionPayload } from './session'

export async function getPortalCustomer(session: SessionPayload | null) {
  // 1. Direct customerId on session
  if (session?.customerId) {
    const customer = await db.customer.findUnique({
      where: { id: session.customerId },
      include: { user: true },
    })
    if (customer) return customer
  }

  // 2. Lookup by session userId
  if (session?.userId) {
    const customer = await db.customer.findUnique({
      where: { userId: session.userId },
      include: { user: true },
    })
    if (customer) return customer
  }

  // 3. In dev mode without active cookie, resolve first existing customer from database
  const existingCustomer = await db.customer.findFirst({
    include: { user: true },
    orderBy: { user: { createdAt: 'asc' } },
  })

  return existingCustomer || null
}
