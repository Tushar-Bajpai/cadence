import { NextRequest } from 'next/server'
import { apiHandler, ApiContext, ApiError } from '@/lib/api'
import { db } from '@/lib/db'
import { InvoiceStatus, Role } from '@prisma/client'
import { formatInvoiceNumber, formatCurrency, formatDate, formatDateTime } from '@/lib/format'
import { getPortalCustomer } from '@/lib/portal-customer'

export const dynamic = 'force-dynamic'

export const GET = apiHandler(null, async (
  req: NextRequest,
  session,
  context?: ApiContext
) => {
  if (!session) throw new ApiError(401, 'Authentication required')

  const params = await context?.params
  const idOrSeq = params?.id as string
  if (!idOrSeq) throw new ApiError(400, 'Invoice ID is required')

  // Support lookup by cuid id or sequence number
  const isNumeric = /^\d+$/.test(idOrSeq)

  const where = isNumeric ? { seq: parseInt(idOrSeq, 10) } : { id: idOrSeq }

  // Customers may only open their own invoices, even by guessing URLs.
  if (session.role === Role.CUSTOMER) {
    const customer = await getPortalCustomer(session)
    if (!customer) throw new ApiError(403, 'No customer profile linked to this account')
    Object.assign(where, { customerId: customer.id })
  } else if (session.role !== Role.ADMIN && session.role !== Role.STAFF) {
    throw new ApiError(403, 'Insufficient permissions')
  }

  const invoice = await db.invoice.findFirst({
    where,
    include: {
      customer: { include: { user: true } },
      subscription: { include: { plan: true } },
      lines: true,
      discountLines: true,
      payments: { orderBy: { date: 'desc' } },
    },
  })

  if (!invoice) throw new ApiError(404, 'Invoice not found')

  const now = new Date()
  const outstanding = Math.max(0, Number(invoice.total) - Number(invoice.amountPaid))
  const isOverdue =
    invoice.status === InvoiceStatus.CONFIRMED &&
    new Date(invoice.dueDate) < now &&
    outstanding > 0
  const latestPayment = invoice.payments[0]
  const paidAt = latestPayment ? formatDateTime(latestPayment.date) : null

  // What the customer is allowed to do next (drives the action buttons in the UI)
  const canConfirm = invoice.status === InvoiceStatus.DRAFT
  const canCancel = invoice.status === InvoiceStatus.DRAFT || invoice.status === InvoiceStatus.CONFIRMED
  const canPay = invoice.status === InvoiceStatus.CONFIRMED && outstanding > 0
  const canSend = invoice.status === InvoiceStatus.DRAFT || invoice.status === InvoiceStatus.CONFIRMED

  return {
    id: invoice.id,
    seq: invoice.seq,
    number: formatInvoiceNumber(invoice.seq),
    title: `Invoice #${formatInvoiceNumber(invoice.seq)}`,
    status: invoice.status,
    isPaid: invoice.status === InvoiceStatus.PAID,
    paidBannerText:
      invoice.status === InvoiceStatus.PAID
        ? `Invoice Paid${paidAt ? ` on ${paidAt}` : ''}`
        : isOverdue
        ? 'Invoice Overdue — Payment Action Required'
        : invoice.status === InvoiceStatus.DRAFT
        ? 'Draft — confirm before it can be paid'
        : invoice.status === InvoiceStatus.CANCELLED
        ? 'Invoice Cancelled'
        : 'Payment Pending',
    issuedOn: formatDate(invoice.issueDate),
    dueOn: formatDate(invoice.dueDate),
    period: `${formatDate(invoice.periodStart)} – ${formatDate(invoice.periodEnd)}`,
    sentAt: invoice.sentAt ? formatDateTime(invoice.sentAt) : null,
    from: {
      name: 'Cadence Billing',
      address: 'CodeLifters · 2118 Thornridge Cir. Syracuse, Connecticut 35624',
      email: 'billing@codelifters.dev',
      phone: '+1 (800) 555-CADENCE',
    },
    to: {
      name: invoice.customer.user.name,
      email: invoice.customer.user.email,
      company: invoice.customer.companyName || 'Independent Subscriber',
      phone: invoice.customer.phone || '—',
      address: invoice.customer.address || '—',
    },
    subscriptionNumber: `SUB-${String(invoice.subscription.seq).padStart(6, '0')}`,
    planName: invoice.subscription.plan.name,
    billingPeriod: invoice.subscription.plan.billingPeriod,
    items: invoice.lines.map((line) => ({
      id: line.id,
      description: line.description,
      unitPrice: Number(line.unitPrice),
      formattedUnitPrice: formatCurrency(line.unitPrice),
      quantity: line.quantity,
      taxAmount: Number(line.taxAmount),
      formattedTaxAmount: formatCurrency(line.taxAmount),
      amount: Number(line.amount),
      formattedAmount: formatCurrency(line.amount),
    })),
    discounts: invoice.discountLines.map((d) => ({
      id: d.id,
      label: d.label,
      amount: Number(d.amount),
      formattedAmount: formatCurrency(d.amount),
    })),
    subtotal: Number(invoice.subtotal),
    formattedSubtotal: formatCurrency(invoice.subtotal),
    taxTotal: Number(invoice.taxTotal),
    formattedTaxTotal: formatCurrency(invoice.taxTotal),
    discountTotal: Number(invoice.discountTotal),
    formattedDiscountTotal: formatCurrency(invoice.discountTotal),
    total: Number(invoice.total),
    formattedTotal: formatCurrency(invoice.total),
    amountPaid: Number(invoice.amountPaid),
    formattedAmountPaid: formatCurrency(invoice.amountPaid),
    balanceDue: outstanding,
    formattedBalanceDue: formatCurrency(outstanding),
    actions: {
      canConfirm,
      canCancel,
      canPay,
      canSend,
      canPrint: true,
    },
    payments: invoice.payments.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      formattedAmount: formatCurrency(p.amount),
      method: p.method,
      date: formatDate(p.date),
      note: p.note,
    })),
  }
})
