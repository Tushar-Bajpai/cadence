import { NextRequest } from 'next/server'
import { apiHandler } from '@/lib/api'
import { db } from '@/lib/db'
import { getPortalCustomer } from '@/lib/portal-customer'
import { formatDate } from '@/lib/format'

export const dynamic = 'force-dynamic'

export const GET = apiHandler(null, async (req: NextRequest, session) => {
  const customer = await getPortalCustomer(session)
  if (!customer) throw new Error('Customer not found')

  const activity = [
    {
      date: 'Jun 22, 2026',
      events: [
        {
          id: 'act-1',
          type: 'move',
          color: 'purple',
          actor: customer.user.name,
          action: 'reviewed Dark mode date picker settings',
        },
        {
          id: 'act-2',
          type: 'comment',
          color: 'amber',
          actor: customer.user.name,
          action: 'commented',
          body: 'Subscription renewed smoothly without duplicate billing verification.',
        },
      ],
    },
    {
      date: 'Jun 20, 2026',
      events: [
        {
          id: 'act-3',
          type: 'invite',
          color: 'blue',
          actor: customer.user.name,
          action: 'invited Wade Warren to billing workspace',
        },
      ],
    },
    {
      date: 'Jun 18, 2026',
      events: [
        {
          id: 'act-4',
          type: 'thread',
          color: 'pink',
          actor: customer.user.name,
          action: 'commented on automated receipt policy',
          body: 'From its medieval origins to the digital era, automated subscription management brings clarity.',
          replies: [
            {
              id: 'rep-1',
              actor: 'Daniel Thomas',
              action: 'commented',
              body: 'Verified invoice #1019 receipt matches bank ledger.',
            },
            {
              id: 'rep-2',
              actor: 'Kathryn Murphy',
              action: 'commented',
              body: 'The purpose of modern billing is to create natural, seamless checkout.',
            },
          ],
        },
      ],
    },
  ]

  return {
    id: customer.id,
    name: customer.user.name,
    email: customer.user.email,
    phone: customer.phone || '(704) 555-0127',
    role: customer.user.role === 'ADMIN' ? 'Admin' : 'Customer',
    joined: formatDate(customer.user.createdAt),
    location: 'Sydney, Australia',
    companyName: customer.companyName || 'SaaS Patterns',
    address: customer.address || '2972 Westheimer Rd. Santa Ana, Illinois 85486',
    activity,
  }
})

export const PUT = apiHandler(null, async (req: NextRequest, session) => {
  const customer = await getPortalCustomer(session)
  if (!customer) throw new Error('Customer not found')

  const body = await req.json()
  const { name, companyName, phone, address } = body

  const updatedCustomer = await db.$transaction(async (tx) => {
    if (name) {
      await tx.user.update({
        where: { id: customer.userId },
        data: { name },
      })
    }

    return await tx.customer.update({
      where: { id: customer.id },
      data: {
        ...(companyName !== undefined && { companyName }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
      },
      include: { user: true },
    })
  })

  return {
    success: true,
    message: 'Profile updated successfully!',
    customer: updatedCustomer,
  }
})
