import nodemailer from 'nodemailer'
import type Mail from 'nodemailer/lib/mailer'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'

export interface MailOptions {
  to: string
  subject: string
  text: string
  html: string
}

// Memoized Ethereal test account so we don't create a new one per request.
let testAccountPromise: Promise<{
  user: string
  pass: string
  host: string
  port: number
} | null> | null = null

function getTestAccount() {
  testAccountPromise ??= nodemailer.createTestAccount().then(
    (acct) => ({
      user: acct.user,
      pass: acct.pass,
      host: acct.smtp.host,
      port: acct.smtp.port,
    }),
    (err) => {
      testAccountPromise = null
      console.error('[mail] Could not create Ethereal test account:', err)
      return null
    }
  )
  return testAccountPromise
}

/**
 * Sends an email over the configured SMTP server.
 *
 * [FALLBACK] When SMTP_USER is not configured we fall back to an auto-created
 * Ethereal test account and print a preview URL to the server console, so the
 * flow is never blocked during the demo:
 *   - OTP codes / links appear in the terminal and at the preview URL.
 */
export async function sendMail(options: MailOptions): Promise<void> {
  const from = process.env.MAIL_FROM || 'Cadence Billing <billing@cadence.dev>'
  const smtpUser = process.env.SMTP_USER

  if (smtpUser && process.env.SMTP_HOST) {
    const port = Number(process.env.SMTP_PORT || 587)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: smtpUser,
        pass: process.env.SMTP_PASS,
      },
    } as SMTPTransport.Options)

    const info = await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    })

    console.log(`[mail] Sent to ${options.to}: ${info.messageId}`)
    return
  }

  // [FALLBACK] No SMTP credentials -> Ethereal test inbox
  const account = await getTestAccount()
  if (!account) {
    console.warn(
      `[mail:fallback] Email not sent (no SMTP config, Ethereal unavailable). "To": ${options.to}`
    )
    console.log(options.text)
    return
  }

  const transporter = nodemailer.createTransport({
    host: account.host,
    port: account.port,
    secure: account.port === 465,
    auth: { user: account.user, pass: account.pass },
  } as SMTPTransport.Options)

  const info = await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  })

  const previewUrl = nodemailer.getTestMessageUrl(info)
  console.log(
    `[mail:fallback] SMTP not configured. Email queued to Ethereal for ${options.to}.`
  )
  console.log(`[mail:fallback] Message ${info.messageId}`)
  if (previewUrl) {
    console.log(`[mail:fallback] Preview: ${previewUrl}`)
  }
  console.log(`[mail:fallback] Body:\n${options.text}`)
}
