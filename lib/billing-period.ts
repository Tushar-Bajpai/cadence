import { addDays, addWeeks, addMonths, addYears } from 'date-fns'
import { BillingPeriod } from '@prisma/client'

export function addPeriod(date: Date, period: BillingPeriod): Date {
  const d = new Date(date)
  switch (period) {
    case 'DAILY':
      return addDays(d, 1)
    case 'WEEKLY':
      return addWeeks(d, 1)
    case 'MONTHLY':
      return addMonths(d, 1)
    case 'YEARLY':
      return addYears(d, 1)
    default:
      return addMonths(d, 1)
  }
}

