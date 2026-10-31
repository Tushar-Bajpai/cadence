import { NextRequest } from 'next/server'
import { apiHandler } from '@/lib/api'
import { db } from '@/lib/db'
import { getPortalCustomer } from '@/lib/portal-customer'
import { formatCurrency, formatDate, formatInvoiceNumber } from '@/lib/format'

export const dynamic = 'force-dynamic'

export const GET = apiHandler(null, async (req: NextRequest, session) => {
  const customer = await getPortalCustomer(session)
  if (!customer) {
    throw new Error('Customer profile not found')
  }

  // Get active subscription and plan
  const activeSub = await db.subscription.findFirst({
    where: { customerId: customer.id, status: 'ACTIVE' },
    include: {
      plan: true,
      lines: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  // Fallback to any subscription if no active one
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

  // Map billing history matching screenshot 1
  const billingHistory = invoices.map((inv) => {
    const isPaid = inv.status === 'PAID'
    const isCancelled = inv.status === 'CANCELLED'
    const statusLabel = isPaid ? 'Paid' : isCancelled ? 'Failed' : 'Pending'
    const planName = inv.subscription?.plan?.name || 'Pro Plan'
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

  // Simulated usage numbers for subscription overview
  const usage = {
    apiRequests: {
      used: 8500,
      total: 10000,
      percentage: 85,
    },
    storage: {
      used: 2,
      total: 5,
      unit: 'GB',
      percentage: 40,
    },
  }

  // Payment method matching screenshot 1 (VISA 1520 0100 3356 6888)
  const paymentMethod = {
    brand: 'VISA',
    last4: '6888',
    maskedNumber: '1520 0100 3356 6888',
    cardholder: customer.user.name.toUpperCase(),
    validThru: '12/28',
  }

  const currentPlan = latestSub
    ? {
        subscriptionId: latestSub.id,
        planName: latestSub.plan.name,
        price: Number(latestSub.plan.price),
        formattedPrice: formatCurrency(latestSub.plan.price),
        billingPeriod: latestSub.plan.billingPeriod,
        periodLabel: latestSub.plan.billingPeriod === 'MONTHLY' ? 'Month' : latestSub.plan.billingPeriod === 'YEARLY' ? 'Year' : 'Billing Cycle',
        status: latestSub.status,
        isPaused: latestSub.isPaused,
        nextBillingDate: formatDate(latestSub.nextBillingDate),
        pausable: latestSub.plan.pausable,
        closable: latestSub.plan.closable,
        renewable: latestSub.plan.renewable,
      }
    : {
        subscriptionId: null,
        planName: 'Pro Plan',
        price: 29.0,
        formattedPrice: '$29.00',
        billingPeriod: 'MONTHLY',
        periodLabel: 'Month',
        status: 'ACTIVE',
        isPaused: false,
        nextBillingDate: '01 Sep 2026',
        pausable: true,
        closable: true,
        renewable: true,
      }

  return {
    customer: {
      id: customer.id,
      name: customer.user.name,
      email: customer.user.email,
      phone: customer.phone || '(704) 555-0127',
      company: customer.companyName || 'SaaS Patterns',
      address: customer.address || '2972 Westheimer Rd. Santa Ana, Illinois 85486',
      joined: formatDate(customer.user.createdAt),
      location: 'Santa Ana, CA / Sydney',
    },
    currentPlan,
    usage,
    paymentMethod,
    billingHistory,
    metrics: {
      activeSubsCount: activeSub ? 1 : 0,
      totalOutstanding,
      formattedTotalOutstanding: formatCurrency(totalOutstanding),
      totalPaid,
      formattedTotalPaid: formatCurrency(totalPaid),
      invoicesCount: invoices.length,
    },
  }
})
