import { NextRequest } from 'next/server'
import { apiHandler } from '@/lib/api'
import { db } from '@/lib/db'
import { InvoiceStatus, Prisma } from '@prisma/client'
import { formatInvoiceNumber, formatCurrency, formatDate } from '@/lib/format'

export const dynamic = 'force-dynamic'

// Invoice list. Every list endpoint is paginated (ground rule)
// with a total count for the pager. Filters: status (incl. OVERDUE pseudo
// status), customer, date range, search.
export const GET = apiHandler(null, async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search') || ''
  const customerId = searchParams.get('customerId') || ''
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const overdueOnly = searchParams.get('overdue') === 'true'

  // Note: status PAID is set automatically when amountPaid reaches total
  // (payments flow), so CONFIRMED + dueDate < now is equivalent to
  // CONFIRMED + outstanding > 0 in practice.
  const overdueWhere: Prisma.InvoiceWhereInput = {
    status: InvoiceStatus.CONFIRMED,
    dueDate: { lt: new Date() },
  }

  const where: Prisma.InvoiceWhereInput =
    overdueOnly || status === 'OVERDUE' ? overdueWhere : {}

  if (!overdueOnly && status !== 'OVERDUE') {
    if (status && status !== 'ALL' && Object.values(InvoiceStatus).includes(status as InvoiceStatus)) {
      where.status = status as InvoiceStatus
    }
  }

  if (customerId) {
    where.customerId = customerId
  }

  if (from || to) {
    where.issueDate = {}
    if (from) where.issueDate.gte = new Date(from)
    if (to) {
      const end = new Date(to)
      end.setHours(23, 59, 59, 999)
      where.issueDate.lte = end
    }
  }

  if (search) {
    where.OR = [
      { customer: { user: { name: { contains: search, mode: 'insensitive' } } } },
      { customer: { user: { email: { contains: search, mode: 'insensitive' } } } },
      { subscription: { plan: { name: { contains: search, mode: 'insensitive' } } } },
    ]
  }

  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20))

  const [invoices, total] = await Promise.all([
    db.invoice.findMany({
      where,
      orderBy: { issueDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        customer: { include: { user: { select: { name: true, email: true } } } },
        subscription: { include: { plan: true } },
        lines: true,
        payments: { orderBy: { date: 'desc' }, take: 1 },
      },
    }),
    db.invoice.count({ where }),
  ])

  const now = new Date()

  return {
    invoices: invoices.map((inv) => {
      const outstanding = Math.max(0, Number(inv.total) - Number(inv.amountPaid))
      const isOverdue =
        inv.status === InvoiceStatus.CONFIRMED &&
        new Date(inv.dueDate) < now &&
        outstanding > 0
      const displayStatus = isOverdue ? 'OVERDUE' : inv.status
      const latestPayment = inv.payments[0]

      return {
        id: inv.id,
        seq: inv.seq,
        number: formatInvoiceNumber(inv.seq),
        date: formatDate(inv.issueDate),
        rawDate: inv.issueDate.toISOString(),
        dueDate: formatDate(inv.dueDate),
        rawDueDate: inv.dueDate.toISOString(),
        periodStart: formatDate(inv.periodStart),
        periodEnd: formatDate(inv.periodEnd),
        customerId: inv.customerId,
        customerName: inv.customer.user.name,
        customerEmail: inv.customer.user.email,
        companyName: inv.customer.companyName,
        planName: inv.subscription.plan.name,
        billingPeriod: inv.subscription.plan.billingPeriod,
        description: `${inv.subscription.plan.name} – ${inv.subscription.plan.billingPeriod.toLowerCase()}`,
        amount: Number(inv.total),
        formattedAmount: formatCurrency(inv.total),
        amountPaid: Number(inv.amountPaid),
        formattedAmountPaid: formatCurrency(inv.amountPaid),
        outstanding,
        formattedOutstanding: formatCurrency(outstanding),
        status: displayStatus,
        sentAt: inv.sentAt ? formatDate(inv.sentAt) : null,
        paidAt: latestPayment ? formatDate(latestPayment.date) : null,
        linesCount: inv.lines.length,
      }
    }),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  }
})
