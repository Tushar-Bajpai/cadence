import { NextRequest } from 'next/server'
import { apiHandler, ApiContext, NotFoundError, UnauthorizedError } from '@/lib/api'
import { db } from '@/lib/db'
import { getPortalCustomer } from '@/lib/portal-customer'
import { formatInvoiceNumber, formatCurrency, formatDate } from '@/lib/format'

export const dynamic = 'force-dynamic'

export const GET = apiHandler(null, async (req: NextRequest, session, context?: ApiContext) => {
  const customer = await getPortalCustomer(session)
  if (!customer) {
    throw new UnauthorizedError('Customer not authenticated')
  }

  const params = await context?.params
  const idOrSeq = params?.id as string

  if (!idOrSeq) {
    throw new NotFoundError('Invoice ID is required')
  }

  const isNumeric = /^\d+$/.test(idOrSeq)

  // STRICT customer scoping: query must match customerId
  const invoice = await db.invoice.findFirst({
    where: {
      ...(isNumeric ? { seq: parseInt(idOrSeq, 10) } : { id: idOrSeq }),
      customerId: customer.id,
    },
    include: {
      customer: {
        include: {
          user: true,
        },
      },
      subscription: {
        include: {
          plan: true,
        },
      },
      lines: true,
      discountLines: true,
      payments: {
        orderBy: { date: 'desc' },
      },
    },
  })

  // Customer A guessing Customer B's invoice URL returns 404!
  if (!invoice) {
    throw new NotFoundError('Invoice not found')
  }

  const latestPayment = invoice.payments[0]
  const paidAt = latestPayment ? formatDate(latestPayment.date) : null
  const isPaid = invoice.status === 'PAID'
  const isOverdue = invoice.status === 'CONFIRMED' && new Date(invoice.dueDate) < new Date() && Number(invoice.amountPaid) < Number(invoice.total)

  return {
    id: invoice.id,
    seq: invoice.seq,
    number: formatInvoiceNumber(invoice.seq),
    title: formatInvoiceNumber(invoice.seq),
    status: invoice.status,
    isPaid,
    isOverdue,
    paidBannerText: isPaid
      ? (paidAt ? `Invoice Paid on ${paidAt}` : 'Invoice Paid')
      : isOverdue
      ? 'Invoice Overdue — Payment Action Required'
      : 'Payment Pending',
    issuedOn: formatDate(invoice.issueDate),
    dueOn: formatDate(invoice.dueDate),
    periodStart: formatDate(invoice.periodStart),
    periodEnd: formatDate(invoice.periodEnd),
    from: {
      name: 'Cadence Subscriptions Inc.',
      address: '2972 Westheimer Rd. Santa Ana, California',
      email: 'billing@cadence.dev',
      phone: '+1 (800) 555-CADENCE',
    },
    to: {
      name: invoice.customer.user.name,
      email: invoice.customer.user.email,
      company: invoice.customer.companyName || 'Subscriber',
      phone: invoice.customer.phone || '—',
      address: invoice.customer.address || '—',
    },
    subscriptionId: invoice.subscriptionId,
    subscriptionNumber: `SUB-${String(invoice.subscription.seq).padStart(6, '0')}`,
    planName: invoice.subscription?.plan?.name || 'Standard Plan',
    items: invoice.lines.map((line) => ({
      id: line.id,
      description: line.description,
      unitPrice: Number(line.unitPrice),
      formattedUnitPrice: formatCurrency(line.unitPrice),
      quantity: line.quantity,
      amount: Number(line.amount),
      formattedAmount: formatCurrency(line.amount),
    })),
    subtotal: Number(invoice.subtotal),
    formattedSubtotal: formatCurrency(invoice.subtotal),
    taxTotal: Number(invoice.taxTotal),
    formattedTaxTotal: formatCurrency(invoice.taxTotal),
    discountTotal: Number(invoice.discountTotal),
    formattedDiscountTotal: formatCurrency(invoice.discountTotal),
    discountLines: invoice.discountLines.map((dl) => ({
      id: dl.id,
      label: dl.label,
      amount: Number(dl.amount),
      formattedAmount: formatCurrency(dl.amount),
    })),
    total: Number(invoice.total),
    formattedTotal: formatCurrency(invoice.total),
    amountPaid: Number(invoice.amountPaid),
    formattedAmountPaid: formatCurrency(invoice.amountPaid),
    balanceDue: Math.max(0, Number(invoice.total) - Number(invoice.amountPaid)),
    formattedBalanceDue: formatCurrency(
      Math.max(0, Number(invoice.total) - Number(invoice.amountPaid))
    ),
    payments: invoice.payments.map((p) => ({
      id: p.id,
      method: p.method,
      amount: Number(p.amount),
      formattedAmount: formatCurrency(p.amount),
      date: formatDate(p.date),
      note: p.note,
    })),
    canPay: invoice.status === 'CONFIRMED' || invoice.status === 'DRAFT',
  }
})

