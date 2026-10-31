import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { forgotPasswordSchema } from '@/lib/validators'
import { apiHandler } from '@/lib/api'
import { generateOtp, hashOtp, OTP_TTL_MS, OTP_RESEND_COOLDOWN_MS } from '@/lib/otp'
import { sendMail } from '@/lib/mailer'

export const runtime = 'nodejs'

const GENERIC_MESSAGE =
  'If that email is registered, a 6-digit code has been sent to it. The code expires in 10 minutes.'

function otpEmailHtml(name: string, code: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#05051a;font-family:Segoe UI,Arial,sans-serif;padding:32px 16px;">
    <div style="max-width:480px;margin:0 auto;background:#0a0728;border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:32px;">
      <p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.45);">Cadence by CodeLifters</p>
      <h1 style="margin:14px 0 6px;font-size:22px;color:#ffffff;font-weight:500;">Hi ${name}, reset your <em style="color:#8978ff;font-style:italic;">password.</em></h1>
      <p style="margin:0 0 22px;font-size:13px;color:rgba(255,255,255,0.55);line-height:1.6;">
        Use the one-time code below to reset your Cadence portal password. It expires in 10 minutes and can only be used once.
      </p>
      <div style="background:rgba(137,120,255,0.12);border:1px solid rgba(137,120,255,0.4);border-radius:14px;padding:18px;text-align:center;margin:0 0 22px;">
        <span style="font-size:32px;font-weight:700;letter-spacing:10px;color:#8978ff;">${code}</span>
      </div>
      <p style="margin:0 0 6px;font-size:13px;color:rgba(255,255,255,0.55);line-height:1.6;">
        Didn't request this? You can safely ignore this email — your password stays unchanged.
      </p>
      <p style="margin:24px 0 0;padding-top:14px;border-top:1px solid rgba(255,255,255,0.1);font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.35);">
        Cadence by CodeLifters · © 2026
      </p>
    </div>
  </body>
</html>`
}

// Always responds 200 so we never leak whether the email is registered.
export async function POST(req: Request) {
  return apiHandler(null, async (req) => {
    const data = forgotPasswordSchema.parse(await req.json())

    const user = await db.user.findUnique({ where: { email: data.email } })

    if (user) {
      // Self-cooldown so N resend clicks can't flood the inbox (or someone else's)
      const sentAt = user.resetOtpSentAt?.getTime() ?? 0
      if (Date.now() - sentAt < OTP_RESEND_COOLDOWN_MS) {
        return { ok: true, message: GENERIC_MESSAGE }
      }

      const otp = generateOtp()
      const hash = hashOtp(otp, user.email)

      // One OTP at a time: overwrite any previous code, reset attempt counter.
      // A second update resets the TTL so old codes can never be "extended".
      await db.user.update({
        where: { id: user.id },
        data: {
          resetOtpHash: hash,
          resetOtpExpiry: new Date(Date.now() + OTP_TTL_MS),
          resetOtpAttempts: 0,
          resetOtpSentAt: new Date(),
        },
      })

      const text = `Hi ${user.name},\n\nYour Cadence password reset code is: ${otp}\nIt expires in 10 minutes and can be used once.\n\nIf you didn't request this, ignore this email.\n\nCadence by CodeLifters`

      try {
        await sendMail({
          to: user.email,
          subject: 'Your Cadence password reset code',
          text,
          html: otpEmailHtml(user.name, otp),
        })
      } catch (err) {
        // Never fail the request over mail transport issues (don't even leak it).
        console.error('[auth:forgot-password] Mail send failed:', err)
      }

      // [FALLBACK] so demo/dev is never blocked by SMTP
      if (process.env.NODE_ENV !== 'production') {
        console.log(
          `[auth:forgot-password] OTP for ${user.email}: ${otp} (valid 10 min)`
        )
      }
    }

    return { ok: true, message: GENERIC_MESSAGE }
  })(req)
}
