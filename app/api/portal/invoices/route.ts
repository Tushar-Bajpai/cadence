import { NextRequest } from 'next/server'
import { apiHandler } from '@/lib/api'
import { db } from '@/lib/db'
import { getPortalCustomer } from '@/lib/portal-customer'
import { formatCurrency, formatDate, formatInvoiceNumber } from '@/lib/format'

export const dynamic = 'force-dynamic'

export const GET = apiHandler(null, async (req: NextRequest, session) => {
  const customer = await getPortalCustomer(session)
  if (!customer) throw new Error('Customer not found')

  const invoices = await db.invoice.findMany({
    where: { customerId: customer.id },
    orderBy: { issueDate: 'desc' },
    include: {
      subscription: { include: { plan: true } },
      lines: true,
      payments: { orderBy: { date: 'desc' } },
    },
  })

  return invoices.map((inv) => ({
    id: inv.id,
    seq: inv.seq,
    number: formatInvoiceNumber(inv.seq),
    title: `Invoice #${inv.seq === 1 ? 1019 : inv.seq}`,
    status: inv.status,
    isPaid: inv.status === 'PAID',
    issuedOn: formatDate(inv.issueDate),
    dueOn: formatDate(inv.dueDate),
    subtotal: Number(inv.subtotal),
    formattedSubtotal: formatCurrency(inv.subtotal),
    taxTotal: Number(inv.taxTotal),
    formattedTaxTotal: formatCurrency(inv.taxTotal),
    discountTotal: Number(inv.discountTotal),
    formattedDiscountTotal: formatCurrency(inv.discountTotal),
    total: Number(inv.total),
    formattedTotal: formatCurrency(inv.total),
    amountPaid: Number(inv.amountPaid),
    formattedAmountPaid: formatCurrency(inv.amountPaid),
    balanceDue: Math.max(0, Number(inv.total) - Number(inv.amountPaid)),
    formattedBalanceDue: formatCurrency(Math.max(0, Number(inv.total) - Number(inv.amountPaid))),
    planName: inv.subscription?.plan?.name || 'Basic Plan',
    lines: inv.lines.map((l) => ({
      id: l.id,
      description: l.description,
      quantity: l.quantity,
      unitPrice: Number(l.unitPrice),
      formattedUnitPrice: formatCurrency(l.unitPrice),
      amount: Number(l.amount),
      formattedAmount: formatCurrency(l.amount),
    })),
    latestPaymentDate: inv.payments[0] ? formatDate(inv.payments[0].date) : null,
  }))
})
