import { db } from './db'
import { SessionPayload } from './session'

/**
 * Resolves the authenticated customer for portal queries.
 * Customer sessions are strictly isolated to their own customer record.
 * Admin and staff sessions may preview the dedicated demo customer.
 */
export async function getPortalCustomer(session: SessionPayload | null) {
  if (!session) return null

  // 1. Direct customerId on session (e.g. Robert Fox or registered customer)
  if (session.customerId) {
    const customer = await db.customer.findUnique({
      where: { id: session.customerId },
      include: { user: true },
    })
    if (customer) return customer
  }

  // 2. Lookup by session userId
  if (session.userId) {
    let customer = await db.customer.findUnique({
      where: { userId: session.userId },
      include: { user: true },
    })
    if (customer) return customer

    // If the logged-in user is a CUSTOMER but does not have a customer record yet,
    // auto-create a clean, isolated customer record for them:
    if (session.role === 'CUSTOMER') {
      customer = await db.customer.create({
        data: {
          userId: session.userId,
          companyName: null,
        },
        include: { user: true },
      })
      return customer
    }
  }

  // 3. Admin / Staff preview:
  // When an Admin or Staff previews the Customer Portal, default to previewing
  // the dedicated Demo Customer (Robert Fox).
  if (session && (session.role === 'ADMIN' || session.role === 'STAFF')) {
    const demoCustomer = await db.customer.findFirst({
      where: { user: { email: 'robert.fox@example.com' } },
      include: { user: true },
    })
    if (demoCustomer) return demoCustomer
  }
  return null
}
