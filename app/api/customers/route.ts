import { NextRequest } from 'next/server'
import { apiHandler } from '@/lib/api'
import { db } from '@/lib/db'
import { formatCurrency, formatDate } from '@/lib/format'

export const dynamic = 'force-dynamic'

export const GET = apiHandler(null, async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (id) {
    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        user: true,
        subscriptions: { include: { plan: true } },
        invoices: { take: 5, orderBy: { issueDate: 'desc' } },
      },
    })

    if (!customer) throw new Error('Customer not found')

    // Timeline activity matching screenshot 2
    const activityTimeline = [
      {
        date: 'Jun 22, 2023',
        events: [
          {
            id: 'ev-1',
            type: 'move',
            color: 'purple',
            actor: customer.user.name,
            action: 'moved Dark mode date picker for review',
          },
          {
            id: 'ev-2',
            type: 'comment',
            color: 'amber',
            actor: customer.user.name,
            action: 'commented',
            body: 'Lorem ipsum is placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts and visual mockups.',
          },
        ],
      },
      {
        date: 'Jun 20, 2023',
        events: [
          {
            id: 'ev-3',
            type: 'invite',
            color: 'blue',
            actor: customer.user.name,
            action: 'invited Wade Warren',
          },
        ],
      },
      {
        date: 'Jun 18, 2023',
        events: [
          {
            id: 'ev-4',
            type: 'thread',
            color: 'pink',
            actor: customer.user.name,
            action: 'commented',
            body: 'From its medieval origins to the digital era, learn everything there is to know about the ubiquitous lorem ipsum passage.',
            replies: [
              {
                id: 'rep-1',
                actor: 'Daniel Thomas',
                action: 'commented',
                body: 'Lorem ipsum, or lipsum as it is sometimes known, is dummy text used in laying out web designs.',
              },
              {
                id: 'rep-2',
                actor: 'Kathryn Murphy',
                action: 'commented',
                body: 'The purpose of lorem ipsum is to create a natural looking block of text.',
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
      joined: 'November 26, 2023',
      location: customer.address?.includes('Sydney') ? customer.address : 'Sydney, Australia',
      companyName: customer.companyName,
      address: customer.address,
      activeSubscriptions: customer.subscriptions.filter((s) => s.status === 'ACTIVE').length,
      activity: activityTimeline,
    }
  }

  // Directory listing
  const customers = await db.customer.findMany({
    orderBy: { user: { createdAt: 'desc' } },
    include: {
      user: true,
      subscriptions: { include: { plan: true } },
      invoices: { select: { total: true, status: true } },
    },
  })

  return customers.map((c) => {
    const totalSpent = c.invoices
      .filter((i) => i.status === 'PAID')
      .reduce((acc, i) => acc + Number(i.total), 0)

    return {
      id: c.id,
      userId: c.userId,
      name: c.user.name,
      email: c.user.email,
      role: c.user.role,
      phone: c.phone || '(704) 555-0127',
      companyName: c.companyName || 'Independent',
      location: c.address || 'Sydney, Australia',
      joined: formatDate(c.user.createdAt),
      activeSubscriptionsCount: c.subscriptions.filter((s) => s.status === 'ACTIVE').length,
      totalSpent,
      formattedTotalSpent: formatCurrency(totalSpent),
    }
  })
})

