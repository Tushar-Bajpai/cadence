'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

// Clean print view (plan Phase 6: "Print = a clean /admin/invoices/[id]/print
// page styled for window.print()"). Data comes from the same detail payload as
// the admin modal so the printed copy is always the real invoice.
export default function PrintInvoicePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/invoices/${params.id}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load invoice')
        setInvoice(data)
      } catch (err: any) {
        setError(err.message || 'Error loading invoice')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-sm text-white/50 font-mono">
        Loading invoice…
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-sm text-rose-300 font-mono">
        {error || 'Invoice not found.'}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">
      {/* Screen-only toolbar (hidden when printing) */}
      <div className="print:hidden flex items-center justify-between mb-6">
        <Link
          href="/admin/invoices"
          className="text-xs font-mono uppercase tracking-[0.2em] text-[#a79aff] hover:text-white transition-colors"
        >
          ← Back to invoices
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#8978ff] hover:bg-[#9b8cff] text-white text-xs font-semibold shadow-[0_4px_20px_rgba(137,120,255,0.4)] transition-all cursor-pointer"
        >
          Print invoice
        </button>
      </div>

      {/* Print sheet: light, plain, optimized for paper */}
      <div className="print-sheet bg-white text-[#1a1a2e] rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.35)] p-8 sm:p-12">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-neutral-200 pb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cadence</h1>
            <p className="text-xs text-neutral-500 mt-1">by CodeLifters</p>
          </div>
          <div className="sm:text-right">
            <p className="font-mono text-sm font-bold">{invoice.number}</p>
            <p className="text-xs text-neutral-500 mt-1">Issued {invoice.issuedOn}</p>
            <p className="text-xs text-neutral-500">Due {invoice.dueOn}</p>
            {invoice.period && (
              <p className="text-xs text-neutral-500">Period {invoice.period}</p>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-8 py-8">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-2">
              From
            </p>
            <p className="text-sm font-semibold">{invoice.from.name}</p>
            <p className="text-xs text-neutral-500 mt-1 whitespace-pre-line">{invoice.from.address}</p>
            <p className="text-xs text-neutral-500">{invoice.from.email}</p>
          </div>
          <div className="sm:text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-2">
              Billed to
            </p>
            <p className="text-sm font-semibold">{invoice.to.name}</p>
            <p className="text-xs text-neutral-500 mt-1">{invoice.to.company}</p>
            <p className="text-xs text-neutral-500">{invoice.to.email}</p>
          </div>
        </div>

        <table className="w-full text-left text-xs border-t border-neutral-200">
          <thead>
            <tr className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400 border-b border-neutral-200">
              <th className="py-2.5">Description</th>
              <th className="py-2.5 text-right">Qty</th>
              <th className="py-2.5 text-right">Unit price</th>
              <th className="py-2.5 text-right">Tax</th>
              <th className="py-2.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {invoice.items.map((item: any) => (
              <tr key={item.id}>
                <td className="py-2.5">{item.description}</td>
                <td className="py-2.5 text-right">{item.quantity}</td>
                <td className="py-2.5 text-right">{item.formattedUnitPrice}</td>
                <td className="py-2.5 text-right">{item.formattedTaxAmount}</td>
                <td className="py-2.5 text-right font-semibold">{item.formattedAmount}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <div className="w-full sm:w-72 space-y-1.5 text-xs">
            {invoice.discounts.map((d: any) => (
              <div key={d.id} className="flex justify-between text-violet-600">
                <span>{d.label}</span>
                <span>−{d.formattedAmount}</span>
              </div>
            ))}
            <div className="flex justify-between text-neutral-500 border-t border-neutral-200 pt-2">
              <span>Subtotal</span>
              <span>{invoice.formattedSubtotal}</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>Tax</span>
              <span>{invoice.formattedTaxTotal}</span>
            </div>
            {invoice.discountTotal > 0 && (
              <div className="flex justify-between text-violet-600">
                <span>Discounts</span>
                <span>−{invoice.formattedDiscountTotal}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm border-t border-neutral-200 pt-2">
              <span>Total</span>
              <span>{invoice.formattedTotal}</span>
            </div>
            {invoice.amountPaid > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Paid</span>
                <span>{invoice.formattedAmountPaid}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm">
              <span>Balance due</span>
              <span>{invoice.formattedBalanceDue}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
