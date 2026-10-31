import { NextRequest } from 'next/server'
import { apiHandler, ApiContext, NotFoundError } from '@/lib/api'
import { db } from '@/lib/db'
import { formatInvoiceNumber, formatCurrency, formatDate } from '@/lib/format'

export const dynamic = 'force-dynamic'

export const GET = apiHandler(null, async (req: NextRequest, session, context?: ApiContext) => {
  const params = await context?.params
  const idOrSeq = params?.id as string

  if (!idOrSeq) throw new NotFoundError('Invoice ID is required')

  // Support lookup by cuid id or sequence number
  const isNumeric = /^\d+$/.test(idOrSeq)

  // Defense-in-depth: If the caller is a customer, restrict strictly to their invoices
  const customerFilter = session?.role === 'CUSTOMER' && session.customerId
    ? { customerId: session.customerId }
    : {}

  const invoice = await db.invoice.findFirst({
    where: {
      ...(isNumeric ? { seq: parseInt(idOrSeq, 10) } : { id: idOrSeq }),
      ...customerFilter,
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

  if (!invoice) {
    throw new NotFoundError('Invoice not found')
  }

  const latestPayment = invoice.payments[0]
  const paidAt = latestPayment ? formatDate(latestPayment.date) : null

  return {
    id: invoice.id,
    seq: invoice.seq,
    number: formatInvoiceNumber(invoice.seq),
    title: formatInvoiceNumber(invoice.seq),
    status: invoice.status,
    isPaid: invoice.status === 'PAID',
    paidBannerText:
      invoice.status === 'PAID'
        ? (paidAt ? `Invoice Paid on ${paidAt}` : 'Invoice Paid')
        : invoice.status === 'CONFIRMED' && new Date(invoice.dueDate) < new Date()
        ? 'Invoice Overdue — Payment Action Required'
        : 'Payment Pending',
    issuedOn: formatDate(invoice.issueDate),
    dueOn: formatDate(invoice.dueDate),
    from: {
      name: 'CodeLifters Cadence Billing',
      address: '2972 Westheimer Rd. Santa Ana, California',
      email: 'billing@codelifters.dev',
      phone: '+1 (800) 555-CADENCE',
    },
    to: {
      name: invoice.customer.user.name,
      email: invoice.customer.user.email,
      company: invoice.customer.companyName || 'Subscriber',
      phone: invoice.customer.phone || '—',
      address: invoice.customer.address || '—',
    },
    planName: `${invoice.subscription.plan.name} - ${formatCurrency(invoice.subscription.plan.price)}`,
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
      amount: Number(p.amount),
      formattedAmount: formatCurrency(p.amount),
      date: formatDate(p.date),
      method: p.method,
      note: p.note,
    })),
  }
})
