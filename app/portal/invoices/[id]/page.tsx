'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { PortalTopNavbar } from '@/components/portal/portal-top-navbar'
import { RazorpayPaymentModal } from '@/components/razorpay-payment-modal'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Building,
  Mail,
  Phone,
  Calendar,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react'

export default function PortalInvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = params?.id as string

  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [isPayingMock, setIsPayingMock] = useState(false)

  // Razorpay Modal state
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false)

  const fetchInvoice = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/portal/invoices/${invoiceId}`)
      if (res.status === 404) {
        setNotFound(true)
        return
      }
      if (res.status === 401) {
        router.push('/auth')
        return
      }
      const data = await res.json()
      if (data.error) {
        setNotFound(true)
      } else {
        setInvoice(data)
      }
    } catch (err) {
      console.error('Error fetching invoice:', err)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (invoiceId) fetchInvoice()
  }, [invoiceId])

  // Mock "Pay now" button that records a payment (Phase 8 stretch requirement)
  const handleMockPayNow = async () => {
    try {
      setIsPayingMock(true)
      const res = await fetch(`/api/portal/invoices/${invoiceId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'CARD',
          note: 'Instant settlement via Customer Portal Pay Now button',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Payment failed')
      setNotice(data.message || 'Invoice paid successfully!')
      setTimeout(() => setNotice(null), 5000)
      await fetchInvoice()
    } catch (err: any) {
      alert(err.message || 'Payment failed')
    } finally {
      setIsPayingMock(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#05051a] text-white flex flex-col font-sans antialiased relative">
        <PortalTopNavbar activeTab="invoices" />
        <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white">Invoice Not Found (404)</h1>
          <p className="text-sm text-white/50 max-w-md mx-auto">
            This invoice does not exist or you do not have permission to view it. Customer isolation guarantees access control across accounts.
          </p>
          <Link
            href="/portal/invoices"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Invoices</span>
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#05051a] text-white flex flex-col font-sans antialiased selection:bg-[#8978ff]/30 selection:text-white relative print:bg-white print:text-black">
      {/* Visual Ambient - hidden during print */}
      <div className="fixed inset-0 pointer-events-none opacity-40 [background-image:radial-gradient(circle_at_25%_10%,rgba(113,86,255,.35),transparent_40%),radial-gradient(circle_at_80%_65%,rgba(82,67,244,.2),transparent_45%)] print:hidden" />
      <div className="fixed inset-0 opacity-[0.035] pointer-events-none noise-overlay print:hidden" />

      {/* Top Navbar - hidden during print */}
      <div className="print:hidden">
        <PortalTopNavbar activeTab="invoices" />
      </div>

      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 print:p-0 print:max-w-none">
        {/* Navigation & Actions Bar - hidden during print */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <Link
            href="/portal/invoices"
            className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Invoices</span>
          </Link>

          <div className="flex items-center gap-2.5">
            {/* Print View Shortcut */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition cursor-pointer"
              title="Print View / Save PDF"
            >
              <Printer className="w-3.5 h-3.5 text-white/70" />
              <span>Print View</span>
            </button>

            {/* Pay Now buttons if unpaid */}
            {invoice && !invoice.isPaid && invoice.canPay && (
              <>
                <button
                  disabled={isPayingMock}
                  onClick={handleMockPayNow}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8978ff] hover:bg-[#9b8cff] text-white text-xs font-semibold transition shadow-md cursor-pointer"
                  title="Mock Pay Now (records payment directly)"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{isPayingMock ? 'Processing...' : 'Pay Now (Mock)'}</span>
                </button>

                <button
                  onClick={() => setIsRazorpayModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-md cursor-pointer"
                  title="Pay with Razorpay (UPI, Cards, Netbanking)"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Pay via Razorpay</span>
                </button>
              </>
            )}
          </div>
        </div>

        {notice && (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2.5 print:hidden">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl bg-white/[0.03] border border-white/10 p-6 sm:p-10 space-y-8 print:hidden" aria-busy="true">
            <Skeleton className="h-12 w-full rounded-2xl" />
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-12 w-36 rounded-xl" />
            </div>
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        ) : invoice ? (
          /* Printable Invoice Sheet */
          <div className="rounded-3xl bg-[#0b0924]/90 backdrop-blur-xl border border-white/10 p-6 sm:p-10 space-y-8 shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
            {/* Status Alert Banner */}
            <div
              className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between print:border-black print:bg-gray-100 ${
                invoice.isPaid
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 print:text-emerald-800'
                  : invoice.isOverdue
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 print:text-rose-800'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300 print:text-amber-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {invoice.isPaid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
                <span>{invoice.paidBannerText}</span>
              </div>
              <span className="font-mono uppercase tracking-wider">{invoice.status}</span>
            </div>

            {/* Header: Company & Invoice Info */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b border-white/10 print:border-gray-300">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#8978ff] flex items-center justify-center font-bold text-white text-sm">
                    C
                  </div>
                  <span className="text-xl font-extrabold tracking-tight text-white print:text-black">
                    Cadence
                  </span>
                </div>
                <div className="mt-3 text-xs text-white/50 print:text-gray-600 space-y-0.5">
                  <p className="font-medium text-white print:text-black">{invoice.from.name}</p>
                  <p>{invoice.from.address}</p>
                  <p>{invoice.from.email}</p>
                  <p>{invoice.from.phone}</p>
                </div>
              </div>

              <div className="sm:text-right space-y-1">
                <span className="text-2xl font-mono font-bold text-white print:text-black block">
                  {invoice.number}
                </span>
                <p className="text-xs text-white/40 print:text-gray-500">
                  Subscription: <span className="text-white print:text-black font-medium">{invoice.subscriptionNumber}</span>
                </p>
                <div className="mt-3 text-xs space-y-0.5 text-white/60 print:text-gray-700">
                  <p>
                    <span className="text-white/40 print:text-gray-500">Issued On: </span>
                    <span className="font-medium text-white print:text-black">{invoice.issuedOn}</span>
                  </p>
                  <p>
                    <span className="text-white/40 print:text-gray-500">Due Date: </span>
                    <span className={`font-medium ${invoice.isOverdue ? 'text-rose-400 font-bold' : 'text-white print:text-black'}`}>
                      {invoice.dueOn}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Bill To */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div>
                <span className="font-mono uppercase tracking-wider text-white/40 print:text-gray-500 block mb-1">
                  Billed To:
                </span>
                <p className="font-bold text-sm text-white print:text-black">{invoice.to.name}</p>
                {invoice.to.company && invoice.to.company !== 'Subscriber' && (
                  <p className="text-white/80 print:text-gray-700">{invoice.to.company}</p>
                )}
                <p className="text-white/60 print:text-gray-600">{invoice.to.address}</p>
                <p className="text-white/60 print:text-gray-600">{invoice.to.email}</p>
                {invoice.to.phone && invoice.to.phone !== '—' && (
                  <p className="text-white/60 print:text-gray-600">{invoice.to.phone}</p>
                )}
              </div>

              <div className="sm:text-right">
                <span className="font-mono uppercase tracking-wider text-white/40 print:text-gray-500 block mb-1">
                  Billing Period:
                </span>
                <p className="text-white/80 print:text-gray-700 font-medium">
                  {invoice.periodStart} &ndash; {invoice.periodEnd}
                </p>
                <p className="text-white/40 print:text-gray-500 mt-1">
                  Plan: {invoice.planName}
                </p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 print:border-gray-300 text-white/40 print:text-gray-600">
                    <th className="py-3 px-2 font-medium">Item Description</th>
                    <th className="py-3 px-2 font-medium text-center">Qty</th>
                    <th className="py-3 px-2 font-medium text-right">Unit Price</th>
                    <th className="py-3 px-2 font-medium text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 print:divide-gray-200">
                  {invoice.items.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-3.5 px-2 text-white print:text-black font-medium">
                        {item.description}
                      </td>
                      <td className="py-3.5 px-2 text-center text-white/70 print:text-gray-700">
                        {item.quantity}
                      </td>
                      <td className="py-3.5 px-2 text-right text-white/70 print:text-gray-700">
                        {item.formattedUnitPrice}
                      </td>
                      <td className="py-3.5 px-2 text-right font-semibold text-white print:text-black">
                        {item.formattedAmount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Breakdown */}
            <div className="pt-4 border-t border-white/10 print:border-gray-300 flex flex-col sm:flex-row justify-between gap-6">
              <div className="text-xs text-white/40 print:text-gray-500 space-y-1">
                <p>All taxes calculated automatically per registered tax jurisdictions.</p>
                <p>Payment terms apply. Unpaid invoices past due date are subject to reminder notices.</p>
              </div>

              <div className="w-full sm:w-72 space-y-2 text-xs">
                <div className="flex justify-between text-white/70 print:text-gray-700">
                  <span>Subtotal:</span>
                  <span className="font-mono">{invoice.formattedSubtotal}</span>
                </div>

                {invoice.taxTotal > 0 && (
                  <div className="flex justify-between text-white/70 print:text-gray-700">
                    <span>Tax (GST / Sales Tax):</span>
                    <span className="font-mono">{invoice.formattedTaxTotal}</span>
                  </div>
                )}

                {invoice.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-400 print:text-emerald-700">
                    <span>Discount:</span>
                    <span className="font-mono">-{invoice.formattedDiscountTotal}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-white/10 print:border-gray-300 flex justify-between text-base font-bold text-white print:text-black">
                  <span>Total Amount:</span>
                  <span className="font-mono">{invoice.formattedTotal}</span>
                </div>

                <div className="flex justify-between text-white/60 print:text-gray-600">
                  <span>Amount Paid:</span>
                  <span className="font-mono text-emerald-400 print:text-emerald-700">
                    {invoice.formattedAmountPaid}
                  </span>
                </div>

                <div className="flex justify-between text-sm font-semibold text-white print:text-black pt-1">
                  <span>Balance Due:</span>
                  <span className={`font-mono ${invoice.balanceDue > 0 ? 'text-amber-300 print:text-amber-700' : 'text-emerald-400 print:text-emerald-700'}`}>
                    {invoice.formattedBalanceDue}
                  </span>
                </div>
              </div>
            </div>

            {/* Payments History List */}
            {invoice.payments && invoice.payments.length > 0 && (
              <div className="pt-6 border-t border-white/10 print:border-gray-300 space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-white/40 print:text-gray-500">
                  Recorded Payments & Receipts ({invoice.payments.length})
                </h3>
                <div className="space-y-2">
                  {invoice.payments.map((p: any) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-white/[0.03] print:bg-gray-50 border border-white/5 print:border-gray-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 print:text-emerald-800 font-semibold font-mono text-[10px]">
                          {p.method}
                        </span>
                        <span className="text-white/70 print:text-gray-700">{p.date}</span>
                        {p.note && (
                          <span className="text-white/40 print:text-gray-500 italic">
                            &bull; {p.note}
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-emerald-400 print:text-emerald-700">
                        {p.formattedAmount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </main>

      {/* Razorpay Checkout Modal */}
      {invoice && (
        <RazorpayPaymentModal
          isOpen={isRazorpayModalOpen}
          onClose={() => setIsRazorpayModalOpen(false)}
          invoiceId={invoice.id}
          invoiceSeq={invoice.seq}
          amount={invoice.balanceDue > 0 ? invoice.balanceDue : invoice.total}
          formattedAmount={invoice.balanceDue > 0 ? invoice.formattedBalanceDue : invoice.formattedTotal}
          onSuccess={() => {
            setNotice('Payment settled successfully via Razorpay!')
            setTimeout(() => setNotice(null), 5000)
            setIsRazorpayModalOpen(false)
            fetchInvoice()
          }}
        />
      )}
    </div>
  )
}
