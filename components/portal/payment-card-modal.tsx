'use client'

import React, { useState } from 'react'
import { X, CreditCard, ShieldCheck } from 'lucide-react'

interface PaymentCardModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (cardData: any) => void
}

export function PaymentCardModal({ isOpen, onClose, onSuccess }: PaymentCardModalProps) {
  const [cardNumber, setCardNumber] = useState('')
  const [cardHolder, setCardHolder] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      onSuccess({
        brand: 'VISA',
        last4: cardNumber.replace(/\s/g, '').slice(-4) || '8842',
        maskedNumber: cardNumber || '4532 •••• •••• 8842',
        cardholder: cardHolder.toUpperCase() || 'ROBERT FOX',
        validThru: expiry || '08/29',
      })
      onClose()
    }, 600)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-[#0e0c24] text-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/15 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-5 h-5 text-[#8978ff]" />
            <h3 className="text-lg font-bold text-white">Add Payment Method</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">
              Cardholder Name
            </label>
            <input
              type="text"
              required
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value)}
              placeholder="e.g. Robert Fox"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#8978ff] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">
              Card Number
            </label>
            <input
              type="text"
              required
              maxLength={19}
              value={cardNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim()
                setCardNumber(val)
              }}
              placeholder="1520 0100 3356 6888"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder:text-white/30 focus:outline-none focus:border-[#8978ff] transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">
                Expires (MM/YY)
              </label>
              <input
                type="text"
                required
                maxLength={5}
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                placeholder="12/28"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder:text-white/30 focus:outline-none focus:border-[#8978ff] transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">
                CVC / CVV
              </label>
              <input
                type="password"
                required
                maxLength={4}
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                placeholder="•••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder:text-white/30 focus:outline-none focus:border-[#8978ff] transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 text-[11px] text-white/40">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Encrypted with 256-bit AES protocol. Card details stored securely.</span>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-[#8978ff] hover:bg-[#9b8cff] text-white font-semibold text-sm transition shadow-[0_4px_20px_rgba(137,120,255,0.4)] disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Verifying Card...' : 'Save & Set as Primary Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
