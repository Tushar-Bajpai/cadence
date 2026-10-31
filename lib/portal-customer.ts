import { db } from './db'
import { SessionPayload } from './session'

/**
 * Resolves the authenticated customer for portal queries.
 * Defense-in-depth: If a session is provided, it ONLY resolves the customer
 * linked to that specific session (userId or customerId). It NEVER falls back
 * to another customer if a session is present.
 */
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

  // If a session was explicitly provided but has no matching customer,
  // NEVER fall back to another customer!
  if (session) {
    return null
  }

  // 3. Fallback only in dev preview when no session is present at all
  if (process.env.NODE_ENV !== 'production' && !process.env.STRICT_PORTAL_AUTH) {
    const existingCustomer = await db.customer.findFirst({
      include: { user: true },
      orderBy: { user: { createdAt: 'asc' } },
    })
    return existingCustomer || null
  }

  return null
}
