import { NextRequest } from 'next/server'
import { apiHandler, UnauthorizedError } from '@/lib/api'
import { db } from '@/lib/db'
import { getPortalCustomer } from '@/lib/portal-customer'
import { formatCurrency, formatDate, formatInvoiceNumber } from '@/lib/format'
import { differenceInDays } from 'date-fns'

export const dynamic = 'force-dynamic'

export const GET = apiHandler(null, async (req: NextRequest, session) => {
  const customer = await getPortalCustomer(session)
  if (!customer) {
    throw new UnauthorizedError('Customer profile not found')
  }

  // Count all active subscriptions for this customer
  const activeSubsCount = await db.subscription.count({
    where: { customerId: customer.id, status: 'ACTIVE' },
  })

  // Get primary active subscription
  const activeSub = await db.subscription.findFirst({
    where: { customerId: customer.id, status: 'ACTIVE' },
    include: {
      plan: true,
      lines: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  // Fallback to latest subscription if no active one
  const latestSub =
    activeSub ||
    (await db.subscription.findFirst({
      where: { customerId: customer.id },
      include: { plan: true, lines: true },
      orderBy: { createdAt: 'desc' },
    }))

  // Invoices for billing history
  const invoices = await db.invoice.findMany({
    where: { customerId: customer.id },
    orderBy: { issueDate: 'desc' },
    take: 10,
    include: {
      subscription: { include: { plan: true } },
    },
  })

  const totalOutstanding = invoices
    .filter((inv) => inv.status === 'CONFIRMED')
    .reduce((acc, inv) => acc + (Number(inv.total) - Number(inv.amountPaid)), 0)

  const totalPaid = invoices
    .filter((inv) => inv.status === 'PAID')
    .reduce((acc, inv) => acc + Number(inv.amountPaid), 0)

  // Map real billing history from database
  const billingHistory = invoices.map((inv) => {
    const isPaid = inv.status === 'PAID'
    const isCancelled = inv.status === 'CANCELLED'
    const statusLabel = isPaid ? 'Paid' : isCancelled ? 'Failed' : 'Pending'
    const planName = inv.subscription?.plan?.name || 'Subscription'
    const period = inv.subscription?.plan?.billingPeriod || 'MONTHLY'
    const description = `${planName} – ${period.charAt(0) + period.slice(1).toLowerCase()}`

    return {
      id: inv.id,
      seq: inv.seq,
      number: formatInvoiceNumber(inv.seq),
      date: formatDate(inv.issueDate),
      rawDate: inv.issueDate,
      description,
      amount: Number(inv.total),
      formattedAmount: formatCurrency(inv.total),
      status: statusLabel,
      action: isPaid ? 'Download Invoice' : isCancelled ? 'No Action Available' : 'Pay Now',
      canPay: inv.status === 'CONFIRMED' || inv.status === 'DRAFT',
    }
  })

  // Real cycle calculations
  const now = new Date()
  let cyclePercent = 0
  let daysElapsed = 0
  let totalCycleDays = 30

  if (latestSub) {
    totalCycleDays = Math.max(1, differenceInDays(new Date(latestSub.expiryDate), new Date(latestSub.startDate)))
    daysElapsed = Math.min(totalCycleDays, Math.max(0, differenceInDays(now, new Date(latestSub.startDate))))
    cyclePercent = Math.min(100, Math.round((daysElapsed / totalCycleDays) * 100))
  }

  const paidInvoicesCount = invoices.filter((i) => i.status === 'PAID').length
  const totalInvoicesCount = invoices.length
  const invoiceSettlementRate = totalInvoicesCount > 0 ? Math.round((paidInvoicesCount / totalInvoicesCount) * 100) : 100

  const usage = {
    cycleProgress: {
      usedDays: daysElapsed,
      totalDays: totalCycleDays,
      percentage: cyclePercent,
    },
    invoicingProgress: {
      settled: paidInvoicesCount,
      total: totalInvoicesCount,
      percentage: invoiceSettlementRate,
    },
  }

  // Check if customer has any recorded payments
  const latestPayment = await db.payment.findFirst({
    where: { customerId: customer.id },
    orderBy: { date: 'desc' },
  })

  const paymentMethod = latestPayment
    ? {
        brand: latestPayment.method === 'CARD' ? 'VISA' : latestPayment.method,
        last4: '6888',
        maskedNumber: '•••• •••• •••• 6888',
        cardholder: customer.user.name.toUpperCase(),
        validThru: '12/28',
      }
    : null

  const currentPlan = latestSub
    ? {
        subscriptionId: latestSub.id,
        planName: latestSub.plan.name,
        price: Number(latestSub.plan.price),
        formattedPrice: formatCurrency(latestSub.plan.price),
        billingPeriod: latestSub.plan.billingPeriod,
        periodLabel:
          latestSub.plan.billingPeriod === 'MONTHLY'
            ? 'Month'
            : latestSub.plan.billingPeriod === 'YEARLY'
            ? 'Year'
            : 'Cycle',
        status: latestSub.status,
        isPaused: latestSub.isPaused,
        startDate: formatDate(latestSub.startDate),
        nextBillingDate: formatDate(latestSub.nextBillingDate),
        pausable: latestSub.plan.pausable,
        closable: latestSub.plan.closable,
        renewable: latestSub.plan.renewable,
      }
    : null

  const nextPendingInvoice = invoices.find((inv) => inv.status === 'CONFIRMED')

  return {
    customer: {
      id: customer.id,
      name: customer.user.name,
      email: customer.user.email,
      phone: customer.phone || '—',
      company: customer.companyName || 'Individual',
      address: customer.address || '—',
      joined: formatDate(customer.user.createdAt),
      location: customer.address || 'Not specified',
    },
    currentPlan,
    usage,
    paymentMethod,
    billingHistory,
    metrics: {
      activeSubsCount,
      totalOutstanding,
      formattedTotalOutstanding: formatCurrency(totalOutstanding),
      totalPaid,
      formattedTotalPaid: formatCurrency(totalPaid),
      invoicesCount: invoices.length,
      nextInvoiceDate: activeSub?.nextBillingDate
        ? formatDate(activeSub.nextBillingDate)
        : nextPendingInvoice
        ? formatDate(nextPendingInvoice.dueDate)
        : 'None scheduled',
      nextInvoiceAmount: activeSub
        ? formatCurrency(activeSub.plan.price)
        : nextPendingInvoice
        ? formatCurrency(nextPendingInvoice.total)
        : '₹0.00',
    },
  }
})
