'use client'

import React, { useState, useEffect } from 'react'
import {
  CheckCircle2,
  Download,
  X,
  AlertCircle,
  Printer,
  CreditCard,
  Zap,
  Calendar,
  Banknote,
  Wallet,
  Receipt,
  CircleDollarSign,
  Loader2,
} from 'lucide-react'
import { RazorpayPaymentModal } from '@/components/razorpay-payment-modal'

export interface InvoiceDetailData {
  id: string
  seq: number
  number: string
  title: string
  status: string
  isPaid: boolean
  paidBannerText: string
  issuedOn: string
  dueOn: string
  from: {
    name: string
    address: string
    email: string
    phone?: string
  }
  to: {
    name: string
    email: string
    phone: string
    company: string
    address: string
  }
  planName: string
  items: Array<{
    id: string
    description: string
    unitPrice: number
    formattedUnitPrice: string
    quantity: number
    amount: number
    formattedAmount: string
  }>
  subtotal: number
  formattedSubtotal: string
  taxTotal: number
  formattedTaxTotal: string
  discountTotal: number
  formattedDiscountTotal: string
  total: number
  formattedTotal: string
  amountPaid: number
  formattedAmountPaid: string
  balanceDue: number
  formattedBalanceDue: string
  payments: Array<{
    id: string
    amount: number
    formattedAmount: string
    method: string
    date: string
    note?: string | null
  }>
}

interface InvoiceModalProps {
  invoice: InvoiceDetailData | null
  isOpen: boolean
  onClose: () => void
  onRefresh?: () => void
  /** 'admin' (default) allows manual record payment and admin tools; 'portal' is customer self-service */
  mode?: 'admin' | 'portal'
}

const METHOD_OPTIONS = [
  { value: 'CARD', label: 'Card (Credit/Debit)', icon: CreditCard },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer (NEFT/RTGS)', icon: Banknote },
  { value: 'UPI', label: 'UPI / VPA', icon: Wallet },
  { value: 'CASH', label: 'Cash', icon: CircleDollarSign },
  { value: 'CHEQUE', label: 'Cheque', icon: Receipt },
] as const

export function InvoiceModal({
  invoice,
  isOpen,
  onClose,
  onRefresh,
  mode = 'admin',
}: InvoiceModalProps) {
  const [loadingAction, setLoadingAction] = useState(false)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [isRazorpayOpen, setIsRazorpayOpen] = useState(false)

  // Record Payment Dialog state
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'BANK_TRANSFER' | 'UPI' | 'CASH' | 'CHEQUE'>('CARD')
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().split('T')[0])
  const [paymentNote, setPaymentNote] = useState<string>('')
  const [recordError, setRecordError] = useState<string>('')

  // Reset payment dialog fields when invoice changes
  useEffect(() => {
    if (invoice) {
      setPaymentAmount(String(invoice.balanceDue > 0 ? invoice.balanceDue : invoice.total))
      setPaymentDate(new Date().toISOString().split('T')[0])
      setPaymentNote('')
      setRecordError('')
      setActionSuccess(null)
    }
  }, [invoice])

  if (!isOpen || !invoice) return null

  const handleMarkUnpaid = async () => {
    try {
      setLoadingAction(true)
      const res = await fetch(`/api/invoices/${invoice.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_unpaid' }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      setActionSuccess('Invoice marked as unpaid.')
      if (onRefresh) onRefresh()
    } catch (err: any) {
      alert(err.message || 'Error updating status')
    } finally {
      setLoadingAction(false)
    }
  }

  const handleSubmitRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setRecordError('')

    const parsedAmount = parseFloat(paymentAmount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setRecordError('Please enter a valid payment amount greater than zero.')
      return
    }

    if (parsedAmount > invoice.balanceDue + 0.01) {
      setRecordError(`Amount cannot exceed the balance due (${invoice.formattedBalanceDue}).`)
      return
    }

    try {
      setLoadingAction(true)
      const res = await fetch(`/api/invoices/${invoice.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parsedAmount,
          method: paymentMethod,
          date: paymentDate,
          note: paymentNote.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to record payment')

      setIsRecordPaymentOpen(false)
      setActionSuccess(data.message || 'Payment recorded successfully!')
      if (onRefresh) onRefresh()
    } catch (err: any) {
      setRecordError(err.message || 'Error recording payment')
    } finally {
      setLoadingAction(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleRazorpaySuccess = () => {
    setActionSuccess('Razorpay payment verified and recorded successfully!')
    if (onRefresh) onRefresh()
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
        <div
          className="relative w-full max-w-2xl bg-[#0e0c24] text-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/15 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold tracking-tight text-white">
                {invoice.title || `Invoice #${invoice.seq}`}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  invoice.isPaid
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : invoice.status === 'CONFIRMED'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'bg-white/10 text-white/70 border border-white/20'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    invoice.isPaid ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                {invoice.isPaid ? 'Paid' : invoice.status}
              </span>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto p-6 space-y-6 flex-1">
            {/* Status Banner */}
            {invoice.isPaid ? (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{invoice.paidBannerText || `Invoice Paid on ${invoice.dueOn}`}</span>
              </div>
            ) : (
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-sm font-medium">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Payment due: {invoice.dueOn} • Outstanding: {invoice.formattedBalanceDue}</span>
                </div>
                <button
                  onClick={() => setIsRazorpayOpen(true)}
                  disabled={loadingAction}
                  className="text-xs bg-[#8978ff] hover:bg-[#9b8cff] text-white font-semibold px-3 py-1 rounded-full transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  <Zap className="w-3 h-3" />
                  Pay with Razorpay
                </button>
              </div>
            )}

            {actionSuccess && (
              <div className="text-xs text-emerald-300 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {/* Dates & From/To Metadata */}
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#a79aff] mb-1">
                  Issued On
                </p>
                <p className="font-semibold text-white">{invoice.issuedOn}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#a79aff] mb-1">
                  Due On
                </p>
                <p className="font-semibold text-white">{invoice.dueOn}</p>
              </div>

              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#a79aff] mb-1">
                  From
                </p>
                <p className="font-semibold text-white">{invoice.from.name}</p>
                <p className="text-xs text-white/60 whitespace-pre-line leading-relaxed mt-0.5">
                  {invoice.from.address}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#a79aff] mb-1">
                  To
                </p>
                <p className="font-semibold text-white">{invoice.to.name}</p>
                <p className="text-xs text-white/60 whitespace-pre-line leading-relaxed mt-0.5">
                  {invoice.to.address}
                </p>
              </div>

              <div className="col-span-2 pt-2 border-t border-white/10">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#a79aff] mb-1">
                  Plan
                </p>
                <p className="font-medium text-white">{invoice.planName}</p>
              </div>
            </div>

            {/* Items Section */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Items</h3>
              <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/[0.02]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/[0.03] border-b border-white/10 text-[10px] font-mono text-white/40 uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4 font-normal">Description</th>
                      <th className="py-2.5 px-4 font-normal text-right">Amount</th>
                      <th className="py-2.5 px-4 font-normal text-center">Qty</th>
                      <th className="py-2.5 px-4 font-normal text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {invoice.items.map((item) => (
                      <tr key={item.id} className="text-white/90">
                        <td className="py-3 px-4 font-medium">{item.description}</td>
                        <td className="py-3 px-4 text-right text-white/60">{item.formattedUnitPrice}</td>
                        <td className="py-3 px-4 text-center text-white/60">{item.quantity}</td>
                        <td className="py-3 px-4 text-right font-semibold text-white">{item.formattedAmount}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-white/[0.03] border-t border-white/10 text-xs text-white">
                    <tr>
                      <td colSpan={3} className="py-2 px-4 text-white/60">Subtotal</td>
                      <td className="py-2 px-4 text-right font-mono">{invoice.formattedSubtotal}</td>
                    </tr>
                    {invoice.taxTotal > 0 && (
                      <tr>
                        <td colSpan={3} className="py-2 px-4 text-white/60">Taxes</td>
                        <td className="py-2 px-4 text-right font-mono">{invoice.formattedTaxTotal}</td>
                      </tr>
                    )}
                    {invoice.discountTotal > 0 && (
                      <tr>
                        <td colSpan={3} className="py-2 px-4 text-emerald-400">Discount</td>
                        <td className="py-2 px-4 text-right font-mono text-emerald-400">-{invoice.formattedDiscountTotal}</td>
                      </tr>
                    )}
                    <tr className="border-t border-white/10 font-bold text-sm text-white">
                      <td colSpan={3} className="py-2.5 px-4">Total</td>
                      <td className="py-2.5 px-4 text-right">{invoice.formattedTotal}</td>
                    </tr>
                    {invoice.amountPaid > 0 && (
                      <tr className="text-xs text-emerald-400">
                        <td colSpan={3} className="py-1.5 px-4">Amount Paid</td>
                        <td className="py-1.5 px-4 text-right font-mono">-{invoice.formattedAmountPaid}</td>
                      </tr>
                    )}
                    <tr className="border-t border-white/10 font-bold text-sm">
                      <td colSpan={3} className="py-2.5 px-4 text-[#a79aff]">Outstanding Balance</td>
                      <td className="py-2.5 px-4 text-right text-white font-mono">{invoice.formattedBalanceDue}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Payment History */}
            {invoice.payments.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">
                  Payment History ({invoice.payments.length})
                </h3>
                <div className="space-y-2">
                  {invoice.payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                          <CreditCard className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">{p.formattedAmount}</p>
                          <p className="text-[11px] text-white/40 font-mono">
                            {p.method} • {p.date}
                          </p>
                        </div>
                      </div>
                      {p.note && (
                        <p className="text-[11px] text-white/50 max-w-[220px] truncate text-right">
                          {p.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="p-4 bg-white/[0.02] border-t border-white/10">
            {mode === 'portal' ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrint}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/15 text-white text-sm font-medium transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-white/70" />
                  <span>Download / Print</span>
                </button>
                {!invoice.isPaid && (
                  <button
                    onClick={() => setIsRazorpayOpen(true)}
                    disabled={loadingAction}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#8978ff] hover:bg-[#9b8cff] text-white text-sm font-semibold transition-all shadow-[0_4px_20px_rgba(137,120,255,0.4)] cursor-pointer disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Pay with Razorpay</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={handlePrint}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/15 text-white text-sm font-medium transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-white/70" />
                  <span>Download</span>
                </button>

                {invoice.isPaid ? (
                  <button
                    onClick={handleMarkUnpaid}
                    disabled={loadingAction}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    <span>Mark Unpaid</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setPaymentAmount(String(invoice.balanceDue > 0 ? invoice.balanceDue : invoice.total))
                      setIsRecordPaymentOpen(true)
                    }}
                    disabled={loadingAction}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/15 text-white text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Record Payment</span>
                  </button>
                )}

                {!invoice.isPaid && (
                  <button
                    onClick={() => setIsRazorpayOpen(true)}
                    disabled={loadingAction}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#8978ff] hover:bg-[#9b8cff] text-white text-sm font-semibold transition-all shadow-[0_4px_20px_rgba(137,120,255,0.4)] cursor-pointer disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Razorpay</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Record Payment Dialog */}
      {isRecordPaymentOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-md bg-[#0e0c24] text-white rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.7)] border border-white/20 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dialog Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#8978ff]/20 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-[#8978ff]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Record Manual Payment</h3>
                  <p className="text-[11px] text-white/40 font-mono">
                    INV-{String(invoice.seq).padStart(6, '0')} • Outstanding: {invoice.formattedBalanceDue}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRecordPaymentOpen(false)}
                className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dialog Form */}
            <form onSubmit={handleSubmitRecordPayment} className="p-6 space-y-4">
              {recordError && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{recordError}</span>
                </div>
              )}

              {/* Amount Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-white/80">
                    Payment Amount (₹)
                  </label>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(String(invoice.balanceDue))}
                    className="text-[11px] text-[#a79aff] hover:text-white transition-colors cursor-pointer"
                  >
                    Full Balance ({invoice.formattedBalanceDue})
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-sm font-mono">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={invoice.balanceDue}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    required
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2.5 text-sm rounded-xl bg-white/[0.05] text-white placeholder-white/30 border border-white/15 focus:outline-none focus:border-[#8978ff] focus:ring-1 focus:ring-[#8978ff] font-mono"
                  />
                </div>
                {parseFloat(paymentAmount) < invoice.balanceDue && parseFloat(paymentAmount) > 0 && (
                  <p className="text-[11px] text-amber-300/80 mt-1">
                    * Partial payment. Remaining balance will be ₹{(invoice.balanceDue - parseFloat(paymentAmount)).toFixed(2)}.
                  </p>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {METHOD_OPTIONS.map((opt) => {
                    const Icon = opt.icon
                    const isSelected = paymentMethod === opt.value
                    return (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => setPaymentMethod(opt.value)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#8978ff]/20 border-[#8978ff] text-white font-semibold'
                            : 'bg-white/[0.03] border-white/10 text-white/60 hover:bg-white/[0.06] hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{opt.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5">
                  Payment Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white/[0.05] text-white border border-white/15 focus:outline-none focus:border-[#8978ff] [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Note / Reference */}
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5">
                  Internal Note / Reference (Optional)
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="e.g. Cheque #49281, NEFT UTR #..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white/[0.05] text-white placeholder-white/30 border border-white/15 focus:outline-none focus:border-[#8978ff]"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsRecordPaymentOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white/80 text-xs font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#8978ff] hover:bg-[#9b8cff] text-white text-xs font-semibold transition-all shadow-[0_4px_16px_rgba(137,120,255,0.4)] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loadingAction ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Record Payment'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Razorpay Payment Modal */}
      <RazorpayPaymentModal
        isOpen={isRazorpayOpen}
        onClose={() => setIsRazorpayOpen(false)}
        onSuccess={handleRazorpaySuccess}
        invoiceId={invoice.id}
        invoiceSeq={invoice.seq}
        amount={invoice.balanceDue > 0 ? invoice.balanceDue : invoice.total}
        formattedAmount={invoice.balanceDue > 0 ? invoice.formattedBalanceDue : invoice.formattedTotal}
        mode={mode}
      />
    </>
  )
}
