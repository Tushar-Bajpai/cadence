'use client'

import React, { useState } from 'react'
import { X, CreditCard, CheckCircle2, AlertCircle, Banknote, Building2, QrCode } from 'lucide-react'

interface RecordPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  invoice: {
    id: string
    seq: number
    number: string
    customerName: string
    total: number
    balanceDue: number
    formattedBalanceDue: string
  } | null
}

const PAYMENT_METHODS = [
  { value: 'CARD', label: 'Credit / Debit Card', icon: CreditCard },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer (NEFT/RTGS)', icon: Building2 },
  { value: 'UPI', label: 'UPI / QR', icon: QrCode },
  { value: 'CASH', label: 'Cash', icon: Banknote },
  { value: 'CHEQUE', label: 'Cheque', icon: Banknote },
]

export function RecordPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  invoice,
}: RecordPaymentModalProps) {
  const [amount, setAmount] = useState<string>('')
  const [method, setMethod] = useState<string>('BANK_TRANSFER')
  const [note, setNote] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  React.useEffect(() => {
    if (invoice) {
      setAmount(String(invoice.balanceDue))
      setNote(`Settlement for ${invoice.number}`)
      setError(null)
    }
  }, [invoice])

  if (!isOpen || !invoice) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const payVal = Number(amount)
    if (isNaN(payVal) || payVal <= 0) {
      setError('Please enter a valid positive payment amount.')
      return
    }

    if (payVal > invoice.balanceDue) {
      setError(`Overpayment rejected: outstanding balance is ₹${invoice.balanceDue}`)
      return
    }

    try {
      setLoading(true)
      const res = await fetch(`/api/invoices/${invoice.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: payVal,
          method,
          note: note.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record payment.')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Payment error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg rounded-3xl bg-[#0e0c24] border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#a79aff]">
              LEDGER SETTLEMENT
            </span>
            <h2 className="text-xl font-bold text-white mt-0.5">
              Record Payment
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Invoice Summary Banner */}
        <div className="p-5 bg-white/[0.02] border-b border-white/10 flex items-center justify-between text-xs">
          <div>
            <span className="text-white/40 block">Invoice</span>
            <span className="font-mono font-bold text-white text-sm">{invoice.number}</span>
            <span className="text-white/60 block mt-0.5">{invoice.customerName}</span>
          </div>
          <div className="text-right">
            <span className="text-white/40 block">Outstanding Due</span>
            <span className="font-mono font-extrabold text-amber-300 text-base">
              {invoice.formattedBalanceDue}
            </span>
          </div>
        </div>

        {error && (
          <div className="m-5 mb-0 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Amount */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-white/70">
                Payment Amount (₹)
              </label>
              <button
                type="button"
                onClick={() => setAmount(String(invoice.balanceDue))}
                className="text-[11px] text-[#8978ff] hover:underline cursor-pointer"
              >
                Pay Full Amount
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-sm font-bold">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={invoice.balanceDue}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full h-11 bg-white/[0.04] border border-white/10 rounded-xl pl-8 pr-4 text-sm font-mono text-white focus:outline-none focus:border-[#8978ff] focus:ring-1 focus:ring-[#8978ff] transition"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-white/70 block mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((m) => {
                const Icon = m.icon
                const active = method === m.value
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMethod(m.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border transition cursor-pointer text-left ${
                      active
                        ? 'bg-[#8978ff]/15 border-[#8978ff] text-white shadow-sm'
                        : 'bg-white/[0.02] border-white/10 text-white/60 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#8978ff]' : 'text-white/40'}`} />
                    <span className="truncate">{m.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-white/70 block mb-1.5">
              Reference / Note
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Bank reference, transaction ID, or cheque #"
              className="w-full h-10 bg-white/[0.04] border border-white/10 rounded-xl px-3.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#8978ff] transition"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-[#8978ff] hover:bg-[#9b8cff] text-white text-xs font-semibold transition shadow-md cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Recording...' : `Record Payment ₹${Number(amount || 0).toFixed(2)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

