import { NextRequest } from 'next/server'
import { apiHandler } from '@/lib/api'
import { runBillingBatch } from '@/lib/billing-run'

export const dynamic = 'force-dynamic'

// Admin/staff only: executes the invoicing batch.
export const POST = apiHandler(['ADMIN', 'STAFF'], async (req: NextRequest) => {
  let batchSize = 100
  let targetDate = new Date()

  try {
    const body = await req.json()
    if (body.batchSize) batchSize = Number(body.batchSize)
    if (body.targetDate) targetDate = new Date(body.targetDate)
  } catch {
    // optional body
  }

  const result = await runBillingBatch(targetDate, batchSize)
  return {
    success: true,
    message: `Billing batch executed. Created ${result.created} invoices, skipped ${result.skipped}, failed ${result.failed}.`,
    ...result,
  }
})

