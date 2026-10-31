import { NextRequest } from 'next/server'
import { apiHandler, UnauthorizedError } from '@/lib/api'
import { db } from '@/lib/db'
import { getPortalCustomer } from '@/lib/portal-customer'
import { formatDate } from '@/lib/format'
import { getCustomerActivity } from '@/lib/customer-activity'

export const dynamic = 'force-dynamic'

export const GET = apiHandler(null, async (req: NextRequest, session) => {
  const customer = await getPortalCustomer(session)
  if (!customer) throw new UnauthorizedError('Customer not authenticated')

  // Real database activity events
  const activity = await getCustomerActivity(customer.id, customer.user.name)

  return {
    id: customer.id,
    name: customer.user.name,
    email: customer.user.email,
    phone: customer.phone || '—',
    role: customer.user.role === 'ADMIN' ? 'Admin' : 'Customer',
    joined: formatDate(customer.user.createdAt),
    location: customer.address || 'Not specified',
    companyName: customer.companyName || 'Individual',
    address: customer.address || '—',
    activity,
  }
})

export const PUT = apiHandler(null, async (req: NextRequest, session) => {
  const customer = await getPortalCustomer(session)
  if (!customer) throw new UnauthorizedError('Customer not authenticated')

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
