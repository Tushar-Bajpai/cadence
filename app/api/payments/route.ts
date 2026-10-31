import { NextRequest } from 'next/server'
import { apiHandler } from '@/lib/api'
import { db } from '@/lib/db'
import { PayMethod, Prisma } from '@prisma/client'
import { formatCurrency, formatDate } from '@/lib/format'

export const dynamic = 'force-dynamic'

/**
 * GET /api/payments
 * List all payments with filters: method, dateFrom, dateTo, customerId, search
 * Paginated: ?page=1&limit=20
 */
export const GET = apiHandler(['ADMIN', 'STAFF'], async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
  const method = searchParams.get('method')
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  const customerId = searchParams.get('customerId')
  const search = searchParams.get('search') || ''

  const where: Prisma.PaymentWhereInput = {}

  // Filter by payment method
  if (method && method !== 'ALL' && Object.values(PayMethod).includes(method as PayMethod)) {
    where.method = method as PayMethod
  }

  // Filter by date range
  if (dateFrom || dateTo) {
    where.date = {}
    if (dateFrom) (where.date as Prisma.DateTimeFilter).gte = new Date(dateFrom)
    if (dateTo) {
      const endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)
      ;(where.date as Prisma.DateTimeFilter).lte = endDate
    }
  }

  // Filter by customer
  if (customerId) {
    where.customerId = customerId
  }

  // Search by customer name/email or note
  if (search) {
    where.OR = [
      { customer: { user: { name: { contains: search, mode: 'insensitive' } } } },
      { customer: { user: { email: { contains: search, mode: 'insensitive' } } } },
      { note: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [payments, total] = await Promise.all([
    db.payment.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        customer: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        invoice: {
          select: {
            id: true,
            seq: true,
            total: true,
            amountPaid: true,
            status: true,
          },
        },
      },
    }),
    db.payment.count({ where }),
  ])

  return {
    payments: payments.map((p) => ({
      id: p.id,
      invoiceId: p.invoiceId,
      invoiceSeq: p.invoice.seq,
      invoiceNumber: `INV-${String(p.invoice.seq).padStart(6, '0')}`,
      customerName: p.customer.user.name,
      customerEmail: p.customer.user.email,
      method: p.method,
      amount: Number(p.amount),
      formattedAmount: formatCurrency(p.amount),
      date: formatDate(p.date),
      rawDate: p.date.toISOString(),
      note: p.note,
      invoiceTotal: Number(p.invoice.total),
      invoiceAmountPaid: Number(p.invoice.amountPaid),
      invoiceStatus: p.invoice.status,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
})
