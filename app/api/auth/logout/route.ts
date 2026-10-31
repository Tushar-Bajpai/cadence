import { NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, clearSessionCookie } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST() {
  const response = NextResponse.json({ ok: true, message: 'Signed out successfully' })
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  try {
    await clearSessionCookie()
  } catch {}
  return response
}

export async function GET(req: Request) {
  const url = new URL('/auth', req.url)
  const response = NextResponse.redirect(url)
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  try {
    await clearSessionCookie()
  } catch {}
  return response
}
