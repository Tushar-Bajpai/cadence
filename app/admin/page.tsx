'use client'

import React, { useState, useEffect } from 'react'
import {
  Download,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  MoreHorizontal,
  Zap,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Info,
  CreditCard,
  Rocket,
  ArrowRight,
} from 'lucide-react'
import { InvoiceModal, InvoiceDetailData } from '@/components/admin/invoice-modal'
import { RunBillingModal } from '@/components/admin/run-billing-modal'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetailData | null>(null)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const [isRunBillingOpen, setIsRunBillingOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'FAILED'>('ALL')
  const [showFilterMenu, setShowFilterMenu] = useState(false)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/dashboard/stats')
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleOpenInvoiceModal = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`)
      const data = await res.json()
      if (res.ok) {
        setSelectedInvoice(data)
        setIsInvoiceModalOpen(true)
      } else {
        alert(data.error || 'Failed to fetch invoice')
      }
    } catch (err: any) {
      alert(err.message || 'Error opening invoice')
    }
  }

  // Filter invoices for table
  const displayedInvoices = (stats?.recentInvoices || []).filter((inv: any) => {
    if (statusFilter === 'PAID') return inv.status === 'PAID'
    if (statusFilter === 'FAILED') return inv.status === 'OVERDUE' || inv.status === 'CONFIRMED'
    return true
  })

  return (
    <div className="w-full text-white">
      {/* 1. Landing Page Ambient Editorial Header */}
      <div className="relative overflow-hidden border-b border-white/10 px-6 sm:px-10 py-10 lg:py-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div>
            <p className="eyebrow text-[#a79aff] text-[10px] tracking-[0.28em] font-mono uppercase mb-2">
              CADENCE BILLING ENGINE • OPERATIONS STUDIO
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-normal leading-[.92] tracking-[-0.085em]">
              Recurring billing.<br />
              <em className="font-serif italic text-[#8978ff]">Zero missed cycles.</em>
            </h1>
            <p className="mt-3.5 text-xs sm:text-sm text-white/70 max-w-xl leading-relaxed">
              Manage live subscriptions, monitor idempotent cycle batches, and audit collections in real time.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsRunBillingOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-[#8978ff] hover:bg-[#9b8cff] text-white text-xs font-semibold shadow-[0_10px_35px_rgba(137,120,255,.4)] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Run Billing Engine ⚡</span>
            </button>

            <button
              onClick={fetchDashboardData}
              className="p-3 rounded-full border border-white/20 bg-white/5 hover:bg-white/15 text-white/80 transition-colors backdrop-blur-md cursor-pointer"
              title="Refresh Stats"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-8 space-y-10">
        {/* 2. Subscription Overview matching Landing Page Glassmorphism */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-mono tracking-[0.2em] text-[#a79aff] uppercase font-bold">
              Subscription Overview
            </h2>
            <span className="text-[10px] font-mono text-white/40 uppercase">LIVE METRICS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Card: Current Plan */}
            <div className="md:col-span-5 bg-white/[0.04] backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:border-[#8978ff]/40 transition-all flex flex-col justify-between">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-white/50 mb-3">
                  Current Plan
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Pro Plan
                    </span>
                    <div className="mt-3 flex items-baseline gap-1.5">
                      <span className="text-3xl font-extrabold text-white tracking-tight">$29</span>
                      <span className="text-xs text-white/50 font-mono">/ Month</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsRunBillingOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#8978ff] hover:bg-[#9b8cff] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  >
                    <span>Upgrade</span>
                    <Rocket className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Card: Usage Summary */}
            <div className="md:col-span-7 bg-white/[0.04] backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:border-[#8978ff]/40 transition-all flex flex-col justify-between">
              <p className="text-xs font-mono uppercase tracking-wider text-white/50 mb-3">
                Usage Summary
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Metric 1: API Requests */}
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-base font-bold text-white tracking-tight">8,500 / 10,000</span>
                    <span className="text-xs font-mono font-bold text-[#8978ff]">85%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#8978ff] to-[#6042ec] h-1.5 rounded-full shadow-[0_0_12px_rgba(137,120,255,0.6)]"
                      style={{ width: '85%' }}
                    />
                  </div>
                  <p className="text-[11px] text-white/60 mt-2 font-medium">API Requests Used</p>
                </div>

                {/* Metric 2: Storage Used */}
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-base font-bold text-white tracking-tight">2 GB / 5 GB</span>
                    <span className="text-xs font-mono font-bold text-amber-400">40%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-400 to-amber-500 h-1.5 rounded-full"
                      style={{ width: '40%' }}
                    />
                  </div>
                  <p className="text-[11px] text-white/60 mt-2 font-medium">Storage Used</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Billing History Table matching Landing Page */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Billing History
            </h2>

            {/* Filter Button */}
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/20 bg-white/5 hover:bg-white/15 text-xs font-semibold text-white/80 transition-colors backdrop-blur-md cursor-pointer"
              >
                <span>Filter</span>
                <Filter className="w-3.5 h-3.5 text-white/50" />
              </button>

              {showFilterMenu && (
                <div className="absolute right-0 mt-2 w-44 bg-[#120e28] rounded-xl shadow-2xl border border-white/15 p-1.5 z-20 text-xs space-y-1 backdrop-blur-xl">
                  <button
                    onClick={() => {
                      setStatusFilter('ALL')
                      setShowFilterMenu(false)
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg cursor-pointer ${
                      statusFilter === 'ALL'
                        ? 'bg-white/15 font-bold text-white'
                        : 'text-white/70 hover:bg-white/10'
                    }`}
                  >
                    All Invoices
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter('PAID')
                      setShowFilterMenu(false)
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg cursor-pointer ${
                      statusFilter === 'PAID'
                        ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                        : 'text-white/70 hover:bg-white/10'
                    }`}
                  >
                    Paid
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter('FAILED')
                      setShowFilterMenu(false)
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg cursor-pointer ${
                      statusFilter === 'FAILED'
                        ? 'bg-rose-500/20 text-rose-300 font-bold'
                        : 'text-white/70 hover:bg-white/10'
                    }`}
                  >
                    Failed / Unpaid
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.3)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.02] border-b border-white/10 text-[10px] font-mono text-white/40 uppercase tracking-[0.18em]">
                  <tr>
                    <th className="py-3.5 px-6 font-normal">Date</th>
                    <th className="py-3.5 px-6 font-normal">Description</th>
                    <th className="py-3.5 px-6 font-normal">Amount</th>
                    <th className="py-3.5 px-6 font-normal">Status</th>
                    <th className="py-3.5 px-6 font-normal text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-xs">
                  {displayedInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-white/40 font-mono">
                        No billing history records matching current filter.
                      </td>
                    </tr>
                  ) : (
                    displayedInvoices.map((inv: any) => {
                      const isPaid = inv.status === 'PAID'
                      const isFailed = inv.status === 'OVERDUE' || inv.status === 'CONFIRMED'

                      const formattedDate = new Date(inv.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: '2-digit',
                        year: 'numeric',
                      })

                      return (
                        <tr
                          key={inv.id}
                          className="hover:bg-white/[0.04] transition-colors group cursor-pointer"
                          onClick={() => handleOpenInvoiceModal(inv.id)}
                        >
                          <td className="py-4 px-6 font-mono text-white/80 whitespace-nowrap">
                            {formattedDate}
                          </td>
                          <td className="py-4 px-6 text-white font-medium">
                            {inv.description}
                          </td>
                          <td className="py-4 px-6 text-white font-bold whitespace-nowrap">
                            ${Number(inv.amount).toFixed(2)}
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap">
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                Paid
                              </span>
                            ) : isFailed ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                Failed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-white/70 border border-white/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                                {inv.status}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right whitespace-nowrap">
                            {isPaid ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenInvoiceModal(inv.id)
                                }}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8978ff] hover:text-[#a79aff] transition-colors cursor-pointer"
                              >
                                <span>Download Invoice</span>
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <div className="inline-flex items-center gap-1 text-xs text-white/40">
                                <span>No Action Available</span>
                                <Info className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 4. Payment Method matching Landing Page & Reference */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white tracking-tight">
            Payment Method
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Visual Obsidian VISA Card */}
            <div className="md:col-span-5 relative h-52 rounded-2xl p-6 overflow-hidden shadow-2xl flex flex-col justify-between text-white select-none bg-gradient-to-tr from-[#141033] via-[#1a1444] to-[#251e60] border border-[#8978ff]/35">
              {/* Subtle ambient lighting */}
              <div className="absolute inset-0 bg-radial-gradient from-white/10 to-transparent pointer-events-none" />

              <div className="flex items-start justify-between relative z-10">
                <span className="font-extrabold italic text-xl tracking-wider text-white">
                  VISA
                </span>
                <button className="p-1 rounded-full hover:bg-white/10 transition-colors">
                  <MoreHorizontal className="w-5 h-5 text-white/70" />
                </button>
              </div>

              <div className="relative z-10 space-y-4">
                <div className="font-mono text-lg font-bold tracking-[0.18em] text-white">
                  1520 0100 3356 6888
                </div>

                <div className="flex items-center justify-between text-[10px] text-white/60 uppercase tracking-wider font-mono">
                  <div>
                    <p className="text-[9px] text-white/40">Cardholder</p>
                    <p className="font-bold text-white tracking-normal mt-0.5">Robert Fox</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-white/40">Valid Thru</p>
                    <p className="font-bold text-white tracking-normal mt-0.5">08/28</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Add New Card Glassmorphic Box */}
            <div className="md:col-span-7 bg-white/[0.03] backdrop-blur-xl rounded-2xl border-2 border-dashed border-white/15 hover:border-[#8978ff]/60 p-6 shadow-sm flex flex-col items-center justify-center transition-all group cursor-pointer min-h-[208px]">
              <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-[#8978ff]/20 flex items-center justify-center text-white/50 group-hover:text-[#8978ff] transition-colors mb-3">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-white group-hover:text-[#8978ff] transition-colors">
                Add New Card
              </span>
              <p className="text-[11px] text-white/40 mt-1">
                Link payment methods for automated subscription renewal
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Invoice Detail Modal */}
      <InvoiceModal
        invoice={selectedInvoice}
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onRefresh={() => {
          fetchDashboardData()
          if (selectedInvoice) handleOpenInvoiceModal(selectedInvoice.id)
        }}
      />

      {/* Invoicing Run Modal */}
      <RunBillingModal
        isOpen={isRunBillingOpen}
        onClose={() => setIsRunBillingOpen(false)}
        onSuccess={() => {
          fetchDashboardData()
        }}
      />
    </div>
  )
}
