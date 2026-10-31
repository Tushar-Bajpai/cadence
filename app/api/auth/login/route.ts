import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { setSessionCookie, signSession } from '@/lib/auth'
import { loginSchema } from '@/lib/validators'
import { apiHandler } from '@/lib/api'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const DEMO_FALLBACK_USERS: Record<string, {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER'
  customerId?: string
}> = {
  'admin@cadence.dev': {
    id: 'cmvvys99z0000ih5gw7x9v6zp',
    email: 'admin@cadence.dev',
    name: 'Cadence Administrator',
    role: 'ADMIN',
  },
  'robert.fox@example.com': {
    id: 'cmvvzp8fx0003it1tz1kdxzfx',
    email: 'robert.fox@example.com',
    name: 'Robert Fox',
    role: 'CUSTOMER',
    customerId: 'cmvvzp8fx0004it1t9x3pxysm',
  },
  'staff@cadence.dev': {
    id: 'cmvvzp86m0000it1ti48lsc8a',
    email: 'staff@cadence.dev',
    name: 'Cadence Operations Staff',
    role: 'STAFF',
  },
}

export async function POST(req: Request) {
  return apiHandler(null, async (req) => {
    const data = loginSchema.parse(await req.json())

    const isDemoAccount = Boolean(DEMO_FALLBACK_USERS[data.email]) && data.password === 'Admin@1234'
    let user: any = null

    try {
      if (isDemoAccount) {
        // For 1-click demo logins, race with a 2-second timeout so a sleeping Neon DB never freezes the UI
        const dbLookup = db.user.findUnique({
          where: { email: data.email },
          include: { customer: true },
        })
        const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000))
        user = await Promise.race([dbLookup, timeout])
      } else {
        user = await db.user.findUnique({
          where: { email: data.email },
          include: { customer: true },
        })
      }
    } catch (dbErr) {
      console.warn('[auth/login] Database lookup unavailable, checking demo users:', dbErr)
    }

    // If user not in DB or DB unreachable, check known demo users
    if (!user) {
      const demoUser = DEMO_FALLBACK_USERS[data.email]
      if (demoUser && data.password === 'Admin@1234') {
        const token = await signSession({
          userId: demoUser.id,
          email: demoUser.email,
          name: demoUser.name,
          role: demoUser.role,
          customerId: demoUser.customerId,
        })
        await setSessionCookie(token)

        return {
          user: {
            id: demoUser.id,
            name: demoUser.name,
            email: demoUser.email,
            role: demoUser.role,
            customerId: demoUser.customerId ?? null,
          },
        }
      }

      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password via bcrypt or allow demo password for demo users
    const isDemoPassword = data.password === 'Admin@1234' && Boolean(DEMO_FALLBACK_USERS[data.email])
    const valid = isDemoPassword || (await bcrypt.compare(data.password, user.passwordHash))

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
