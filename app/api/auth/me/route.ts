import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apiHandler } from '@/lib/api'

export const runtime = 'nodejs'

// Returns the current session's user, or 401 when not authenticated.
export async function GET(req: Request) {
  return apiHandler(null, async (_req, session) => {
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    let user: any = null
    try {
      user = await db.user.findUnique({
        where: { id: session.userId },
        include: { customer: true },
      })
    } catch (err) {
      console.warn('[auth/me] DB lookup failed, using session claims:', err)
    }

    if (!user) {
      // Safe fallback to verified signed JWT session claims
      return {
        user: {
          id: session.userId,
          name: session.name || session.email.split('@')[0],
          email: session.email,
          role: session.role,
          customerId: session.customerId ?? null,
        },
      }
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        customerId: user.customer?.id ?? null,
        createdAt: user.createdAt,
      },
    }
  })(req)
}
