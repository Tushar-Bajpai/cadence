import { NextRequest } from 'next/server'
import { apiHandler } from '@/lib/api'
import { db } from '@/lib/db'
import { formatCurrency, formatDate } from '@/lib/format'
import { getCustomerActivity } from '@/lib/customer-activity'
import { createCustomerSchema } from '@/lib/validators'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export const GET = apiHandler(['ADMIN', 'STAFF'], async (req: NextRequest) => {
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

    // Real dynamic activity timeline from database
    const activityTimeline = await getCustomerActivity(customer.id, customer.user.name)

    return {
      id: customer.id,
      name: customer.user.name,
      email: customer.user.email,
      phone: customer.phone || '—',
      role: customer.user.role === 'ADMIN' ? 'Admin' : 'Customer',
      joined: formatDate(customer.user.createdAt),
      location: customer.address || 'Not specified',
      companyName: customer.companyName || 'Independent',
      address: customer.address || '—',
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
      phone: c.phone || '—',
      companyName: c.companyName || 'Independent',
      location: c.address || 'Not specified',
      joined: formatDate(c.user.createdAt),
      activeSubscriptionsCount: c.subscriptions.filter((s) => s.status === 'ACTIVE').length,
      totalSpent,
      formattedTotalSpent: formatCurrency(totalSpent),
    }
  })
})

export const POST = apiHandler(['ADMIN', 'STAFF'], async (req: NextRequest) => {
  const data = createCustomerSchema.parse(await req.json())

  // Generate a random temporary password hash for the user
  const randomPass = Math.random().toString(36).slice(-10) + 'A1!'
  const passwordHash = await bcrypt.hash(randomPass, 10)

  const user = await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: 'CUSTOMER',
      customer: {
        create: {
          companyName: data.companyName,
          phone: data.phone,
          address: data.address,
        },
      },
    },
    include: { customer: true },
  })

  return {
    success: true,
    customer: {
      id: user.customer?.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      companyName: user.customer?.companyName,
    },
  }
})
