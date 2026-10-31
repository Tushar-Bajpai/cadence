import { db } from './db'
import { formatDate, formatInvoiceNumber, formatSubNumber, formatCurrency } from './format'

export interface ActivityEvent {
  id: string
  type: 'subscription' | 'invoice' | 'payment' | 'lifecycle'
  color: 'purple' | 'amber' | 'blue' | 'pink'
  actor: string
  action: string
  body?: string
}

export interface ActivityGroup {
  date: string
  events: ActivityEvent[]
}

export async function getCustomerActivity(customerId: string, actorName: string = 'Customer'): Promise<ActivityGroup[]> {
  const [subscriptions, invoices, payments] = await Promise.all([
    db.subscription.findMany({
      where: { customerId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    db.invoice.findMany({
      where: { customerId },
      include: { subscription: { include: { plan: true } } },
      orderBy: { issueDate: 'desc' },
      take: 10,
    }),
    db.payment.findMany({
      where: { customerId },
      include: { invoice: true },
      orderBy: { date: 'desc' },
      take: 10,
    }),
  ])

  type RawItem = {
    date: Date
    event: ActivityEvent
  }

  const rawList: RawItem[] = []

  // 1. Subscriptions
  for (const s of subscriptions) {
    rawList.push({
      date: s.createdAt,
      event: {
        id: `sub-${s.id}`,
        type: 'subscription',
        color: 'purple',
        actor: actorName,
        action: `subscribed to ${s.plan.name} (${formatSubNumber(s.seq)})`,
        body: `Initial billing period: ${s.plan.billingPeriod.toLowerCase()}. Next renewal on ${formatDate(s.nextBillingDate)}.`,
      },
    })

    if (s.isPaused) {
      rawList.push({
        date: s.nextBillingDate || s.createdAt,
        event: {
          id: `sub-paused-${s.id}`,
          type: 'lifecycle',
          color: 'amber',
          actor: actorName,
          action: `paused subscription ${formatSubNumber(s.seq)}`,
          body: `Recurring cycle put on hold. Contract terms remain preserved.`,
        },
      })
    }

    if (s.status === 'CLOSED') {
      rawList.push({
        date: s.expiryDate,
        event: {
          id: `sub-closed-${s.id}`,
          type: 'lifecycle',
          color: 'pink',
          actor: actorName,
          action: `closed subscription ${formatSubNumber(s.seq)}`,
          body: `Contract concluded under policy autoCloseOnEnd=${s.plan.autoCloseOnEnd}.`,
        },
      })
    }
  }

  // 2. Invoices
  for (const inv of invoices) {
    rawList.push({
      date: inv.issueDate,
      event: {
        id: `inv-${inv.id}`,
        type: 'invoice',
        color: 'blue',
        actor: 'Cadence Engine',
        action: `generated invoice ${formatInvoiceNumber(inv.seq)}`,
        body: `Total amount due: ${formatCurrency(inv.total)}. Due date: ${formatDate(inv.dueDate)}.`,
      },
    })
  }

  // 3. Payments
  for (const p of payments) {
    rawList.push({
      date: p.date,
      event: {
        id: `pay-${p.id}`,
        type: 'payment',
        color: 'purple',
        actor: actorName,
        action: `settled payment for ${formatInvoiceNumber(p.invoice.seq)}`,
        body: `Amount: ${formatCurrency(p.amount)} via ${p.method}. ${p.note ? `Note: ${p.note}` : ''}`,
      },
    })
  }

  // Sort by date descending
  rawList.sort((a, b) => b.date.getTime() - a.date.getTime())

  // Group by day string
  const groupsMap = new Map<string, ActivityEvent[]>()
  for (const item of rawList) {
    const dayStr = formatDate(item.date)
    if (!groupsMap.has(dayStr)) {
      groupsMap.set(dayStr, [])
    }
    groupsMap.get(dayStr)!.push(item.event)
  }

  return Array.from(groupsMap.entries()).map(([date, events]) => ({
    date,
    events,
  }))
}

