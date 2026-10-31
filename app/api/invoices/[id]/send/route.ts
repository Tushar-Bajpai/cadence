import { NextRequest } from 'next/server'
import { apiHandler, ApiContext } from '@/lib/api'
import { db } from '@/lib/db'
import { InvoiceStatus } from '@prisma/client'
import { sendMail } from '@/lib/mailer'
import { formatInvoiceNumber, formatCurrency, formatDate } from '@/lib/format'

export const dynamic = 'force-dynamic'

// Email the invoice summary to the customer with a portal link, and stamp
// sentAt (once). Only DRAFT/CONFIRMED invoices can be sent.
export const POST = apiHandler(['ADMIN', 'STAFF'], async (
  req: NextRequest,
  session,
  context?: ApiContext
) => {
  const params = await context?.params
  const idOrSeq = params?.id as string
  if (!idOrSeq) throw new Error('Invoice ID is required')

  const isNumeric = /^\d+$/.test(idOrSeq)
  const invoice = await db.invoice.findFirst({
    where: isNumeric ? { seq: parseInt(idOrSeq, 10) } : { id: idOrSeq },
    include: {
      customer: { include: { user: true } },
      subscription: { include: { plan: true } },
      lines: true,
      discountLines: true,
    },
  })
  if (!invoice) throw new Error('Invoice not found')

  if (invoice.status === InvoiceStatus.PAID) {
    throw new Error('A paid invoice has no reason to be sent')
  }
  if (invoice.status === InvoiceStatus.CANCELLED) {
    throw new Error('A cancelled invoice cannot be sent')
  }

  const appUrl = process.env.APP_URL || 'http://localhost:8000'
  const portalLink = `${appUrl}/portal/invoices/${invoice.id}`
  const number = formatInvoiceNumber(invoice.seq)
  const name = invoice.customer.user.name
  const total = formatCurrency(invoice.total)
  const due = formatDate(invoice.dueDate)

  const linesHtml = [
    ...invoice.lines.map(
      (l) =>
        `<tr><td>${l.description}</td><td align="right">${l.quantity} × ${formatCurrency(
          l.unitPrice
        )}</td><td align="right">${formatCurrency(l.amount)}</td></tr>`
    ),
    ...invoice.discountLines.map(
      (d) =>
        `<tr><td style="color:#7c3aed">Discount: ${d.label}</td><td align="right"></td><td align="right" style="color:#7c3aed">−${formatCurrency(
          d.amount
        )}</td></tr>`
    ),
  ].join('')

  const text = `Hi ${name},

Invoice ${number} was issued for ${invoice.subscription.plan.name}.

Amount due: ${formatCurrency(invoice.total)}
Due date: ${due}

View the invoice: ${portalLink}

— Cadence by CodeLifters`

  const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px">
  <p>Hi <strong>${name}</strong>,</p>
  <p>Invoice <strong>${number}</strong> for <strong>${invoice.subscription.plan.name}</strong>.</p>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    <tr><td style="padding:4px 0;color:#555">Issue date</td><td align="right">${formatDate(invoice.issueDate)}</td></tr>
    <tr><td style="padding:4px 0;color:#555">Due date</td><td align="right">${due}</td></tr>
    <tr><td style="padding:8px 0;border-top:1px solid #eee"></td><td align="right" style="border-top:1px solid #eee"></td></tr>
    ${linesHtml}
    <tr><td style="padding:8px 0;border-top:2px solid #222;font-weight:bold">Total due</td>
        <td align="right" style="border-top:2px solid #222;font-weight:bold">${total}</td></tr>
  </table>
  <p style="margin-top:20px">
    <a href="${portalLink}" style="background:#8978ff;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:bold">View invoice</a>
  </p>
  <p style="color:#777;font-size:12px">Cadence by CodeLifters</p>
</div>`

  await sendMail({
    to: invoice.customer.user.email,
    subject: `Invoice ${number} — ${formatCurrency(invoice.total)} due`,
    text,
    html,
  })

  if (!invoice.sentAt) {
    await db.invoice.update({
      where: { id: invoice.id },
      data: { sentAt: new Date() },
    })
  }

  return {
    success: true,
    message: `Invoice ${number} sent to ${invoice.customer.user.email}`,
    sentAt: new Date().toISOString(),
  }
})
