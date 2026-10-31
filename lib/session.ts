import { SignJWT, jwtVerify } from 'jose'
import { Role } from '@prisma/client'

// Pure session helpers (no next/headers imports) so they can also be used
// inside proxy.ts, which runs outside the request render context.
const JWT_SECRET =
  process.env.JWT_SECRET ||
  'cadence-super-secret-jwt-key-2026-codelifters-secure-token'
const key = new TextEncoder().encode(JWT_SECRET)

export const AUTH_COOKIE_NAME = 'cadence_session'

export interface SessionPayload {
  userId: string
  email: string
  name: string
  role: Role
  customerId?: string
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key)
}

export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    })
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}
