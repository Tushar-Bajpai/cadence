'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  CreditCard,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Receipt,
  ArrowUpRight,
  Banknote,
  Wallet,
  CircleDollarSign,
  Filter,
} from 'lucide-react'
import { InvoiceModal, InvoiceDetailData } from '@/components/admin/invoice-modal'

interface PaymentItem {
  id: string
  invoiceId: string
  invoiceSeq: number
  invoiceNumber: string
  customerName: string
  customerEmail: string
  method: string
  amount: number
  formattedAmount: string
  date: string
  rawDate: string
  note: string | null
  invoiceTotal: number
  invoiceAmountPaid: number
  invoiceStatus: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

const METHOD_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  CARD: { label: 'Card', icon: <CreditCard className="w-3.5 h-3.5" />, color: 'text-blue-300 bg-blue-500/15 border-blue-500/30' },
  UPI: { label: 'UPI', icon: <Wallet className="w-3.5 h-3.5" />, color: 'text-violet-300 bg-violet-500/15 border-violet-500/30' },
  BANK_TRANSFER: { label: 'Bank Transfer', icon: <Banknote className="w-3.5 h-3.5" />, color: 'text-teal-300 bg-teal-500/15 border-teal-500/30' },
  CASH: { label: 'Cash', icon: <CircleDollarSign className="w-3.5 h-3.5" />, color: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30' },
  CHEQUE: { label: 'Cheque', icon: <Receipt className="w-3.5 h-3.5" />, color: 'text-amber-300 bg-amber-500/15 border-amber-500/30' },
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [methodFilter, setMethodFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Invoice modal
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetailData | null>(null)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)

  const fetchPayments = useCallback(async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '20')
      if (methodFilter !== 'ALL') params.set('method', methodFilter)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      if (search) params.set('search', search)

      const res = await fetch(`/api/payments?${params}`)
      const data = await res.json()
      if (data.payments) {
        setPayments(data.payments)
        setPagination(data.pagination)
      }
    } catch (err) {
      console.error('Error fetching payments:', err)
    } finally {
      setLoading(false)
    }
  }, [methodFilter, dateFrom, dateTo, search])

  useEffect(() => {
    fetchPayments(1)
  }, [methodFilter, dateFrom, dateTo])

  const handleOpenInvoice = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`)
      const data = await res.json()
      if (res.ok) {
        setSelectedInvoice(data)
        setIsInvoiceModalOpen(true)
      }
    } catch (err: any) {
      console.error('Error opening invoice:', err)
    }
  }

  // Compute summary stats
  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-10 py-8 space-y-6 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-[#a79aff] text-[10px] tracking-[0.25em] font-mono uppercase mb-1">
            FINANCIAL RECORDS
          </p>
          <h1 className="text-3xl font-normal tracking-[-0.085em]">
            Payments & Collections.{' '}
            <em className="italic text-[#8978ff]">Every Rupee Tracked.</em>
          </h1>
          <p className="text-xs text-white/60 mt-1 font-mono">
            {pagination.total} payment{pagination.total !== 1 ? 's' : ''} recorded
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/[0.03] p-4 rounded-2xl border border-white/10 backdrop-blur-xl">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search by customer, email or note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchPayments(1)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white/[0.04] text-white placeholder-white/40 border border-white/10 focus:outline-none focus:border-[#8978ff] focus:ring-1 focus:ring-[#8978ff]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Method pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {['ALL', 'CARD', 'UPI', 'BANK_TRANSFER', 'CASH', 'CHEQUE'].map((m) => (
                <button
                  key={m}
                  onClick={() => setMethodFilter(m)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    methodFilter === m
                      ? 'bg-white/20 text-white'
                      : 'text-white/60 hover:bg-white/10'
                  }`}
                >
                  {m === 'ALL' ? 'All' : METHOD_LABELS[m]?.label || m}
                </button>
              ))}
            </div>

            {/* Date filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                showFilters || dateFrom || dateTo
                  ? 'bg-[#8978ff]/20 border-[#8978ff]/40 text-[#8978ff]'
                  : 'bg-white/[0.04] border-white/10 text-white/40 hover:text-white/60'
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Extended date filters */}
        {showFilters && (
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white/[0.02] p-4 rounded-2xl border border-white/10 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Calendar className="w-4 h-4 text-white/40 shrink-0" />
              <span className="text-xs text-white/50 whitespace-nowrap">From</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-white/[0.04] text-white border border-white/10 focus:outline-none focus:border-[#8978ff] [color-scheme:dark]"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-white/50 whitespace-nowrap">To</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-white/[0.04] text-white border border-white/10 focus:outline-none focus:border-[#8978ff] [color-scheme:dark]"
              />
            </div>
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(''); setDateTo(''); }}
                className="text-xs text-rose-300 hover:text-rose-200 transition-colors cursor-pointer whitespace-nowrap"
              >
                Clear dates
              </button>
            )}
          </div>
        )}
      </div>

      {/* Payments Table */}
      <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.3)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.02] border-b border-white/10 text-[10px] font-mono text-white/40 uppercase tracking-[0.18em]">
              <tr>
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6">Customer</th>
                <th className="py-3 px-6">Invoice</th>
                <th className="py-3 px-6">Method</th>
                <th className="py-3 px-6">Amount</th>
                <th className="py-3 px-6">Invoice Status</th>
                <th className="py-3 px-6">Note</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {loading && payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-white/40 font-mono">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#8978ff] border-t-transparent rounded-full animate-spin" />
                      Loading payments...
                    </div>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-white/40 font-mono">
                    No payments found.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const methodInfo = METHOD_LABELS[p.method] || {
                    label: p.method,
                    icon: <CreditCard className="w-3.5 h-3.5" />,
                    color: 'text-white/60 bg-white/10 border-white/20',
                  }

                  const outstanding = Math.max(0, p.invoiceTotal - p.invoiceAmountPaid)
                  const isOverdue = p.invoiceStatus === 'CONFIRMED' && outstanding > 0

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-white/[0.04] transition-colors group"
                    >
                      <td className="py-4 px-6 text-white/60 font-mono whitespace-nowrap">
                        {p.date}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-white">{p.customerName}</div>
                        <div className="text-[11px] text-white/40 font-mono">{p.customerEmail}</div>
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleOpenInvoice(p.invoiceId)}
                          className="font-mono font-bold text-[#8978ff] hover:text-[#a79aff] transition-colors cursor-pointer flex items-center gap-1"
                        >
                          {p.invoiceNumber}
                          <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${methodInfo.color}`}>
                          {methodInfo.icon}
                          {methodInfo.label}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-bold text-white">
                        {p.formattedAmount}
                      </td>
                      <td className="py-4 px-6">
                        {p.invoiceStatus === 'PAID' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Paid
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            Overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            {p.invoiceStatus}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-white/50 max-w-[200px] truncate text-[11px]">
                        {p.note || '—'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleOpenInvoice(p.invoiceId)}
                          className="text-xs font-semibold text-[#8978ff] hover:text-[#9b8cff] transition-colors cursor-pointer"
                        >
                          View Invoice
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-white/[0.02]">
            <p className="text-xs text-white/40 font-mono">
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchPayments(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-2 rounded-lg bg-white/[0.04] border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-white/60 min-w-[60px] text-center">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchPayments(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-2 rounded-lg bg-white/[0.04] border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Detail Modal */}
      <InvoiceModal
        invoice={selectedInvoice}
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onRefresh={() => fetchPayments(pagination.page)}
      />
    </div>
  )
}
