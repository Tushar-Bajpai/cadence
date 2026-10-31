import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * Lightweight keep-alive endpoint for Neon Serverless PostgreSQL.
 * Executes a sub-millisecond `SELECT 1` query to prevent the serverless
 * compute instance from suspending after 5 minutes of inactivity.
 */
export async function GET() {
  try {
    const start = performance.now()
    await db.$queryRaw`SELECT 1 as keepalive`
    const durationMs = Math.round(performance.now() - start)

    return NextResponse.json({
      status: 'active',
      database: 'connected',
      latencyMs: durationMs,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'error',
        database: 'unreachable',
        error: err?.message || 'Keep-alive ping failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
