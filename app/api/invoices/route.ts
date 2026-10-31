import { NextRequest } from 'next/server'
import { apiHandler } from '@/lib/api'
import { db } from '@/lib/db'
import { InvoiceStatus, Prisma } from '@prisma/client'
import { formatInvoiceNumber, formatCurrency, formatDate } from '@/lib/format'

export const dynamic = 'force-dynamic'

export const GET = apiHandler(null, async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search') || ''

  const where: Prisma.InvoiceWhereInput = {}
  if (status && status !== 'ALL') {
    if (status === 'OVERDUE') {
      where.status = InvoiceStatus.CONFIRMED
      where.dueDate = { lt: new Date() }
    } else if (Object.values(InvoiceStatus).includes(status as InvoiceStatus)) {
      where.status = status as InvoiceStatus
    }
  }

  if (search) {
    where.OR = [
      { customer: { user: { name: { contains: search, mode: 'insensitive' } } } },
      { customer: { user: { email: { contains: search, mode: 'insensitive' } } } },
      { subscription: { plan: { name: { contains: search, mode: 'insensitive' } } } },
    ]
  }

  const invoices = await db.invoice.findMany({
    where,
    orderBy: { issueDate: 'desc' },
    include: {
      customer: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
      subscription: {
        include: { plan: true },
      },
      lines: true,
      payments: {
        orderBy: { date: 'desc' },
        take: 1,
      },
    },
  })

  const now = new Date()

  const mapped = invoices.map((inv) => {
    const total = Number(inv.total)
    const amountPaid = Number(inv.amountPaid)
    const outstanding = Math.max(0, total - amountPaid)
    const isOverdue =
      inv.status === InvoiceStatus.CONFIRMED && new Date(inv.dueDate) < now && outstanding > 0
    const displayStatus = isOverdue ? 'OVERDUE' : inv.status
    const latestPayment = inv.payments[0]

    return {
      id: inv.id,
      seq: inv.seq,
      number: formatInvoiceNumber(inv.seq),
      displayNumber: `Invoice #${inv.seq}`,
      date: formatDate(inv.issueDate),
      rawDate: inv.issueDate.toISOString(),
      dueDate: formatDate(inv.dueDate),
      rawDueDate: inv.dueDate.toISOString(),
      customerName: inv.customer.user.name,
      customerEmail: inv.customer.user.email,
      companyName: inv.customer.companyName,
      planName: inv.subscription.plan.name,
      description: `${inv.subscription.plan.name} – Monthly`,
      amount: total,
      formattedAmount: formatCurrency(inv.total),
      amountPaid: amountPaid,
      formattedAmountPaid: formatCurrency(inv.amountPaid),
      outstanding,
      formattedOutstanding: formatCurrency(outstanding),
      status: displayStatus,
      paidAt: latestPayment ? formatDate(latestPayment.date) : null,
      linesCount: inv.lines.length,
    }
  })

  if (status === 'OVERDUE') {
    return mapped.filter((inv) => inv.status === 'OVERDUE')
  }

  return mapped
})

