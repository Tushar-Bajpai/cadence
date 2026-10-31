import { NextRequest } from 'next/server'
import { apiHandler } from '@/lib/api'
import { db } from '@/lib/db'
import { SubStatus, InvoiceStatus } from '@prisma/client'
import { formatCurrency, formatSubNumber, formatInvoiceNumber } from '@/lib/format'

export const dynamic = 'force-dynamic'

export const GET = apiHandler(null, async (req: NextRequest) => {
  const now = new Date()

  // 1. Fetch aggregate metrics
  const [
    activeSubs,
    totalSubsCount,
    allInvoices,
    recentInvoicesRaw,
    recentSubsRaw,
  ] = await Promise.all([
    // Active subscriptions with lines to calculate MRR
    db.subscription.findMany({
      where: { status: SubStatus.ACTIVE },
      include: {
        plan: true,
        lines: true,
      },
    }),

    // Total subscriptions count
    db.subscription.count(),

    // Invoices for status breakdown and financials
    db.invoice.findMany({
      select: {
        id: true,
        status: true,
        dueDate: true,
        total: true,
        amountPaid: true,
      },
    }),

    // Recent invoices for Billing History table
    db.invoice.findMany({
      take: 8,
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
      },
    }),

    // Recent subscriptions
    db.subscription.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        plan: true,
      },
    }),
  ])

  // Calculate MRR from active subscriptions
  let mrr = 0
  for (const sub of activeSubs) {
    const subTotal = sub.lines.reduce((acc, line) => acc + Number(line.amount), 0)
    if (sub.plan.billingPeriod === 'YEARLY') {
      mrr += subTotal / 12
    } else if (sub.plan.billingPeriod === 'WEEKLY') {
      mrr += subTotal * 4.33
    } else if (sub.plan.billingPeriod === 'DAILY') {
      mrr += subTotal * 30
    } else {
      mrr += subTotal
    }
  }

  // Invoice calculations
  let totalRevenue = 0
  let overdueAmount = 0
  let overdueCount = 0
  let paidCount = 0

  for (const inv of allInvoices) {
    const total = Number(inv.total)
    const paid = Number(inv.amountPaid)
    totalRevenue += paid

    if (inv.status === InvoiceStatus.PAID) {
      paidCount++
    } else if (inv.status === InvoiceStatus.CONFIRMED) {
      if (new Date(inv.dueDate) < now) {
        overdueCount++
        overdueAmount += Math.max(0, total - paid)
      }
    }
  }

  const invoicedTotalSum = allInvoices.reduce((acc, inv) => acc + Number(inv.total), 0)
  const collectionRate = invoicedTotalSum > 0 ? (totalRevenue / invoicedTotalSum) * 100 : 100

  // Format recent invoices for table
  const recentInvoices = recentInvoicesRaw.map((inv) => ({
    id: inv.id,
    number: formatInvoiceNumber(inv.seq),
    date: inv.issueDate.toISOString(),
    dueDate: inv.dueDate.toISOString(),
    description: `${inv.subscription.plan.name} – ${inv.customer.user.name}`,
    customerName: inv.customer.user.name,
    customerEmail: inv.customer.user.email,
    planName: inv.subscription.plan.name,
    amount: Number(inv.total),
    amountPaid: Number(inv.amountPaid),
    status:
      inv.status === InvoiceStatus.CONFIRMED && new Date(inv.dueDate) < now
        ? 'OVERDUE'
        : inv.status,
  }))

  const recentSubscriptions = recentSubsRaw.map((sub) => ({
    id: sub.id,
    number: formatSubNumber(sub.seq),
    customerName: sub.customer.user.name,
    customerEmail: sub.customer.user.email,
    planName: sub.plan.name,
    billingPeriod: sub.plan.billingPeriod,
    status: sub.status,
    isPaused: sub.isPaused,
    startDate: sub.startDate.toISOString(),
    nextBillingDate: sub.nextBillingDate ? sub.nextBillingDate.toISOString() : null,
  }))

  return {
    mrr,
    formattedMrr: formatCurrency(mrr),
    activeSubscriptionsCount: activeSubs.length,
    totalSubscriptionsCount: totalSubsCount,
    totalInvoicesCount: allInvoices.length,
    paidInvoicesCount: paidCount,
    overdueInvoicesCount: overdueCount,
    overdueAmount,
    formattedOverdueAmount: formatCurrency(overdueAmount),
    totalRevenue,
    formattedTotalRevenue: formatCurrency(totalRevenue),
    collectionRate: Math.round(collectionRate * 10) / 10,
    recentInvoices,
    recentSubscriptions,
  }
})

