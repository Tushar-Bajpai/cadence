import { cookies } from 'next/headers'
import { signSession, verifySession, SessionPayload } from './session'

export const AUTH_COOKIE_NAME = 'cadence_session'

export type { SessionPayload }
export { signSession, verifySession }

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
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
  try {
    const cookieStore = await cookies()
    cookieStore.set(AUTH_COOKIE_NAME, '', {
      path: '/',
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
    cookieStore.delete(AUTH_COOKIE_NAME)
  } catch {}
}
