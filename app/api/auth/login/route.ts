import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { setSessionCookie, signSession } from '@/lib/auth'
import { loginSchema } from '@/lib/validators'
import { apiHandler } from '@/lib/api'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  return apiHandler(null, async (req) => {
    const data = loginSchema.parse(await req.json())

    const user = await db.user.findUnique({
      where: { email: data.email },
      include: { customer: true },
    })

    // Same generic error for unknown email / wrong password (no enumeration).
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const valid = await bcrypt.compare(data.password, user.passwordHash)
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const token = await signSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      customerId: user.customer?.id,
    })
    await setSessionCookie(token)

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        customerId: user.customer?.id ?? null,
      },
    }
  })(req)
}
