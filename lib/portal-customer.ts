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

  // No customer record for this session — never fall back to an arbitrary
  // customer, even in dev: an unauthenticated request must not gain the
  // identity (and payment ability) of the first customer in the DB.
  // Callers turn this into 401/403.
  return null
}
