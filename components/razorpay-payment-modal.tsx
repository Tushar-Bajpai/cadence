'use client'

import React, { useState, useCallback } from 'react'
import { X, CreditCard, ShieldCheck, Loader2, CheckCircle2, AlertCircle, Zap } from 'lucide-react'

declare global {
  interface Window {
    Razorpay: any
  }
}

interface RazorpayPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (data: any) => void
  invoiceId: string
  invoiceSeq: number
  amount: number
  formattedAmount: string
  /** Use 'portal' for customer portal (customer-scoped endpoint) or 'admin' for admin panel */
  mode?: 'portal' | 'admin'
}

export function RazorpayPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  invoiceId,
  invoiceSeq,
  amount,
  formattedAmount,
  mode = 'admin',
}: RazorpayPaymentModalProps) {
  const [status, setStatus] = useState<'idle' | 'creating' | 'processing' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const loadRazorpayScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        resolve(true)
        return
      }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }, [])

  const handlePayWithRazorpay = async () => {
    try {
      setStatus('creating')
      setErrorMessage('')

      // Load Razorpay checkout script
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        throw new Error('Failed to load Razorpay checkout. Please check your internet connection.')
      }

      // Create order via our API
      const createUrl = mode === 'portal'
        ? `/api/portal/invoices/${invoiceId}/razorpay`
        : `/api/payments/razorpay/create-order`

      const createBody = mode === 'portal' ? {} : { invoiceId }

      const orderRes = await fetch(createUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createBody),
      })

      const orderData = await orderRes.json()
      if (!orderRes.ok) throw new Error(orderData.error || 'Failed to create payment order')

      setStatus('processing')

      // Open Razorpay checkout
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Cadence Billing',
        description: `Invoice #${invoiceSeq} Payment`,
        order_id: orderData.orderId,
        prefill: {
          name: orderData.customerName || '',
          email: orderData.customerEmail || '',
        },
        theme: {
          color: '#8978ff',
          backdrop_color: 'rgba(5, 5, 26, 0.85)',
        },
        modal: {
          ondismiss: () => {
            setStatus('idle')
          },
        },
        handler: async (response: any) => {
          try {
            setStatus('processing')
            // Verify payment on server
            const verifyRes = await fetch('/api/payments/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                invoiceId,
              }),
            })

            const verifyData = await verifyRes.json()
            if (!verifyRes.ok) throw new Error(verifyData.error || 'Payment verification failed')

            setStatus('success')
            setSuccessMessage(verifyData.message || 'Payment successful!')
            setTimeout(() => {
              onSuccess(verifyData)
              onClose()
              setStatus('idle')
            }, 2000)
          } catch (err: any) {
            setStatus('error')
            setErrorMessage(err.message || 'Payment verification failed')
          }
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (response: any) => {
        setStatus('error')
        setErrorMessage(
          response.error?.description || 'Payment failed. Please try again.'
        )
      })
      rzp.open()
    } catch (err: any) {
      setStatus('error')
      setErrorMessage(err.message || 'An error occurred')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-[#0e0c24] text-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/15 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#8978ff]/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#8978ff]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Pay Invoice</h3>
              <p className="text-[11px] text-white/40 font-mono">
                INV-{String(invoiceSeq).padStart(6, '0')}
              </p>
            </div>
          </div>
          <button
            onClick={() => { onClose(); setStatus('idle'); setErrorMessage(''); }}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Amount Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#8978ff]/20 via-[#6c5ce7]/10 to-transparent border border-[#8978ff]/30 p-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#8978ff]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#a79aff] mb-1">
              Amount Due
            </p>
            <p className="text-3xl font-bold text-white tracking-tight">
              {formattedAmount}
            </p>
            <p className="text-xs text-white/40 mt-1 font-mono">
              Secure payment via Razorpay
            </p>
          </div>

          {/* Payment methods info */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">
              Supported Methods
            </p>
            <div className="flex flex-wrap gap-2">
              {['UPI', 'Cards', 'Net Banking', 'Wallets'].map((m) => (
                <span
                  key={m}
                  className="px-3 py-1.5 rounded-full text-[11px] font-medium bg-white/[0.06] border border-white/10 text-white/70"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* Status messages */}
          {status === 'success' && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm font-medium animate-in slide-in-from-bottom-2 duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm font-medium animate-in slide-in-from-bottom-2 duration-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Security badge */}
          <div className="flex items-center gap-2 text-[11px] text-white/40">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>256-bit SSL encrypted. PCI DSS Level 1 compliant. Powered by Razorpay.</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-5 pt-0">
          <button
            onClick={handlePayWithRazorpay}
            disabled={status === 'creating' || status === 'processing' || status === 'success'}
            className="w-full py-3.5 px-4 rounded-xl bg-[#8978ff] hover:bg-[#9b8cff] text-white font-semibold text-sm transition-all shadow-[0_4px_24px_rgba(137,120,255,0.4)] hover:shadow-[0_8px_32px_rgba(137,120,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            {status === 'creating' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Order...
              </>
            ) : status === 'processing' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying Payment...
              </>
            ) : status === 'success' ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Payment Complete!
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Pay {formattedAmount} with Razorpay
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
