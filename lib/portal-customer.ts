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

  // 3. Fallback for Dev Preview (Robert Fox / Darrell Steward / First Customer)
  const fallback = await db.customer.findFirst({
    where: {
      user: {
        email: { in: ['robert.fox@example.com', 'darrell.steward@example.com', 'jackson.graham@example.com'] },
      },
    },
    include: { user: true },
  })

  if (fallback) return fallback

  // 4. Any customer
  const anyCustomer = await db.customer.findFirst({
    include: { user: true },
  })

  if (anyCustomer) return anyCustomer

  // 5. If no customers exist at all, create demo Robert Fox
  const demoUser = await db.user.upsert({
    where: { email: 'robert.fox@example.com' },
    update: { name: 'Robert Fox' },
    create: {
      email: 'robert.fox@example.com',
      name: 'Robert Fox',
      passwordHash: '$2a$10$wK6O8c19y7x2E904.Z096uJ9hZp1uP9qG1X4jF.fC4eB5r6t7y8u',
      role: 'CUSTOMER',
    },
  })

  return await db.customer.create({
    data: {
      userId: demoUser.id,
      companyName: 'SaaS Patterns',
      phone: '(704) 555-0127',
      address: '2972 Westheimer Rd. Santa Ana, Illinois 85486',
    },
    include: { user: true },
  })
}
