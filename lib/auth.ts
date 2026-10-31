import { cookies, headers } from 'next/headers'
import { signSession, verifySession, SessionPayload } from './session'

export const AUTH_COOKIE_NAME = 'cadence_session'

export type { SessionPayload }
export { signSession, verifySession }

export async function getSession(req?: any): Promise<SessionPayload | null> {
  try {
    let token: string | undefined

    // 1. Check req headers if passed (supports direct route invocation, testing, & server proxies)
    if (req?.headers) {
      try {
        const authHeader = typeof req.headers.get === 'function' ? req.headers.get('authorization') : req.headers?.authorization
        if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7).trim()
        }
      } catch {}

      if (!token) {
        try {
          const cookieHeader = typeof req.headers.get === 'function' ? req.headers.get('cookie') : req.headers?.cookie
          if (cookieHeader && typeof cookieHeader === 'string') {
            const match = cookieHeader.match(new RegExp(`${AUTH_COOKIE_NAME}=([^;]+)`))
            if (match) token = match[1]
          }
        } catch {}
      }
    }

    // 2. Next.js cookies store
    if (!token) {
      try {
        const cookieStore = await cookies()
        token = cookieStore.get(AUTH_COOKIE_NAME)?.value
      } catch {
        // Not inside Next.js render context
      }
    }

    // 3. Next.js headers store
    if (!token) {
      try {
        const headerList = await headers()
        const authHeader = headerList.get('authorization')
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7).trim()
        }
      } catch {
        // Not inside Next.js render context
      }
    }

    if (!token) return null
    return await verifySession(token)
  } catch {
    return null
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_COOKIE_NAME)
}
