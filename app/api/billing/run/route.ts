import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api'
import { runBillingBatch } from '@/lib/billing-run'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const runBillingInputSchema = z.object({
  batchSize: z.coerce.number().int().min(1).max(1000).default(100),
  targetDate: z.string().or(z.date()).optional(),
})

// Admin/staff only: executes the invoicing batch.
export const POST = apiHandler(['ADMIN', 'STAFF'], async (req: NextRequest) => {
  let parsed: { batchSize: number; targetDate?: string | Date } = { batchSize: 100 }

  try {

    const raw = await req.json()
    if (raw && typeof raw === 'object') {
      parsed = runBillingInputSchema.parse(raw)
    }
  } catch (e: any) {
    if (e instanceof z.ZodError) throw e
    // If empty body, defaults apply

  }

  const targetDate = parsed.targetDate ? new Date(parsed.targetDate) : new Date()
  const result = await runBillingBatch(targetDate, parsed.batchSize)
  return {
    success: true,
    message: `Billing batch executed. Created ${result.created} invoices, skipped ${result.skipped}, failed ${result.failed}.`,
    ...result,
  }
})

