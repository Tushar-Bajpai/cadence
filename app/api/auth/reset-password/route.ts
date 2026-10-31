import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resetPasswordSchema } from '@/lib/validators'
import { apiHandler } from '@/lib/api'
import { otpMatches, OTP_MAX_ATTEMPTS } from '@/lib/otp'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  return apiHandler(null, async (req) => {
    const data = resetPasswordSchema.parse(await req.json())

    const user = await db.user.findUnique({ where: { email: data.email } })

    if (!user || !user.resetOtpHash || !user.resetOtpExpiry) {
      return NextResponse.json(
        { error: 'Invalid or expired code. Request a new one.' },
        { status: 400 }
      )
    }

    // Expired code
    if (user.resetOtpExpiry.getTime() < Date.now()) {
      return NextResponse.json(
        { error: 'Code expired. Request a new one.' },
        { status: 400 }
      )
    }

    // Abuse guard: too many wrong guesses for this code
    if ((user.resetOtpAttempts ?? 0) >= OTP_MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Too many attempts. Request a new code.' },
        { status: 429 }
      )
    }

    if (!otpMatches(data.otp, user.email, user.resetOtpHash)) {
      await db.user.update({
        where: { id: user.id },
        data: { resetOtpAttempts: { increment: 1 } },
      })
      return NextResponse.json(
        { error: 'Invalid or expired code. Please try again.' },
        { status: 400 }
      )
    }

    // Code is correct: rotate the password and single-use-clear the OTP.
    const passwordHash = await bcrypt.hash(data.password, 10)
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetOtpHash: null,
        resetOtpExpiry: null,
        resetOtpAttempts: 0,
        resetOtpSentAt: null,
      },
    })

    return { ok: true, message: 'Password updated. You can now sign in.' }
  })(req)
}
