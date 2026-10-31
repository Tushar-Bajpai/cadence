'use client'

import React, { useState } from 'react'
import { CheckCircle2, Download, X, AlertCircle, Printer, CreditCard } from 'lucide-react'

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
}

export function InvoiceModal({ invoice, isOpen, onClose, onRefresh }: InvoiceModalProps) {
  const [loadingAction, setLoadingAction] = useState(false)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

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

  const handleRecordPayment = async () => {
    try {
      setLoadingAction(true)
      const res = await fetch(`/api/invoices/${invoice.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: invoice.balanceDue > 0 ? invoice.balanceDue : invoice.total,
          method: 'CARD',
          note: 'Card settlement via admin panel',
        }),
      })
      if (!res.ok) throw new Error('Failed to record payment')
      setActionSuccess('Payment recorded successfully.')
      if (onRefresh) onRefresh()
    } catch (err: any) {
      alert(err.message || 'Error recording payment')
    } finally {
      setLoadingAction(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-[#0e0c24] text-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/15 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header: Matching Screenshot 2 ("Invoice #1019" + status pill) */}
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
          {/* Green Status Banner matching Screenshot 2 */}
          {invoice.isPaid ? (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{invoice.paidBannerText || `Invoice Paid on ${invoice.dueOn}`}</span>
            </div>
          ) : (
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-sm font-medium">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Payment due: {invoice.dueOn} • Balance: {invoice.formattedBalanceDue}</span>
              </div>
              <button
                onClick={handleRecordPayment}
                disabled={loadingAction}
                className="text-xs bg-[#8978ff] hover:bg-[#9b8cff] text-white font-semibold px-3 py-1 rounded-full transition-colors cursor-pointer"
              >
                Collect Now
              </button>
            </div>
          )}

          {actionSuccess && (
            <div className="text-xs text-emerald-300 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
              {actionSuccess}
            </div>
          )}

          {/* Dates & From/To Metadata matching Screenshot 2 */}
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

          {/* Items Section matching Screenshot 2 */}
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
                <tfoot className="bg-white/[0.03] border-t border-white/10 text-sm font-semibold text-white">
                  <tr>
                    <td colSpan={3} className="py-3 px-4">
                      Total
                    </td>
                    <td className="py-3 px-4 text-right">{invoice.formattedTotal}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Bottom Actions matching Screenshot 2 */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-white/[0.02] border-t border-white/10">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/15 text-white text-sm font-medium transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-white/70" />
            <span>Download Receipt</span>
          </button>

          {invoice.isPaid ? (
            <button
              onClick={handleMarkUnpaid}
              disabled={loadingAction}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              <span>Mark as Unpaid</span>
            </button>
          ) : (
            <button
              onClick={handleRecordPayment}
              disabled={loadingAction}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#8978ff] hover:bg-[#9b8cff] text-white text-sm font-semibold transition-all shadow-[0_4px_20px_rgba(137,120,255,0.4)] cursor-pointer disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4" />
              <span>Record Payment</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
