'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PortalTopNavbar } from '@/components/portal/portal-top-navbar'
import { RazorpayPaymentModal } from '@/components/razorpay-payment-modal'
import { TableSkeleton } from '@/components/ui/skeleton'
import {
  Download,
  Filter,
  Eye,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Receipt,
} from 'lucide-react'

export default function PortalInvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'CONFIRMED' | 'OVERDUE'>('ALL')
  const [notice, setNotice] = useState<string | null>(null)

  // Razorpay Modal state
  const [razorpayInvoice, setRazorpayInvoice] = useState<{
    id: string
    seq: number
    amount: number
    formattedAmount: string
  } | null>(null)
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false)

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/portal/invoices')
      if (res.status === 401) {
        router.push('/auth')
        return
      }
      const data = await res.json()
      if (Array.isArray(data)) {
        setInvoices(data)
      }
    } catch (err) {
      console.error('Error fetching invoices:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  const handlePayInvoice = (inv: any) => {
    setRazorpayInvoice({
      id: inv.id,
      seq: inv.seq,
      amount: inv.balanceDue > 0 ? inv.balanceDue : inv.total,
      formattedAmount: inv.balanceDue > 0 ? inv.formattedBalanceDue : inv.formattedTotal,
    })
    setIsRazorpayModalOpen(true)
  }

  const handleQuickMockPay = async (invId: string) => {
    try {
      const res = await fetch(`/api/portal/invoices/${invId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'CARD' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Payment failed')
      setNotice(data.message)
      setTimeout(() => setNotice(null), 4000)
      fetchInvoices()
    } catch (err: any) {
      alert(err.message || 'Payment error')
    }
  }

  const now = new Date()

  const filteredInvoices = invoices.filter((inv) => {
    const isOverdue = inv.status === 'CONFIRMED' && new Date(inv.dueOn) < now && inv.balanceDue > 0

    if (statusFilter === 'PAID' && !inv.isPaid) return false
    if (statusFilter === 'CONFIRMED' && inv.status !== 'CONFIRMED') return false
    if (statusFilter === 'OVERDUE' && !isOverdue) return false

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        inv.number?.toLowerCase().includes(q) ||
        inv.planName?.toLowerCase().includes(q) ||
        inv.status?.toLowerCase().includes(q) ||
        String(inv.seq).includes(q)
      )
    }
    return true
  })

  return (
    <div className="min-h-screen bg-[#05051a] text-white flex flex-col font-sans antialiased selection:bg-[#8978ff]/30 selection:text-white relative">
      <div className="fixed inset-0 pointer-events-none opacity-40 [background-image:radial-gradient(circle_at_25%_10%,rgba(113,86,255,.35),transparent_40%),radial-gradient(circle_at_80%_65%,rgba(82,67,244,.2),transparent_45%)]" />
      <div className="fixed inset-0 opacity-[0.035] pointer-events-none noise-overlay" />

      <PortalTopNavbar
        activeTab="invoices"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {notice && (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2.5 animate-in slide-in-from-top-2 duration-200">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <span>Invoices & Receipts</span>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-white/10 text-white/70">
                {invoices.length} Total
              </span>
            </h1>
            <p className="mt-1 text-sm text-white/50">
              Deterministic billing history, full payment receipts, and instant settlement.
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-4 text-xs">
          {(['ALL', 'CONFIRMED', 'PAID', 'OVERDUE'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3.5 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                statusFilter === filter
                  ? 'bg-[#8978ff] text-white shadow-sm'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {filter === 'ALL'
                ? 'All Invoices'
                : filter === 'CONFIRMED'
                ? 'Pending'
                : filter.charAt(0) + filter.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Invoices Table */}
        <div className="rounded-3xl bg-white/[0.03] backdrop-blur-md border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-white/40">
                  <th className="py-3.5 px-6 font-medium">Invoice #</th>
                  <th className="py-3.5 px-6 font-medium">Plan / Item</th>
                  <th className="py-3.5 px-6 font-medium">Issued Date</th>
                  <th className="py-3.5 px-6 font-medium">Due Date</th>
                  <th className="py-3.5 px-6 font-medium">Total</th>
                  <th className="py-3.5 px-6 font-medium">Outstanding</th>
                  <th className="py-3.5 px-6 font-medium">Status</th>
                  <th className="py-3.5 px-6 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <TableSkeleton columns={8} rows={6} />
                ) : filteredInvoices.length > 0 ? (
                  filteredInvoices.map((inv) => {
                    const isOverdue =
                      inv.status === 'CONFIRMED' &&
                      new Date(inv.dueOn) < now &&
                      inv.balanceDue > 0

                    return (
                      <tr
                        key={inv.id}
                        className="hover:bg-white/[0.04] transition group cursor-pointer"
                        onClick={() => router.push(`/portal/invoices/${inv.id}`)}
                      >
                        <td className="py-4 px-6 text-white font-mono font-semibold">
                          {inv.number}
                        </td>
                        <td className="py-4 px-6 text-white font-medium">{inv.planName}</td>
                        <td className="py-4 px-6 text-white/70">{inv.issuedOn}</td>
                        <td className="py-4 px-6 text-white/70">
                          <span className={isOverdue ? 'text-rose-400 font-semibold' : ''}>
                            {inv.dueOn}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-white font-bold">{inv.formattedTotal}</td>
                        <td className="py-4 px-6 font-mono">
                          {inv.balanceDue > 0 ? (
                            <span className="text-amber-300 font-semibold">
                              {inv.formattedBalanceDue}
                            </span>
                          ) : (
                            <span className="text-emerald-400">₹0.00</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              inv.isPaid
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : isOverdue
                                ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                : inv.status === 'CONFIRMED'
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : 'bg-white/10 text-white/60'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                inv.isPaid
                                  ? 'bg-emerald-400'
                                  : isOverdue
                                  ? 'bg-rose-400'
                                  : 'bg-amber-400'
                              }`}
                            />
                            {isOverdue ? 'Overdue' : inv.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {!inv.isPaid && inv.status === 'CONFIRMED' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handlePayInvoice(inv)
                                }}
                                className="px-3 py-1 rounded-xl bg-[#8978ff] hover:bg-[#9b8cff] text-white font-semibold transition text-xs shadow-sm cursor-pointer"
                              >
                                Pay Now
                              </button>
                            )}
                            <Link
                              href={`/portal/invoices/${inv.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-xl bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
                              title="View Invoice & Print"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-white/40">
                      No invoices found matching the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Razorpay Checkout Modal */}
      {razorpayInvoice && (
        <RazorpayPaymentModal
          isOpen={isRazorpayModalOpen}
          onClose={() => setIsRazorpayModalOpen(false)}
          invoiceId={razorpayInvoice.id}
          invoiceSeq={razorpayInvoice.seq}
          amount={razorpayInvoice.amount}
          formattedAmount={razorpayInvoice.formattedAmount}
          onSuccess={() => {
            setNotice('Payment completed successfully via Razorpay!')
            setTimeout(() => setNotice(null), 4000)
            setIsRazorpayModalOpen(false)
            fetchInvoices()
          }}
        />
      )}
    </div>
  )
}
