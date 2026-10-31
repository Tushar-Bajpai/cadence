import { NextRequest } from 'next/server'
import { apiHandler } from '@/lib/api'
import { db } from '@/lib/db'
import { Role, Prisma, InvoiceStatus, SubStatus } from '@prisma/client'
import { formatCurrency, formatDate, formatInvoiceNumber } from '@/lib/format'
import { differenceInDays, subMonths, format } from 'date-fns'

export const dynamic = 'force-dynamic'

/**
 * GET /api/reports/summary?from=&to=&customerId=&status=
 * Admin + Staff Finance Reporting API.
 * High-performance: executes all analytical queries in parallel via Promise.all.
 */
export const GET = apiHandler([Role.ADMIN, Role.STAFF], async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const fromParam = searchParams.get('from')
  const toParam = searchParams.get('to')
  const customerId = searchParams.get('customerId') || undefined
  const statusParam = searchParams.get('status') || undefined

  const fromDate = fromParam ? new Date(fromParam) : undefined
  const toDate = toParam ? new Date(toParam) : undefined
  const now = new Date()

  // Validate status parameter if provided
  const subStatusFilter =
    statusParam && Object.values(SubStatus).includes(statusParam as SubStatus)
      ? (statusParam as SubStatus)
      : undefined

  // 1. Parallel execution of all 7 Phase 9 metrics via Promise.all
  const [
    activeSubsCount,
    mrrRaw,
    revenueAgg,
    outstandingRaw,
    overdueAggRaw,
    topOverdueInvoices,
    revenueByMonthRaw,
    subsByStatusRaw,
    customersList,
  ] = await Promise.all([
    // 1) Active subscriptions count (or filtered status count if specified)
    db.subscription.count({
      where: {
        status: subStatusFilter ?? SubStatus.ACTIVE,
        ...(customerId ? { customerId } : {}),
      },
    }),

    // 2) MRR (normalized): query active subscriptions with plan & line amounts
    db.$queryRaw<{ billingPeriod: string; totalAmount: any }[]>`
      SELECT
        p."billingPeriod",
        COALESCE(SUM(COALESCE(l."amount", p."price")), 0) as "totalAmount"
      FROM "Subscription" s
      JOIN "Plan" p ON s."planId" = p."id"
      LEFT JOIN "SubscriptionLine" l ON l."subscriptionId" = s."id"
      WHERE s."status" = 'ACTIVE'
        ${subStatusFilter && subStatusFilter !== SubStatus.ACTIVE ? Prisma.sql`AND 1=0` : Prisma.empty}
        ${customerId ? Prisma.sql`AND s."customerId" = ${customerId}` : Prisma.empty}
      GROUP BY p."billingPeriod"
    `,

    // 3) Revenue collected within optional date range and customer
    db.payment.aggregate({
      _sum: { amount: true },
      where: {
        ...(customerId ? { customerId } : {}),
        ...(fromDate || toDate
          ? {
              date: {
                ...(fromDate ? { gte: fromDate } : {}),
                ...(toDate ? { lte: toDate } : {}),
              },
            }
          : {}),
      },
    }),

    // 4) Outstanding: SUM(total - amountPaid) where status = 'CONFIRMED'
    db.$queryRaw<{ outstanding: any }[]>`
      SELECT COALESCE(SUM("total" - "amountPaid"), 0) as outstanding
      FROM "Invoice"
      WHERE "status" = 'CONFIRMED'
        ${customerId ? Prisma.sql`AND "customerId" = ${customerId}` : Prisma.empty}
    `,

    // 5) Overdue invoices count and total overdue amount (dueDate < now && status = CONFIRMED)
    db.$queryRaw<{ count: any; amount: any }[]>`
      SELECT
        COUNT(*) as count,
        COALESCE(SUM("total" - "amountPaid"), 0) as amount
      FROM "Invoice"
      WHERE "status" = 'CONFIRMED'
        AND "dueDate" < NOW()
        AND "amountPaid" < "total"
        ${customerId ? Prisma.sql`AND "customerId" = ${customerId}` : Prisma.empty}
    `,

    // Top 10 overdue invoices list ordered by dueDate ASC
    db.invoice.findMany({
      where: {
        status: InvoiceStatus.CONFIRMED,
        dueDate: { lt: now },
        ...(customerId ? { customerId } : {}),
      },
      take: 10,
      orderBy: { dueDate: 'asc' },
      include: {
        customer: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        subscription: {
          include: {
            plan: { select: { name: true, billingPeriod: true } },
          },
        },
      },
    }),

    // 6) Revenue by month: date_trunc('month', date) -> for Recharts bar chart
    db.$queryRaw<{ month: string; label: string; revenue: any }[]>`
      SELECT
        to_char(date_trunc('month', "date"), 'YYYY-MM') as month,
        to_char(date_trunc('month', "date"), 'Mon YYYY') as label,
        COALESCE(SUM("amount"), 0) as revenue
      FROM "Payment"
      WHERE 1=1
        ${customerId ? Prisma.sql`AND "customerId" = ${customerId}` : Prisma.empty}
        ${fromDate ? Prisma.sql`AND "date" >= ${fromDate}` : Prisma.empty}
        ${toDate ? Prisma.sql`AND "date" <= ${toDate}` : Prisma.empty}
      GROUP BY 1, 2
      ORDER BY 1 ASC
    `,

    // 7) Subscriptions by status: groupBy status -> for donut / badge indicators
    db.subscription.groupBy({
      by: ['status'],
      _count: { id: true },
      where: {
        ...(customerId ? { customerId } : {}),
        ...(subStatusFilter ? { status: subStatusFilter } : {}),
      },
    }),

    // Customer selector filter list
    db.customer.findMany({
      select: {
        id: true,
        companyName: true,
        user: { select: { name: true, email: true } },
      },
      take: 100,
      orderBy: { user: { name: 'asc' } },
    }),
  ])

  // --- Calculate Normalized MRR ---
  // Yearly / 12, Weekly * 4.33, Daily * 30, Monthly * 1
  let mrr = 0
  for (const row of mrrRaw) {
    const amount = Number(row.totalAmount || 0)
    if (row.billingPeriod === 'YEARLY') {
      mrr += amount / 12
    } else if (row.billingPeriod === 'WEEKLY') {
      mrr += amount * 4.33
    } else if (row.billingPeriod === 'DAILY') {
      mrr += amount * 30
    } else {
      mrr += amount
    }
  }
  mrr = Math.round(mrr * 100) / 100

  // Revenue collected
  const revenueCollected = Number(revenueAgg._sum.amount || 0)

  // Outstanding amount
  const outstanding = Math.max(0, Number(outstandingRaw[0]?.outstanding || 0))

  // Overdue stats
  const overdueCount = Number(overdueAggRaw[0]?.count || 0)
  const overdueAmount = Math.max(0, Number(overdueAggRaw[0]?.amount || 0))

  // Filter top overdue invoices (where amountPaid < total)
  const overdueInvoices = topOverdueInvoices
    .filter((inv) => Number(inv.amountPaid) < Number(inv.total))
    .map((inv) => {
      const balanceDue = Math.max(0, Number(inv.total) - Number(inv.amountPaid))
      const daysOverdue = Math.max(1, differenceInDays(now, new Date(inv.dueDate)))

      return {
        id: inv.id,
        seq: inv.seq,
        number: formatInvoiceNumber(inv.seq),
        customerName: inv.customer.user.name,
        customerEmail: inv.customer.user.email,
        companyName: inv.customer.companyName || 'Subscriber',
        planName: inv.subscription.plan.name,
        issueDate: formatDate(inv.issueDate),
        dueDate: formatDate(inv.dueDate),
        daysOverdue,
        total: Number(inv.total),
        formattedTotal: formatCurrency(inv.total),
        amountPaid: Number(inv.amountPaid),
        formattedAmountPaid: formatCurrency(inv.amountPaid),
        balanceDue,
        formattedBalanceDue: formatCurrency(balanceDue),
      }
    })

  // Format revenue by month for Recharts bar chart
  let monthlyRevenue = revenueByMonthRaw.map((row) => ({
    month: row.month,
    label: row.label,
    revenue: Number(row.revenue || 0),
    formattedRevenue: formatCurrency(Number(row.revenue || 0)),
  }))

  // If fewer than 6 months recorded, fill preceding months with 0 so the chart displays nicely
  if (monthlyRevenue.length < 6) {
    const monthsMap = new Map(monthlyRevenue.map((m) => [m.month, m]))
    const filled: typeof monthlyRevenue = []

    for (let i = 5; i >= 0; i--) {
      const targetDate = subMonths(now, i)
      const key = format(targetDate, 'yyyy-MM')
      const label = format(targetDate, 'MMM yyyy')

      if (monthsMap.has(key)) {
        filled.push(monthsMap.get(key)!)
      } else {
        filled.push({
          month: key,
          label,
          revenue: 0,
          formattedRevenue: '₹0.00',
        })
      }
    }
    monthlyRevenue = filled
  }

  // Format subscriptions by status breakdown
  const statusColorMap: Record<string, string> = {
    ACTIVE: '#10b981', // Emerald
    CONFIRMED: '#3b82f6', // Blue
    QUOTATION: '#8b5cf6', // Violet
    DRAFT: '#64748b', // Slate
    CLOSED: '#f43f5e', // Rose
  }

  const totalSubscriptions = subsByStatusRaw.reduce((acc, row) => acc + row._count.id, 0)
  const subscriptionsByStatus = subsByStatusRaw.map((row) => {
    const count = row._count.id
    const percentage = totalSubscriptions > 0 ? Math.round((count / totalSubscriptions) * 100) : 0
    return {
      status: row.status,
      count,
      percentage,
      color: statusColorMap[row.status] || '#8978ff',
    }
  })

  // Customers for filter selector
  const customers = customersList.map((c) => ({
    id: c.id,
    name: c.user.name,
    email: c.user.email,
    company: c.companyName || '',
    displayName: `${c.user.name}${c.companyName ? ` (${c.companyName})` : ''}`,
  }))

  return {
    metrics: {
      activeSubscriptions: activeSubsCount,
      mrr,
      formattedMrr: formatCurrency(mrr),
      revenueCollected,
      formattedRevenueCollected: formatCurrency(revenueCollected),
      outstanding,
      formattedOutstanding: formatCurrency(outstanding),
      overdueInvoicesCount: overdueCount,
      overdueAmount,
      formattedOverdueAmount: formatCurrency(overdueAmount),
      totalSubscriptions,
    },
    charts: {
      monthlyRevenue,
      subscriptionsByStatus,
    },
    overdueInvoices,
    customers,
  }
})
