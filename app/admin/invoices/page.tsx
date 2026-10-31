'use client'

import React, { useState, useEffect } from 'react'
import {
  FileText,
  Search,
  Filter,
  Download,
  CreditCard,
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
} from 'lucide-react'
import { InvoiceModal, InvoiceDetailData } from '@/components/admin/invoice-modal'
import { RunBillingModal } from '@/components/admin/run-billing-modal'
import { TableSkeleton } from '@/components/ui/skeleton'

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetailData | null>(null)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const [isRunBillingOpen, setIsRunBillingOpen] = useState(false)

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const res = await fetch(
        `/api/invoices?page=${page}&limit=20&status=${statusFilter}&search=${encodeURIComponent(search)}`
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load invoices')
      setInvoices(data.invoices ?? [])
      setPagination(data.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 1 })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const initialSearch = new URLSearchParams(window.location.search).get('search')
    if (initialSearch !== null) setSearch(initialSearch)
  }, [])

  useEffect(() => {
    fetchInvoices()
  }, [statusFilter, page, search])

  const handleOpenInvoice = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch invoice')
      setSelectedInvoice(data)
      setIsInvoiceModalOpen(true)
    } catch (err: any) {
      alert(err.message || 'Error opening invoice')
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-10 py-8 space-y-6 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-[#a79aff] text-[10px] tracking-[0.25em] font-mono uppercase mb-1">
            AUTOMATED BILLING LOG
          </p>
          <h1 className="text-3xl font-normal tracking-[-0.085em]">
            Invoices & Collections. <em className="italic text-[#8978ff]">Never Billed Twice.</em>
          </h1>
          <p className="text-xs text-white/60 mt-1 font-mono">
            Deterministic batch runs with composite idempotency keys
          </p>
        </div>

        <button
          onClick={() => setIsRunBillingOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#8978ff] hover:bg-[#9b8cff] text-white text-xs font-semibold shadow-[0_4px_20px_rgba(137,120,255,0.4)] transition-all cursor-pointer"
        >
          <Zap className="w-4 h-4 fill-white" />
          <span>Run Billing Batch</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/[0.03] p-4 rounded-2xl border border-white/10 backdrop-blur-xl">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search by invoice number or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) =>
              e.key === 'Enter' && (setPage(1), fetchInvoices())
            }
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white/[0.04] text-white placeholder-white/40 border border-white/10 focus:outline-none focus:border-[#8978ff] focus:ring-1 focus:ring-[#8978ff]"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'PAID', 'OVERDUE', 'CONFIRMED', 'DRAFT'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:bg-white/10'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.3)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.02] border-b border-white/10 text-[10px] font-mono text-white/40 uppercase tracking-[0.18em]">
              <tr>
                <th className="py-3 px-6">Invoice #</th>
                <th className="py-3 px-6">Customer</th>
                <th className="py-3 px-6">Plan Description</th>
                <th className="py-3 px-6">Issue Date</th>
                <th className="py-3 px-6">Due Date</th>
                <th className="py-3 px-6">Amount</th>
                <th className="py-3 px-6">Outstanding</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {loading && invoices.length === 0 ? (
                <TableSkeleton columns={9} rows={6} />
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-white/40 font-mono">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => handleOpenInvoice(inv.id)}
                    className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-6 font-mono font-bold text-white">
                      {inv.number}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white">{inv.customerName}</div>
                      <div className="text-[11px] text-white/40 font-mono">{inv.customerEmail}</div>
                    </td>
                    <td className="py-4 px-6 text-white/80">{inv.description}</td>
                    <td className="py-4 px-6 text-white/60 font-mono">{inv.date}</td>
                    <td className="py-4 px-6 text-white/60 font-mono">{inv.dueDate}</td>
                    <td className="py-4 px-6 font-bold text-white">
                      {inv.formattedAmount}
                    </td>
                    <td className="py-4 px-6 font-mono">
                      {inv.outstanding > 0 ? (
                        <span className="text-amber-400 font-semibold">{inv.formattedOutstanding}</span>
                      ) : (
                        <span className="text-white/40">₹0.00</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {inv.status === 'PAID' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Paid
                        </span>
                      ) : inv.status === 'OVERDUE' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          Overdue
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          {inv.status}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenInvoice(inv.id)
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#8978ff] hover:text-[#9b8cff] transition-colors cursor-pointer"
                      >
                        <span>View</span>
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="flex items-center justify-between gap-4 text-xs font-mono text-white/50 px-1">
          <span>
            {pagination.total} invoice{pagination.total === 1 ? '' : 's'} • page{' '}
            {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/10 text-white/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Prev
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/10 text-white/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <InvoiceModal
        invoice={selectedInvoice}
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onInvoiceUpdate={setSelectedInvoice}
        onRefresh={fetchInvoices}
      />

      <RunBillingModal
        isOpen={isRunBillingOpen}
        onClose={() => setIsRunBillingOpen(false)}
        onSuccess={fetchInvoices}
      />
    </div>
  )
}
