import Razorpay from 'razorpay'

let razorpayInstance: Razorpay | null = null

export function getRazorpay(): Razorpay {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      throw new Error('Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.')
    }

    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })
  }
  return razorpayInstance
}

/**
 * Verify Razorpay payment signature using HMAC SHA256.
 * Uses the Web Crypto API (available in Node 18+ and Edge runtimes).
 */
export async function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): Promise<boolean> {
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!secret) throw new Error('RAZORPAY_KEY_SECRET not set')

  const body = `${orderId}|${paymentId}`

  // Use Node.js crypto for HMAC (works in Next.js API routes)
  const { createHmac } = await import('crypto')
  const expectedSignature = createHmac('sha256', secret)
    .update(body)
    .digest('hex')

  return expectedSignature === signature
}

/** Convert INR amount (rupees) to paise for Razorpay */
export function toPaise(amount: number): number {
  return Math.round(amount * 100)
}

/** Convert paise back to INR rupees */
export function toRupees(paise: number): number {
  return paise / 100
}
