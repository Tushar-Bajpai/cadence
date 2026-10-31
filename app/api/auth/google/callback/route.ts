import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { setSessionCookie, signSession } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Completes the Google OAuth flow: code -> tokens -> userinfo -> session.
// Existing accounts sign in as-is (keeping their role). New emails become
// CUSTOMER users + customer rows (passwordHash: random & unusable — password
// login can be enabled later via the forgot-password OTP flow).
export async function GET(req: NextRequest) {
  const redirectFail = (code: string) =>
    NextResponse.redirect(new URL(`/auth?googleError=${code}`, req.url))

  try {
    const clientId = process.env.GOOGLE_AUTH_CLIENT_ID
    const secret =
      process.env.GOOGLE_AUTH_CLIENT_SECRET ?? process.env.GOOGLE_AUTH_PASSWORD
    if (!clientId || !secret) return redirectFail('unconfigured')

    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')

    const cookieStore = await cookies()
    const storedState = cookieStore.get('cadence_oauth_state')?.value

    // CSRF check + single use
    if (!code || !state || !storedState || state !== storedState) {
      return redirectFail('invalid_state')
    }

    const redirectUri = new URL('/api/auth/google/callback', process.env.APP_URL ?? req.url).toString()

    // Exchange the authorization code
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: secret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })
    if (!tokenRes.ok) return redirectFail('token_exchange')
    const tokens = (await tokenRes.json()) as { access_token?: string }
    if (!tokens.access_token) return redirectFail('token_exchange')

    // Fetch the verified profile (openid email must be verified by Google)
    const profileRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    if (!profileRes.ok) return redirectFail('profile')
    const profile = (await profileRes.json()) as {
      sub: string
      email?: string
      email_verified?: boolean
      name?: string
    }
    if (!profile.email) return redirectFail('no_email')
    if (!profile.email_verified) return redirectFail('unverified_email')

    const email = profile.email.trim().toLowerCase()
    const name = profile.name?.trim() || email.split('@')[0]

    // Find or create. Role of an existing account is preserved; new emails
    // always start as CUSTOMER with a Customer row.
    let user = await db.user.findUnique({
      where: { email },
      include: { customer: true },
    })

    if (!user) {
      user = await db.user.create({
        data: {
          name,
          email,
          passwordHash: randomBytes(32).toString('hex'), // unusable by design
          role: 'CUSTOMER',
          customer: { create: {} },
        },
        include: { customer: true },
      })
    }

    const token = await signSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      customerId: user.customer?.id,
    })
    await setSessionCookie(token)

    // Consume the state cookie
    cookieStore.delete('cadence_oauth_state')

    const destination =
      user.role === 'ADMIN' || user.role === 'STAFF' ? '/admin' : '/portal'
    return NextResponse.redirect(new URL(destination, req.url))
  } catch (err) {
    console.error('[auth:google-callback]', err)
    return redirectFail('server_error')
  }
}
