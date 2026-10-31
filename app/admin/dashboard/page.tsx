'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  TrendingUp,
  CreditCard,
  AlertCircle,
  Clock,
  CheckCircle2,
  Filter,
  RefreshCw,
  Zap,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  User,
  ExternalLink,
  Layers,
  ChevronDown,
} from 'lucide-react'
import { RecordPaymentModal } from '@/components/admin/record-payment-modal'
import { Skeleton, TableSkeleton } from '@/components/ui/skeleton'
import { format, subDays, startOfYear } from 'date-fns'

interface SummaryData {
  metrics: {
    activeSubscriptions: number
    mrr: number
    formattedMrr: string
    revenueCollected: number
    formattedRevenueCollected: string
    outstanding: number
    formattedOutstanding: string
    overdueInvoicesCount: number
    overdueAmount: number
    formattedOverdueAmount: string
    totalSubscriptions: number
  }
  charts: {
    monthlyRevenue: Array<{
      month: string
      label: string
      revenue: number
      formattedRevenue: string
    }>
    subscriptionsByStatus: Array<{
      status: string
      count: number
      percentage: number
      color: string
    }>
  }
  overdueInvoices: Array<{
    id: string
    seq: number
    number: string
    customerName: string
    customerEmail: string
    companyName: string
    planName: string
    issueDate: string
    dueDate: string
    daysOverdue: number
    total: number
    formattedTotal: string
    amountPaid: number
    formattedAmountPaid: string
    balanceDue: number
    formattedBalanceDue: string
  }>
  customers: Array<{
    id: string
    name: string
    email: string
    company: string
    displayName: string
  }>
}

export default function FinanceDashboardPage() {
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)

  // Filters state
  const [from, setFrom] = useState<string>('')
  const [to, setTo] = useState<string>('')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [activePreset, setActivePreset] = useState<'ALL' | '30D' | '90D' | 'YTD'>('ALL')

  // Payment Recording Modal
  const [selectedOverdueInvoice, setSelectedOverdueInvoice] = useState<any>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const fetchSummary = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      if (selectedCustomerId) params.set('customerId', selectedCustomerId)
      if (selectedStatus) params.set('status', selectedStatus)

      const res = await fetch(`/api/reports/summary?${params.toString()}`)
      const json = await res.json()
      if (res.ok) {
        setData(json)
      } else {
        console.error('Error fetching summary:', json.error)
      }
    } catch (err) {
      console.error('Failed to load finance dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [from, to, selectedCustomerId, selectedStatus])

  // Quick preset handlers
  const handlePreset = (preset: 'ALL' | '30D' | '90D' | 'YTD') => {
    setActivePreset(preset)
    const now = new Date()
    if (preset === 'ALL') {
      setFrom('')
      setTo('')
    } else if (preset === '30D') {
      setFrom(format(subDays(now, 30), 'yyyy-MM-dd'))
      setTo(format(now, 'yyyy-MM-dd'))
    } else if (preset === '90D') {
      setFrom(format(subDays(now, 90), 'yyyy-MM-dd'))
      setTo(format(now, 'yyyy-MM-dd'))
    } else if (preset === 'YTD') {
      setFrom(format(startOfYear(now), 'yyyy-MM-dd'))
      setTo(format(now, 'yyyy-MM-dd'))
    }
  }

  const handleOpenPayment = (inv: any) => {
    setSelectedOverdueInvoice(inv)
    setIsPaymentModalOpen(true)
  }

  const handlePaymentSuccess = () => {
    setNotice('Payment recorded successfully! Ledger and revenue updated.')
    setTimeout(() => setNotice(null), 4000)
    fetchSummary()
  }

  // Custom Tooltip for Recharts Monthly Revenue
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      return (
        <div className="rounded-xl bg-[#0e0c24] border border-white/20 p-3 shadow-xl text-xs">
          <p className="font-semibold text-white">{item.label}</p>
          <p className="text-[#a79aff] font-mono font-bold mt-1">
            Revenue: ₹{Number(item.revenue).toLocaleString()}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full text-white space-y-8 pb-16">
      {/* 1. Page Header */}
      <div className="border-b border-white/10 px-6 sm:px-10 py-8 lg:py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Finance & Performance Dashboard
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-white/60 max-w-2xl leading-relaxed">
              Real-time MRR tracking, multi-period revenue aggregation, and ledger-backed overdue management.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={fetchSummary}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/80 hover:text-white transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#8978ff]' : ''}`} />
              <span>Refresh</span>
            </button>

            <Link
              href="/admin/invoices"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8978ff] hover:bg-[#9b8cff] text-white text-xs font-semibold transition shadow-md"
            >
              <span>Manage Invoices</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {notice && (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2.5 animate-in slide-in-from-top-2 duration-200">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* 2. Filter Bar */}
        <div className="rounded-3xl bg-white/[0.03] backdrop-blur-md border border-white/10 p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Date Preset Buttons */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-white/40 mr-1 font-mono uppercase text-[10px]">Range:</span>
              {(['ALL', '30D', '90D', 'YTD'] as const).map((preset) => (
                <button
                  key={preset}
                  onClick={() => handlePreset(preset)}
                  className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                    activePreset === preset
                      ? 'bg-[#8978ff] text-white shadow-sm'
                      : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {preset === 'ALL'
                    ? 'All Time'
                    : preset === '30D'
                    ? 'Last 30 Days'
                    : preset === '90D'
                    ? 'Last 90 Days'
                    : 'Year to Date'}
                </button>
              ))}
            </div>

            {/* Custom Filter Inputs: Date pickers, Customer, Status */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {/* Date From */}
              <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/10 rounded-xl px-2.5 py-1">
                <span className="text-[10px] text-white/40 uppercase font-mono">From:</span>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value)
                    setActivePreset('ALL')
                  }}
                  className="bg-transparent text-white text-xs focus:outline-none [color-scheme:dark]"
                />
              </div>

              {/* Date To */}
              <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/10 rounded-xl px-2.5 py-1">
                <span className="text-[10px] text-white/40 uppercase font-mono">To:</span>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value)
                    setActivePreset('ALL')
                  }}
                  className="bg-transparent text-white text-xs focus:outline-none [color-scheme:dark]"
                />
              </div>

              {/* Customer Selector */}
              <div className="relative">
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="h-8 bg-white/[0.04] border border-white/10 rounded-xl px-3 pr-8 text-xs text-white appearance-none focus:outline-none focus:border-[#8978ff] cursor-pointer"
                >
                  <option value="" className="bg-[#0e0c24] text-white">
                    All Customers
                  </option>
                  {data?.customers?.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#0e0c24] text-white">
                      {c.displayName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-white/40 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Status Selector */}
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="h-8 bg-white/[0.04] border border-white/10 rounded-xl px-3 pr-8 text-xs text-white appearance-none focus:outline-none focus:border-[#8978ff] cursor-pointer"
                >
                  <option value="" className="bg-[#0e0c24] text-white">
                    All Statuses
                  </option>
                  <option value="ACTIVE" className="bg-[#0e0c24] text-white">
                    Active
                  </option>
                  <option value="CONFIRMED" className="bg-[#0e0c24] text-white">
                    Confirmed
                  </option>
                  <option value="QUOTATION" className="bg-[#0e0c24] text-white">
                    Quotation
                  </option>
                  <option value="DRAFT" className="bg-[#0e0c24] text-white">
                    Draft
                  </option>
                  <option value="CLOSED" className="bg-[#0e0c24] text-white">
                    Closed
                  </option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-white/40 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Clear filters button */}
              {(from || to || selectedCustomerId || selectedStatus) && (
                <button
                  onClick={() => {
                    setFrom('')
                    setTo('')
                    setSelectedCustomerId('')
                    setSelectedStatus('')
                    setActivePreset('ALL')
                  }}
                  className="text-xs text-rose-300 hover:text-rose-200 transition underline cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 3. Summary Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Active Subscriptions */}
          <div className="rounded-3xl bg-white/[0.03] backdrop-blur-md border border-white/10 p-5 flex flex-col justify-between hover:border-white/20 transition relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white/50">Active Subscriptions</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold text-white">
                {data?.metrics?.activeSubscriptions ?? 0}
              </div>
              <p className="text-[11px] text-white/40 mt-1">
                Out of {data?.metrics?.totalSubscriptions ?? 0} total subs
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-emerald-400 font-medium">Live contracts</span>
              <Link href="/admin/subscriptions" className="text-[#8978ff] hover:underline">
                View &rarr;
              </Link>
            </div>
          </div>

          {/* Card 2: Normalized MRR */}
          <div className="rounded-3xl bg-white/[0.03] backdrop-blur-md border border-white/10 p-5 flex flex-col justify-between hover:border-white/20 transition relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white/50">Normalized MRR</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#8978ff]/15 text-[#a79aff] border border-[#8978ff]/30">
                Monthly Run-Rate
              </span>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold text-white">
                {data?.metrics?.formattedMrr || '₹0.00'}
              </div>
              <p className="text-[11px] text-white/40 mt-1">
                Normalized across all plan periods
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-white/40">D/W/M/Y normalized</span>
              <span className="text-[#a79aff] font-mono text-[11px]">Active subs</span>
            </div>
          </div>

          {/* Card 3: Revenue Collected */}
          <div className="rounded-3xl bg-white/[0.03] backdrop-blur-md border border-white/10 p-5 flex flex-col justify-between hover:border-white/20 transition relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white/50">Revenue Collected</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold text-white">
                {data?.metrics?.formattedRevenueCollected || '₹0.00'}
              </div>
              <p className="text-[11px] text-white/40 mt-1">
                Total settled payments in range
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-white/40">Ledger confirmed</span>
              <Link href="/admin/payments" className="text-[#8978ff] hover:underline">
                Payments &rarr;
              </Link>
            </div>
          </div>

          {/* Card 4: Total Outstanding */}
          <div className="rounded-3xl bg-white/[0.03] backdrop-blur-md border border-white/10 p-5 flex flex-col justify-between hover:border-white/20 transition relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white/50">Outstanding Balance</span>
              <CreditCard className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold text-amber-300">
                {data?.metrics?.formattedOutstanding || '₹0.00'}
              </div>
              <p className="text-[11px] text-white/40 mt-1">
                Confirmed unpaid receivables
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-white/40">Confirmed invoices</span>
              <Link href="/admin/invoices" className="text-[#8978ff] hover:underline">
                Invoices &rarr;
              </Link>
            </div>
          </div>

          {/* Card 5: Overdue Invoices */}
          <div className="rounded-3xl bg-white/[0.03] backdrop-blur-md border border-white/10 p-5 flex flex-col justify-between hover:border-white/20 transition relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white/50">Overdue Invoices</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                Past Due
              </span>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold text-rose-400">
                {data?.metrics?.overdueInvoicesCount ?? 0}
              </div>
              <p className="text-[11px] text-rose-300/80 mt-1 font-semibold">
                {data?.metrics?.formattedOverdueAmount || '₹0.00'} at risk
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-rose-400">Action needed</span>
              <a href="#overdue-section" className="text-rose-300 hover:underline">
                Review &rarr;
              </a>
            </div>
          </div>
        </div>

        {/* 4. Visualizations: Monthly Revenue Bar Chart + Subscriptions by Status */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Revenue by Month Bar Chart */}
          <div className="lg:col-span-8 rounded-3xl bg-white/[0.03] backdrop-blur-md border border-white/10 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/80">
                  Revenue Collection by Month
                </h3>
                <p className="text-xs text-white/40 mt-0.5">
                  Monthly aggregated payments with date_trunc performance index.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-semibold">
                Total: {data?.metrics?.formattedRevenueCollected}
              </span>
            </div>

            <div className="h-72 w-full pt-4">
              {isClient && data?.charts?.monthlyRevenue ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.charts.monthlyRevenue}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      stroke="rgba(255,255,255,0.4)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.4)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                    />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Bar
                      dataKey="revenue"
                      fill="#8978ff"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full rounded-2xl bg-white/[0.02] p-6 space-y-4" aria-busy="true">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-40 w-full rounded-xl" />
                </div>
              )}
            </div>
          </div>

          {/* Subscriptions by Status Breakdown */}
          <div className="lg:col-span-4 rounded-3xl bg-white/[0.03] backdrop-blur-md border border-white/10 p-6 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white/80">
                Subscriptions by Status
              </h3>
              <p className="text-xs text-white/40 mt-0.5">
                Distribution across lifecycle states.
              </p>
            </div>

            {/* Donut chart */}
            <div className="h-44 w-full flex items-center justify-center relative">
              {isClient && data?.charts?.subscriptionsByStatus ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.charts.subscriptionsByStatus}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={68}
                      paddingAngle={3}
                    >
                      {data.charts.subscriptionsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Skeleton className="w-32 h-32 rounded-full" />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-white">
                  {data?.metrics?.totalSubscriptions ?? 0}
                </span>
                <span className="text-[10px] text-white/40 uppercase font-mono">Total</span>
              </div>
            </div>

            {/* Status pills list */}
            <div className="space-y-2 text-xs pt-2 border-t border-white/10">
              {data?.charts?.subscriptionsByStatus?.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-white/80 font-medium">{item.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono font-semibold">{item.count}</span>
                    <span className="text-white/40 text-[11px]">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 5. Overdue Invoices Table with Record Payment shortcut */}
        <div id="overdue-section" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
                <span>Overdue Invoices Requiring Settlement</span>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  {data?.overdueInvoices?.length || 0} Listed
                </span>
              </h2>
              <p className="text-xs text-white/50 mt-1">
                Unpaid CONFIRMED invoices sorted oldest past-due first. Click "Record Payment" to settle immediately.
              </p>
            </div>
          </div>

          <div className="rounded-3xl bg-white/[0.03] backdrop-blur-md border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-white/40">
                    <th className="py-3.5 px-6 font-medium">Invoice #</th>
                    <th className="py-3.5 px-6 font-medium">Customer / Company</th>
                    <th className="py-3.5 px-6 font-medium">Due Date</th>
                    <th className="py-3.5 px-6 font-medium">Overdue Duration</th>
                    <th className="py-3.5 px-6 font-medium">Total</th>
                    <th className="py-3.5 px-6 font-medium">Outstanding Balance</th>
                    <th className="py-3.5 px-6 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <TableSkeleton columns={7} rows={5} />
                  ) : data?.overdueInvoices && data.overdueInvoices.length > 0 ? (
                    data.overdueInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-white/[0.04] transition group">
                        <td className="py-4 px-6 font-mono font-bold text-white">
                          <Link
                            href={`/admin/invoices`}
                            className="hover:text-[#a79aff] transition-colors"
                          >
                            {inv.number}
                          </Link>
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-semibold text-white">{inv.customerName}</p>
                          <p className="text-white/40 text-[11px]">{inv.companyName}</p>
                        </td>
                        <td className="py-4 px-6 text-white/70">{inv.dueDate}</td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            {inv.daysOverdue} {inv.daysOverdue === 1 ? 'day' : 'days'} overdue
                          </span>
                        </td>
                        <td className="py-4 px-6 text-white font-semibold">{inv.formattedTotal}</td>
                        <td className="py-4 px-6 font-mono font-extrabold text-amber-300 text-sm">
                          {inv.formattedBalanceDue}
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {/* Record Payment Shortcut */}
                            <button
                              onClick={() => handleOpenPayment(inv)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition text-xs shadow-sm cursor-pointer"
                              title="Record payment against this overdue invoice"
                            >
                              <Zap className="w-3.5 h-3.5" />
                              <span>Record Payment</span>
                            </button>

                            <Link
                              href={`/admin/invoices`}
                              className="p-1.5 rounded-xl bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition"
                              title="View Invoice"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-white/40">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400/50 mx-auto mb-2" />
                        <p className="font-medium text-white/70">No overdue invoices!</p>
                        <p className="text-[11px] text-white/40 mt-0.5">
                          All customer invoices are currently up to date or settled.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
        invoice={selectedOverdueInvoice}
      />
    </div>
  )
}
