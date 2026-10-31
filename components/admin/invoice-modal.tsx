'use client'

import React, { useState } from 'react'
import {
  CheckCircle2,
  Download,
  X,
  AlertCircle,
  Printer,
  CreditCard,
  Ban,
  Send,
  BadgeCheck,
} from 'lucide-react'

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
  sentAt?: string | null
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
    taxAmount?: number
    formattedTaxAmount?: string
    amount: number
    formattedAmount: string
  }>
  discounts: Array<{
    id: string
    label: string
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
  actions?: {
    canConfirm: boolean
    canCancel: boolean
    canPay: boolean
    canSend: boolean
    canPrint: boolean
  }
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
  onInvoiceUpdate?: (invoice: InvoiceDetailData) => void
}

const PAY_METHODS = ['CARD', 'BANK_TRANSFER', 'UPI', 'CASH', 'CHEQUE'] as const

export function InvoiceModal({ invoice, isOpen, onClose, onRefresh, onInvoiceUpdate }: InvoiceModalProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState<string>('CARD')
  const [payNote, setPayNote] = useState('')

  if (!isOpen || !invoice) return null
  const actions = invoice.actions

  // Re-fetch the detail payload after an action so status/balance stay live.
  const refetchDetail = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`)
      const data = await res.json()
      if (res.ok && onInvoiceUpdate) onInvoiceUpdate(data)
    } catch {
      // non-fatal: list refresh already keeps data true
    }
  }

  const resetFeedback = () => {
    setActionSuccess(null)
    setActionError(null)
  }

  const callApi = async (
    label: string,
    path: string,
    body: unknown,
    successMessage: string
  ) => {
    try {
      setLoadingAction(label)
      resetFeedback()
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Action failed')
      setActionSuccess(data.message || successMessage)
      if (onRefresh) onRefresh()
      await refetchDetail(invoice.id)
      return true
    } catch (err: any) {
      setActionError(err.message || 'Action failed')
      return false
    } finally {
      setLoadingAction(null)
    }
  }

  const handleConfirm = () =>
    callApi('confirm', `/api/invoices/${invoice.id}/transition`, { to: 'CONFIRMED' }, 'Invoice confirmed.')

  const handleCancel = () =>
    callApi('cancel', `/api/invoices/${invoice.id}/transition`, { to: 'CANCELLED' }, 'Invoice cancelled.')

  const handleSend = () =>
    callApi('send', `/api/invoices/${invoice.id}/send`, {}, 'Invoice emailed to the customer.')

  const openPaymentDialog = () => {
    setPayAmount(invoice.balanceDue > 0 ? String(invoice.balanceDue) : '')
    setShowPaymentDialog(true)
    resetFeedback()
  }

  const handleRecordPayment = async () => {
    const ok = await callApi(
      'pay',
      `/api/invoices/${invoice.id}/payments`,
      {
        amount: payAmount === '' ? undefined : Number(payAmount),
        method: payMethod,
        note: payNote || undefined,
      },
      'Payment recorded.'
    )
    if (ok) setShowPaymentDialog(false)
  }

  const handlePrint = () => window.open(`/admin/invoices/${invoice.id}/print`, '_blank')

  const statusPill = () => {
    const paid = invoice.isPaid
    const cancelled = invoice.status === 'CANCELLED'
    const draft = invoice.status === 'DRAFT'
    const color = paid
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      : cancelled
      ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
      : draft
      ? 'bg-white/10 text-white/70 border-white/20'
      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    const dot = paid ? 'bg-emerald-400' : cancelled ? 'bg-rose-400' : draft ? 'bg-white/50' : 'bg-amber-400'
    const label = paid ? 'Paid' : invoice.status === 'OVERDUE' ? 'Overdue' : invoice.status
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${color}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        {label}
      </span>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-[#0e0c24] text-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/15 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <h2 className="text-xl font-bold tracking-tight text-white">
            {invoice.title || `Invoice #${invoice.seq}`}
          </h2>
          <div className="flex items-center gap-3">
            {statusPill()}
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
          {/* Status banner */}
          {invoice.isPaid ? (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{invoice.paidBannerText}</span>
            </div>
          ) : invoice.status === 'CANCELLED' ? (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm font-medium">
              <Ban className="w-4 h-4 shrink-0" />
              <span>{invoice.paidBannerText}</span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-sm font-medium">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Payment due: {invoice.dueOn} • Balance: {invoice.formattedBalanceDue}</span>
              </div>
              {actions?.canPay && (
                <button
                  onClick={openPaymentDialog}
                  disabled={loadingAction !== null}
                  className="text-xs bg-[#8978ff] hover:bg-[#9b8cff] text-white font-semibold px-3 py-1 rounded-full transition-colors cursor-pointer disabled:opacity-50"
                >
                  Collect Now
                </button>
              )}
            </div>
          )}

          {invoice.sentAt && (
            <div className="flex items-center gap-2 text-[11px] font-mono text-white/50">
              <Send className="w-3 h-3" />
              <span>Emailed on {invoice.sentAt}</span>
            </div>
          )}

          {actionSuccess && (
            <div className="flex items-start gap-2 text-xs text-emerald-300 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}
          {actionError && (
            <div className="flex items-start gap-2 text-xs text-rose-300 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Metadata */}
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
                {invoice.to.company}
              </p>
            </div>

            <div className="col-span-2 pt-2 border-t border-white/10">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#a79aff] mb-1">
                Plan
              </p>
              <p className="font-medium text-white">{invoice.planName}</p>
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Items</h3>
            <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/[0.02]">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.03] border-b border-white/10 text-[10px] font-mono text-white/40 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4 font-normal">Description</th>
                    <th className="py-2.5 px-4 font-normal text-right">Tax</th>
                    <th className="py-2.5 px-4 font-normal text-center">Qty</th>
                    <th className="py-2.5 px-4 font-normal text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="text-white/90">
                      <td className="py-3 px-4 font-medium">{item.description}</td>
                      <td className="py-3 px-4 text-right text-white/60">
                        {item.formattedTaxAmount || '—'}
                      </td>
                      <td className="py-3 px-4 text-center text-white/60">{item.quantity}</td>
                      <td className="py-3 px-4 text-right font-semibold text-white">
                        {item.formattedAmount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2 text-sm">
            <div className="flex justify-between text-white/60">
              <span>Subtotal</span>
              <span>{invoice.formattedSubtotal}</span>
            </div>
            <div className="flex justify-between text-white/60">
              <span>Tax</span>
              <span>{invoice.formattedTaxTotal}</span>
            </div>
            {invoice.discounts.map((d) => (
              <div key={d.id} className="flex justify-between text-[#a79aff]">
                <span>{d.label}</span>
                <span>−{d.formattedAmount}</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold text-white border-t border-white/10 pt-2">
              <span>Total</span>
              <span>{invoice.formattedTotal}</span>
            </div>
            {invoice.amountPaid > 0 && (
              <div className="flex justify-between text-emerald-300">
                <span>Paid</span>
                <span>{invoice.formattedAmountPaid}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-white">
              <span>Balance due</span>
              <span>{invoice.formattedBalanceDue}</span>
            </div>
          </div>

          {/* Payments */}
          {invoice.payments.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Payments</h3>
              <div className="space-y-2">
                {invoice.payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-emerald-300">${p.amount}</p>
                      <p className="text-white/50 font-mono text-[11px]">
                        {p.date} • {p.method}
                      </p>
                    </div>
                    {p.note && <p className="text-white/50 text-[11px]">{p.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions: the lifecycle buttons (DRAFT → CONFIRMED → PAID / CANCELLED) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-white/[0.02] border-t border-white/10">
          {actions?.canConfirm && (
            <button
              onClick={handleConfirm}
              disabled={loadingAction !== null}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#8978ff] hover:bg-[#9b8cff] text-white text-xs font-semibold transition-all shadow-[0_4px_20px_rgba(137,120,255,0.4)] cursor-pointer disabled:opacity-50"
            >
              <BadgeCheck className="w-4 h-4" />
              <span>{loadingAction === 'confirm' ? 'Confirming…' : 'Confirm'}</span>
            </button>
          )}

          {actions?.canPay && !showPaymentDialog && (
            <button
              onClick={openPaymentDialog}
              disabled={loadingAction !== null}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4" />
              <span>Record Payment</span>
            </button>
          )}

          {actions?.canSend && (
            <button
              onClick={handleSend}
              disabled={loadingAction !== null}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/15 text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4 text-[#a79aff]" />
              <span>{loadingAction === 'send' ? 'Sending…' : invoice.sentAt ? 'Resend' : 'Send'}</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/15 text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-white/70" />
            <span>Print</span>
          </button>

          {actions?.canCancel && (
            <button
              onClick={handleCancel}
              disabled={loadingAction !== null}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              <Ban className="w-4 h-4" />
              <span>{loadingAction === 'cancel' ? 'Cancelling…' : 'Cancel'}</span>
            </button>
          )}
        </div>

        {/* Record Payment Dialog */}
        {showPaymentDialog && (
          <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 rounded-3xl">
            <div className="w-full max-w-sm bg-[#14112e] rounded-2xl border border-white/15 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">Record Payment</h4>
                <button
                  onClick={() => setShowPaymentDialog(false)}
                  className="p-1 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#a79aff]">
                    Amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder={String(invoice.balanceDue)}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-xl bg-white/[0.06] text-white placeholder-white/30 border border-white/10 focus:outline-none focus:border-[#8978ff]"
                  />
                  <p className="text-[10px] text-white/40 mt-1 font-mono">
                    Outstanding: {invoice.formattedBalanceDue} — leave empty for full amount
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#a79aff]">
                    Method
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-xl bg-white/[0.06] text-white border border-white/10 focus:outline-none focus:border-[#8978ff] cursor-pointer"
                  >
                    {PAY_METHODS.map((m) => (
                      <option key={m} value={m} className="bg-[#14112e]">
                        {m.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#a79aff]">
                    Note (optional)
                  </label>
                  <input
                    type="text"
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    placeholder="e.g. wire ref #8842"
                    className="mt-1 w-full px-3 py-2 text-sm rounded-xl bg-white/[0.06] text-white placeholder-white/30 border border-white/10 focus:outline-none focus:border-[#8978ff]"
                  />
                </div>
              </div>

              <button
                onClick={handleRecordPayment}
                disabled={loadingAction !== null}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#8978ff] hover:bg-[#9b8cff] text-white text-sm font-semibold transition-all shadow-[0_4px_20px_rgba(137,120,255,0.4)] cursor-pointer disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4" />
                <span>{loadingAction === 'pay' ? 'Recording…' : 'Record Payment'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
