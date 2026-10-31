import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Starts the Google OAuth 2.0 authorization-code flow.
// redirect_uri must also be registered in Google Cloud Console:
//   ${APP_URL}/api/auth/google/callback  (e.g. http://localhost:8000/...)
export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_AUTH_CLIENT_ID
  const secret = process.env.GOOGLE_AUTH_CLIENT_SECRET ?? process.env.GOOGLE_AUTH_PASSWORD

  if (!clientId || !secret) {
    return NextResponse.redirect(new URL('/auth?googleError=unconfigured', req.url))
  }

  // One-time CSRF state, bound to an httpOnly cookie checked at the callback
  const state = randomBytes(24).toString('hex')
  const cookieStore = await cookies()
  cookieStore.set('cadence_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10 min: the user must complete consent in time
  })

  const redirectUri = new URL('/api/auth/google/callback', process.env.APP_URL ?? req.url).toString()
  const authorizeUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authorizeUrl.searchParams.set('client_id', clientId)
  authorizeUrl.searchParams.set('redirect_uri', redirectUri)
  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('scope', 'openid email profile')
  authorizeUrl.searchParams.set('state', state)
  authorizeUrl.searchParams.set('access_type', 'online')
  authorizeUrl.searchParams.set('prompt', 'select_account')

  return NextResponse.redirect(authorizeUrl.toString())
}
