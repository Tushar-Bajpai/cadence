import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api'
import { runBillingBatch } from '@/lib/billing-run'

export const dynamic = 'force-dynamic'

// Admin/staff only: executes the invoicing batch.
export const POST = apiHandler(['ADMIN', 'STAFF'], async (req: NextRequest) => {
  let batchSize = 100
  let targetDate = new Date()

  try {
    const body = await req.json()
    if (body.batchSize !== undefined) {
      batchSize = Number(body.batchSize)
      if (!Number.isFinite(batchSize) || batchSize < 1 || batchSize > 500) {
        return NextResponse.json(
          { error: 'batchSize must be a number between 1 and 500' },
          { status: 400 }
        )
      }
    }
    if (body.targetDate !== undefined) {
      targetDate = new Date(body.targetDate)
      if (isNaN(targetDate.getTime())) {
        return NextResponse.json(
          { error: 'targetDate must be a valid ISO date string' },
          { status: 400 }
        )
      }
    }
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

