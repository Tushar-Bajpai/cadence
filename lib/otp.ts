import { createHash, randomInt, timingSafeEqual } from 'crypto'

// OTP-based password reset configuration
export const OTP_TTL_MS = 10 * 60 * 1000 // code valid for 10 minutes
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000 // re-request cooldown
export const OTP_MAX_ATTEMPTS = 5 // wrong-code guesses allowed per code

// 6-digit numeric code, cryptographically random
export function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

// Never store the OTP itself: store a peppered SHA-256 of email + code
export function hashOtp(otp: string, email: string): string {
  const pepper = process.env.JWT_SECRET || 'cadence-otp-fallback-pepper'
  return createHash('sha256').update(`${email.toLowerCase()}:${otp}:${pepper}`).digest('hex')
}

// Constant-time comparison to avoid leaking information through timing
export function otpMatches(otp: string, email: string, storedHash: string): boolean {
  const submitted = Buffer.from(hashOtp(otp, email), 'utf8')
  const stored = Buffer.from(storedHash, 'utf8')
  if (submitted.length !== stored.length) return false
  return timingSafeEqual(submitted, stored)
}
