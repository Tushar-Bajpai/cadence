'use client'

import React, { useState, useEffect } from 'react'
import {
  PortalTopNavbar,
  PortalTab,
} from '@/components/portal/portal-top-navbar'
import { PaymentCardModal } from '@/components/portal/payment-card-modal'
import { RazorpayPaymentModal } from '@/components/razorpay-payment-modal'
import { CatalogView } from '@/components/portal/catalog-view'
import { InvoiceModal, InvoiceDetailData } from '@/components/admin/invoice-modal'
import { usePortalStore } from '@/stores/use-portal-store'
import {
  Rocket,
  Download,
  Filter,
  Plus,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  Pause,
  Play,
  RotateCcw,
  AlertCircle,
  Eye,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Check,
  Building,
  LogOut,
  ReceiptText,
  UserPlus,
  PauseCircle,
  CircleCheck,
} from 'lucide-react'
import { useAuthStore } from '@/stores/use-auth-store'
import { Skeleton } from '@/components/ui/skeleton'

export default function CustomerPortalPage() {
  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    refreshKey,
    triggerRefresh,
  } = usePortalStore()
  const [loading, setLoading] = useState(true)

  // Portal Summary Data
  const [summaryData, setSummaryData] = useState<any>(null)
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [profileData, setProfileData] = useState<any>(null)

  // Modals
  const [isCardModalOpen, setIsCardModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetailData | null>(null)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const [razorpayInvoice, setRazorpayInvoice] = useState<{ id: string; seq: number; amount: number; formattedAmount: string } | null>(null)
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false)

  // Active Payment Method State (dynamically loaded from DB)
  const [paymentMethod, setPaymentMethod] = useState<{
    brand: string
    last4: string
    maskedNumber: string
    cardholder: string
    validThru: string
  } | null>(null)

  // Action status message
  const [bannerNotice, setBannerNotice] = useState<string | null>(null)

  const fetchPortalData = async () => {
    try {
      setLoading(true)
      const [sumRes, subsRes, invRes, profRes] = await Promise.all([
        fetch('/api/portal/summary'),
        fetch('/api/portal/subscriptions'),
        fetch('/api/portal/invoices'),
        fetch('/api/portal/profile'),
      ])

      const summary = await sumRes.json()
      const subs = await subsRes.json()
      const invs = await invRes.json()
      const prof = await profRes.json()

      if (summary && !summary.error) {
        setSummaryData(summary)
        if (summary.paymentMethod) {
          setPaymentMethod(summary.paymentMethod)
        }
      }
      if (Array.isArray(subs)) setSubscriptions(subs)
      if (Array.isArray(invs)) setInvoices(invs)
      if (prof && !prof.error) setProfileData(prof)
    } catch (err) {
      console.error('Error fetching portal data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPortalData()
  }, [])

  // Open invoice detail modal (matching Image 3 right card)
  const handleOpenInvoiceModal = async (invoiceIdOrSeq: string | number) => {
    try {
      const res = await fetch(`/api/portal/invoices/${invoiceIdOrSeq}`)
      const data = await res.json()
      if (data && !data.error) {
        setSelectedInvoice(data)
        setIsInvoiceModalOpen(true)
      }
    } catch (err) {
      console.error('Error fetching invoice details:', err)
    }
  }

  // Quick pay invoice from table — opens Razorpay checkout
  const handlePayInvoice = (invoiceId: string) => {
    const inv = invoices.find((i: any) => i.id === invoiceId)
    if (!inv) return
    setRazorpayInvoice({
      id: inv.id,
      seq: inv.seq,
      amount: inv.balanceDue > 0 ? inv.balanceDue : inv.total,
      formattedAmount: inv.balanceDue > 0 ? inv.formattedBalanceDue : inv.formattedTotal,
    })
    setIsRazorpayModalOpen(true)
  }

  const handleRazorpaySuccess = () => {
    setBannerNotice('Payment successful! Invoice updated.')
    setTimeout(() => setBannerNotice(null), 4000)
    setIsRazorpayModalOpen(false)
    fetchPortalData()
  }

  // Self-service subscription lifecycle actions
  const handleSubscriptionAction = async (subId: string, action: 'pause' | 'resume' | 'close') => {
    try {
      const res = await fetch(`/api/portal/subscriptions/${subId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Action failed')
      setBannerNotice(data.message)
      setTimeout(() => setBannerNotice(null), 4000)
      fetchPortalData()
    } catch (err: any) {
      alert(err.message || 'Action error')
    }
  }

  // Filtered invoices for search
  const filteredInvoices = invoices.filter((inv) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      inv.number?.toLowerCase().includes(q) ||
      inv.planName?.toLowerCase().includes(q) ||
      inv.status?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="min-h-screen bg-[#05051a] text-white flex flex-col font-sans antialiased selection:bg-[#8978ff]/30 selection:text-white relative">
      {/* Editorial ambient radial gradients matching landing page */}
      <div className="fixed inset-0 pointer-events-none opacity-40 [background-image:radial-gradient(circle_at_25%_10%,rgba(113,86,255,.35),transparent_40%),radial-gradient(circle_at_80%_65%,rgba(82,67,244,.2),transparent_45%)]" />
      <div className="fixed inset-0 opacity-[0.035] pointer-events-none noise-overlay" />

      {/* Top Navbar matching Image 4 */}
      <PortalTopNavbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        customerName={summaryData?.customer?.name || 'Customer'}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner notification */}
        {bannerNotice && (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2.5 animate-in slide-in-from-top-2 duration-200">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{bannerNotice}</span>
          </div>
        )}

        {/* =========================================================================
            TAB 1: BILLING & OVERVIEW (Directly matching Image 2 FeatherDev Billing)
           ========================================================================= */}
        {activeTab === 'billing' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Header: Billing title + subtitle */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Billing
              </h1>
              <p className="mt-1.5 text-sm sm:text-base text-white/50 max-w-2xl">
                Manage your subscription, view payment history, and update your billing details — all in one place.
              </p>
            </div>

            {/* Phase 8 Summary Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-white/60">
                  Account & Billing Overview
                </h2>
                <div className="flex items-center gap-3 text-xs">
                  <a href="/portal/subscriptions" className="text-[#8978ff] hover:underline">
                    All Subscriptions &rarr;
                  </a>
                  <span className="text-white/20">&bull;</span>
                  <a href="/portal/invoices" className="text-[#8978ff] hover:underline">
                    All Invoices &rarr;
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Summary Card 1: Active Subscriptions */}
                <div className="rounded-3xl bg-white/[0.03] backdrop-blur-md border border-white/10 p-5 flex flex-col justify-between hover:border-white/15 transition relative overflow-hidden group">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/50 block font-medium">Active Subscriptions</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        {summaryData?.metrics?.activeSubsCount ?? 0} Active
                      </span>
                    </div>
                    <div className="mt-3">
                      <h3 className="text-lg font-bold text-white">
                        {summaryData?.currentPlan?.planName || 'No Active Plan'}
                      </h3>
                      {summaryData?.currentPlan ? (
                        <div className="mt-1 flex items-baseline gap-1">
                          <span className="text-2xl font-extrabold text-white">
                            ₹{summaryData.currentPlan.price}
                          </span>
                          <span className="text-xs text-white/50">
                            / {summaryData.currentPlan.periodLabel || 'Month'}
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-white/40 mt-1">No recurring plan configured.</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-white/40">
                      {summaryData?.currentPlan?.isPaused ? 'Paused' : 'Auto-renewing'}
                    </span>
                    <a href="/portal/subscriptions" className="text-[#8978ff] hover:underline font-medium">
                      Manage &rarr;
                    </a>
                  </div>
                </div>

                {/* Summary Card 2: Outstanding Amount */}
                <div className="rounded-3xl bg-white/[0.03] backdrop-blur-md border border-white/10 p-5 flex flex-col justify-between hover:border-white/15 transition relative overflow-hidden group">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/50 block font-medium">Outstanding Amount</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          (summaryData?.metrics?.totalOutstanding ?? 0) > 0
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {(summaryData?.metrics?.totalOutstanding ?? 0) > 0 ? 'Payment Due' : 'All Settled'}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="text-2xl font-extrabold text-white">
                        {summaryData?.metrics?.formattedTotalOutstanding || '₹0.00'}
                      </div>
                      <p className="text-xs text-white/40 mt-1">
                        Settled rate:{' '}
                        <span className="text-white font-medium">
                          {summaryData?.usage?.invoicingProgress?.percentage ?? 100}%
                        </span>{' '}
                        ({summaryData?.usage?.invoicingProgress?.settled ?? 0}/{summaryData?.usage?.invoicingProgress?.total ?? 0})
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-white/40">Invoices balance</span>
                    <a href="/portal/invoices" className="text-[#8978ff] hover:underline font-medium">
                      View all &rarr;
                    </a>
                  </div>
                </div>

                {/* Summary Card 3: Next Invoice */}
                <div className="rounded-3xl bg-white/[0.03] backdrop-blur-md border border-white/10 p-5 flex flex-col justify-between hover:border-white/15 transition relative overflow-hidden group">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/50 block font-medium">Next Invoice</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#8978ff]/15 text-[#a79aff] border border-[#8978ff]/30">
                        Scheduled
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="text-xl font-bold text-white">
                        {summaryData?.metrics?.nextInvoiceDate || 'None scheduled'}
                      </div>
                      <p className="text-xs text-white/40 mt-1">
                        Est. amount:{' '}
                        <span className="text-white font-semibold">
                          {summaryData?.metrics?.nextInvoiceAmount || '₹0.00'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-white/40">Auto-billing run</span>
                    <button
                      onClick={() => setActiveTab('catalog')}
                      className="text-[#8978ff] hover:underline font-medium cursor-pointer"
                    >
                      Upgrade &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 1: Subscription Overview */}
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-white/60">
                Subscription Overview
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Current Plan Card */}
                <div className="rounded-3xl bg-white/[0.03] backdrop-blur-md border border-white/10 p-6 flex flex-col justify-between hover:border-white/15 transition relative overflow-hidden">
                  {loading ? (
                    <div className="space-y-5" aria-hidden="true">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-7 w-40" />
                      <Skeleton className="h-10 w-32" />
                      <Skeleton className="h-3 w-48" />
                      <Skeleton className="h-9 w-40 rounded-2xl" />
                    </div>
                  ) : summaryData?.currentPlan ? (
                    <>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs text-white/50 block font-medium">
                            Current Plan
                          </span>
                          <div className="mt-2.5 flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              {summaryData.currentPlan.planName}
                            </span>
                            {summaryData.currentPlan.isPaused && (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                Paused
                              </span>
                            )}
                          </div>
                          <div className="mt-4 flex items-baseline gap-1">
                            <span className="text-3xl sm:text-4xl font-extrabold text-white">
                              ₹{summaryData.currentPlan.price}
                            </span>
                            <span className="text-sm text-white/50">
                              / {summaryData.currentPlan.periodLabel || 'Month'}
                            </span>
                          </div>
                          <p className="text-xs text-white/40 mt-1">
                            Next renewal: {summaryData.currentPlan.nextBillingDate}
                          </p>
                        </div>

                        <button
                          onClick={() => setActiveTab('catalog')}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#0e0c24] border border-white/20 hover:border-[#8978ff] text-white hover:text-[#8978ff] text-xs font-semibold transition shadow-md cursor-pointer"
                        >
                          <span>Upgrade</span>
                          <Rocket className="w-3.5 h-3.5 text-[#8978ff]" />
                        </button>
                      </div>

                      {summaryData.currentPlan.subscriptionId && (
                        <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 text-xs">
                          {summaryData.currentPlan.isPaused ? (
                            <button
                              onClick={() =>
                                handleSubscriptionAction(summaryData.currentPlan.subscriptionId, 'resume')
                              }
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition cursor-pointer"
                            >
                              <Play className="w-3 h-3" />
                              <span>Resume Subscription</span>
                            </button>
                          ) : (
                            summaryData.currentPlan.pausable && (
                              <button
                                onClick={() =>
                                  handleSubscriptionAction(summaryData.currentPlan.subscriptionId, 'pause')
                                }
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
                              >
                                <Pause className="w-3 h-3" />
                                <span>Pause Subscription</span>
                              </button>
                            )
                          )}

                          {summaryData.currentPlan.closable && (
                            <button
                              onClick={() =>
                                handleSubscriptionAction(summaryData.currentPlan.subscriptionId, 'close')
                              }
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition cursor-pointer ml-auto"
                            >
                              <span>Cancel Plan</span>
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col justify-between h-full py-2">
                      <div>
                        <span className="text-xs text-white/50 block font-medium">
                          Current Plan
                        </span>
                        <h3 className="text-lg font-bold text-white mt-2">No Active Subscription</h3>
                        <p className="text-xs text-white/40 mt-1">
                          You currently do not have an active billing plan. Browse our plans to subscribe.
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab('catalog')}
                        className="mt-6 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#8978ff] hover:bg-[#9b8cff] text-white text-xs font-semibold transition cursor-pointer w-full sm:w-auto self-start"
                      >
                        <span>Choose a Plan</span>
                        <Rocket className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Usage Summary Card matching screenshot 1 */}
                <div className="rounded-3xl bg-white/[0.03] backdrop-blur-md border border-white/10 p-6 flex flex-col justify-between hover:border-white/15 transition">
                  <div>
                    <span className="text-xs text-white/50 block font-medium">
                      Usage & Billing Cycle
                    </span>

                    {loading ? (
                      <div className="mt-5 space-y-6" aria-hidden="true">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-2 w-full rounded-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-2 w-full rounded-full" />
                      </div>
                    ) : <div className="mt-5 space-y-5">
                      {/* Meter 1: Billing Cycle Progress */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-semibold text-white">
                            {summaryData?.usage?.cycleProgress?.usedDays ?? 0} / {summaryData?.usage?.cycleProgress?.totalDays ?? 30} Days
                          </span>
                          <span className="text-white/40">{summaryData?.usage?.cycleProgress?.percentage ?? 0}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#8978ff] shadow-[0_0_8px_rgba(137,120,255,0.6)] transition-all duration-500"
                            style={{ width: `${summaryData?.usage?.cycleProgress?.percentage ?? 0}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-white/40 mt-1 block">
                          Current Billing Cycle Progress
                        </span>
                      </div>

                      {/* Meter 2: Invoices Settled Rate */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-semibold text-white">
                            {summaryData?.usage?.invoicingProgress?.settled ?? 0} / {summaryData?.usage?.invoicingProgress?.total ?? 0} Invoices
                          </span>
                          <span className="text-white/40">{summaryData?.usage?.invoicingProgress?.percentage ?? 100}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.5)] transition-all duration-500"
                            style={{ width: `${summaryData?.usage?.invoicingProgress?.percentage ?? 100}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-white/40 mt-1 block">
                          Settled Invoices Rate
                        </span>
                      </div>
                    </div>}
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-white/40 flex items-center justify-between">
                    <span>Outstanding: {summaryData?.metrics?.formattedTotalOutstanding || '₹0.00'}</span>
                    <button
                      onClick={() => setActiveTab('catalog')}
                      className="text-[#8978ff] hover:underline cursor-pointer"
                    >
                      Manage Plan &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Billing History Table matching screenshot 1 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-white/60">
                  Billing History
                </h2>
                <button
                  onClick={() => setActiveTab('invoices')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white/70 hover:text-white text-xs font-medium transition cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5 text-white/50" />
                  <span>Filter</span>
                </button>
              </div>

              {/* Table Container */}
              <div className="rounded-3xl bg-white/[0.03] backdrop-blur-md border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.02] text-white/40">
                        <th className="py-3.5 px-6 font-medium">Date</th>
                        <th className="py-3.5 px-6 font-medium">Description</th>
                        <th className="py-3.5 px-6 font-medium">Amount</th>
                        <th className="py-3.5 px-6 font-medium">Status</th>
                        <th className="py-3.5 px-6 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {summaryData?.billingHistory?.length > 0 ? (
                        summaryData.billingHistory.map((item: any, idx: number) => {
                          const isPaid = item.status === 'Paid'
                          const isFailed = item.status === 'Failed'

                          return (
                            <tr
                              key={item.id || idx}
                              onClick={() => handleOpenInvoiceModal(item.id || item.seq)}
                              className="hover:bg-white/[0.04] transition cursor-pointer group"
                            >
                              <td className="py-4 px-6 text-white/80 font-medium whitespace-nowrap">
                                {item.date}
                              </td>
                              <td className="py-4 px-6 text-white font-medium">
                                {item.description}
                              </td>
                              <td className="py-4 px-6 text-white font-semibold">
                                {item.formattedAmount}
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
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                    Pending
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-6 text-right whitespace-nowrap">
                                {isPaid ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleOpenInvoiceModal(item.id || item.seq)
                                    }}
                                    className="inline-flex items-center gap-1.5 text-white/70 hover:text-white font-medium transition cursor-pointer"
                                  >
                                    <span>Download Invoice</span>
                                    <Download className="w-3.5 h-3.5 text-[#8978ff]" />
                                  </button>
                                ) : isFailed ? (
                                  <span className="text-white/40 italic flex items-center justify-end gap-1">
                                    <span>No Action Available</span>
                                    <AlertCircle className="w-3.5 h-3.5" />
                                  </span>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handlePayInvoice(item.id)
                                    }}
                                    className="px-3 py-1 rounded-xl bg-[#8978ff] hover:bg-[#9b8cff] text-white font-semibold transition shadow-sm cursor-pointer"
                                  >
                                    Pay Now ⚡
                                  </button>
                                )}
                              </td>
                            </tr>
                          )
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-white/40">
                            No billing records generated yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Section 3: Payment Method matching screenshot 1 */}
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-white/60">
                Payment Method
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Visual Card (Rendered if payment method exists) */}
                {paymentMethod ? (
                  <div className="relative h-48 rounded-3xl p-6 flex flex-col justify-between overflow-hidden shadow-2xl border border-white/20 bg-gradient-to-tr from-[#2d2218] via-[#5c492c] to-[#92784d] group">
                    <div className="absolute inset-0 bg-white/5 opacity-20 pointer-events-none" />
                    <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />

                    <div className="flex items-center justify-between relative z-10">
                      <span className="font-extrabold text-xl italic tracking-wider text-white/95">
                        {paymentMethod.brand}
                      </span>
                      <button className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition cursor-pointer">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="relative z-10 tracking-[0.2em] font-mono text-base sm:text-lg font-bold text-white drop-shadow">
                      {paymentMethod.maskedNumber}
                    </div>

                    <div className="flex items-center justify-between relative z-10 text-[10px] uppercase font-mono tracking-wider text-white/70">
                      <div>
                        <span className="text-[8px] text-white/40 block">NAME</span>
                        <span className="font-semibold text-white">
                          {paymentMethod.cardholder}
                        </span>
                      </div>
                      <div>
                        <span className="text-[8px] text-white/40 block">VALID THRU</span>
                        <span className="font-semibold text-white">
                          {paymentMethod.validThru}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-48 rounded-3xl p-6 border border-white/10 bg-white/[0.02] flex flex-col justify-between">
                    <div>
                      <CreditCard className="w-6 h-6 text-[#8978ff] mb-2" />
                      <h4 className="text-sm font-bold text-white">No Payment Method on File</h4>
                      <p className="text-xs text-white/50 mt-1">
                        Add a credit or debit card to streamline automated subscription renewals.
                      </p>
                    </div>
                    <span className="text-[11px] text-white/40">Zero transaction fee on renewals</span>
                  </div>
                )}

                {/* + Add New Card Card matching screenshot 1 */}
                <button
                  type="button"
                  onClick={() => setIsCardModalOpen(true)}
                  className="h-48 rounded-3xl border-2 border-dashed border-white/15 hover:border-[#8978ff]/50 bg-white/[0.01] hover:bg-white/[0.04] transition flex flex-col items-center justify-center gap-3 text-white/60 hover:text-white cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-[#8978ff] border border-white/10 group-hover:border-[#8978ff] flex items-center justify-center text-white transition-all shadow-sm">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold">Add New Card</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: MY SUBSCRIPTIONS
           ========================================================================= */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  My Subscriptions
                </h2>
                <p className="text-sm text-white/50 mt-1">
                  Deterministic lifecycle state machine with policy switches.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('catalog')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#8978ff] hover:bg-[#9b8cff] text-white text-xs font-semibold transition shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Subscription</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {subscriptions.length > 0 ? (
                subscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="rounded-3xl bg-white/[0.03] backdrop-blur-md border border-white/10 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-semibold text-[#8978ff]">
                          {sub.number}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            sub.status === 'ACTIVE'
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : sub.status === 'CONFIRMED'
                              ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                              : sub.status === 'CLOSED'
                              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                              : 'bg-white/10 text-white/60 border border-white/20'
                          }`}
                        >
                          {sub.status}
                        </span>
                        {sub.isPaused && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            PAUSED
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-white mt-2">
                        {sub.plan?.name || 'Cadence Plan'}
                      </h3>

                      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/60">
                        <div>
                          <span className="text-white/40 block">Price:</span>
                          <span className="font-semibold text-white">{sub.plan?.formattedPrice} / {sub.plan?.billingPeriod?.toLowerCase()}</span>
                        </div>
                        <div>
                          <span className="text-white/40 block">Start Date:</span>
                          <span>{sub.startDate}</span>
                        </div>
                        <div>
                          <span className="text-white/40 block">Next Renewal:</span>
                          <span>{sub.nextBillingDate}</span>
                        </div>
                      </div>

                      {/* Line Items & Variant Add-ons */}
                      {sub.lines && sub.lines.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
                            Subscribed Products & Variant Add-ons ({sub.lines.length}):
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {sub.lines.map((line: any) => (
                              <div
                                key={line.id}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs"
                              >
                                <span className="text-white font-medium">{line.description}</span>
                                <span className="text-[#a79aff] font-mono">{line.formattedAmount}</span>
                                {sub.lines.length > 1 && (
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation()
                                      if (confirm(`Remove ${line.description} from subscription?`)) {
                                        const res = await fetch(`/api/portal/subscriptions/${sub.id}/lines?lineId=${line.id}`, { method: 'DELETE' })
                                        const d = await res.json()
                                        if (res.ok) {
                                          setBannerNotice(d.message)
                                          fetchPortalData()
                                        } else {
                                          alert(d.error)
                                        }
                                      }
                                    }}
                                    className="text-white/30 hover:text-rose-400 transition ml-1"
                                    title="Remove Addon Line"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ))}

                            <button
                              onClick={() => setActiveTab('catalog')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#8978ff]/10 hover:bg-[#8978ff]/20 border border-[#8978ff]/30 text-xs text-[#8978ff] font-medium transition cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Variant Add-on</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Self-service controls */}
                    <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                      {sub.isPaused ? (
                        <button
                          onClick={() => handleSubscriptionAction(sub.id, 'resume')}
                          className="px-3.5 py-2 rounded-xl bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-semibold transition cursor-pointer"
                        >
                          Resume Plan
                        </button>
                      ) : (
                        sub.plan?.pausable && (
                          <button
                            onClick={() => handleSubscriptionAction(sub.id, 'pause')}
                            className="px-3.5 py-2 rounded-xl bg-white/5 text-white/80 hover:text-white hover:bg-white/10 border border-white/10 text-xs font-semibold transition cursor-pointer"
                          >
                            Pause Plan
                          </button>
                        )
                      )}

                      {sub.plan?.closable && sub.status !== 'CLOSED' && (
                        <button
                          onClick={() => handleSubscriptionAction(sub.id, 'close')}
                          className="px-3.5 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 text-xs font-semibold transition cursor-pointer"
                        >
                          Cancel Plan
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl bg-white/[0.02] border border-white/10 p-12 text-center text-white/40">
                  No subscriptions found. Browse our plans to subscribe!
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: INVOICES & RECEIPTS
           ========================================================================= */}
        {activeTab === 'invoices' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Invoices & Receipts
              </h2>
              <p className="text-sm text-white/50 mt-1">
                Zero duplicate guarantee with idempotent invoice tracking. Click any invoice to inspect or download.
              </p>
            </div>

            <div className="rounded-3xl bg-white/[0.03] backdrop-blur-md border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02] text-white/40">
                      <th className="py-3.5 px-6 font-medium">Invoice #</th>
                      <th className="py-3.5 px-6 font-medium">Issued On</th>
                      <th className="py-3.5 px-6 font-medium">Due Date</th>
                      <th className="py-3.5 px-6 font-medium">Total</th>
                      <th className="py-3.5 px-6 font-medium">Status</th>
                      <th className="py-3.5 px-6 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredInvoices.length > 0 ? (
                      filteredInvoices.map((inv) => (
                        <tr
                          key={inv.id}
                          onClick={() => handleOpenInvoiceModal(inv.id)}
                          className="hover:bg-white/[0.04] transition cursor-pointer group"
                        >
                          <td className="py-4 px-6 text-white font-semibold">
                            {inv.number || `INV-${inv.seq}`}
                          </td>
                          <td className="py-4 px-6 text-white/70">{inv.issuedOn}</td>
                          <td className="py-4 px-6 text-white/70">{inv.dueOn}</td>
                          <td className="py-4 px-6 text-white font-bold">
                            {inv.formattedTotal}
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                inv.isPaid
                                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                  : inv.status === 'CONFIRMED'
                                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                  : 'bg-white/10 text-white/60'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  inv.isPaid ? 'bg-emerald-400' : 'bg-amber-400'
                                }`}
                              />
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              {!inv.isPaid && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handlePayInvoice(inv.id)
                                  }}
                                  className="px-3 py-1 rounded-xl bg-[#8978ff] hover:bg-[#9b8cff] text-white font-semibold transition text-xs cursor-pointer"
                                >
                                  Pay Now
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenInvoiceModal(inv.id)
                                }}
                                className="p-1.5 rounded-xl bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
                                title="View / Download"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-white/40">
                          No invoices matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: BROWSE CATALOG & ADD-ON VARIANTS (Phase 3 Backend Engine)
           ========================================================================= */}
        {activeTab === 'catalog' && (
          <CatalogView
            onSubscriptionCreated={() => {
              fetchPortalData()
              setActiveTab('billing')
            }}
          />
        )}

        {/* =========================================================================
            TAB 5: PROFILE & ACTIVITY (Matching Image 3 Left Card)
           ========================================================================= */}
        {activeTab === 'profile' && profileData && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
            {/* Left Card: Robert Fox Profile matching Image 3 */}
            <div className="lg:col-span-5 rounded-3xl bg-[#0e0c24] border border-white/10 p-6 flex flex-col space-y-6">
              {/* Profile Header with Sign Out Button */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 flex items-center justify-center text-amber-950 font-bold text-xl shadow-md">
                    <span>{profileData.name.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{profileData.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-[#8978ff] inline-block shadow-[0_0_8px_rgba(137,120,255,0.8)]" />
                      <span className="text-xs font-semibold text-[#a79aff]">
                        {profileData.role}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    await useAuthStore.getState().logout()
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                  title="Sign out of your customer account"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Sign Out</span>
                </button>
              </div>

              {/* Meta information matching Screenshot 2 */}
              <div className="space-y-3 pt-3 border-t border-white/10 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-white/40">Email:</span>
                  <span className="text-white font-medium">{profileData.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40">Phone:</span>
                  <span className="text-white font-medium">{profileData.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40">Joined:</span>
                  <span className="text-white font-medium">{profileData.joined}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40">Location:</span>
                  <span className="text-white font-medium">{profileData.location}</span>
                </div>
              </div>

              {/* Activity Timeline matching Screenshot 2 */}
              <div className="pt-4 border-t border-white/10 space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-white/50">
                  Activity Timeline
                </h4>

                <div className="space-y-6 text-xs">
                  {profileData.activity?.map((group: any, idx: number) => (
                    <div key={idx} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                          {group.date}
                        </span>
                        <span className="h-px flex-1 bg-white/10" />
                        <span className="text-[10px] text-white/30">
                          {group.events?.length ?? 0} {group.events?.length === 1 ? 'event' : 'events'}
                        </span>
                      </div>

                      <div className="relative space-y-3 pl-1">
                        <span className="absolute bottom-4 left-[15px] top-4 w-px bg-gradient-to-b from-[#8978ff]/50 via-white/10 to-transparent" />
                        {group.events?.map((ev: any) => {
                          const EventIcon =
                            ev.type === 'subscription'
                              ? UserPlus
                              : ev.type === 'invoice'
                              ? ReceiptText
                              : ev.type === 'payment'
                              ? CircleCheck
                              : PauseCircle
                          const tone =
                            ev.color === 'amber'
                              ? 'text-amber-300 bg-amber-400/10 border-amber-400/20'
                              : ev.color === 'blue'
                              ? 'text-blue-300 bg-blue-400/10 border-blue-400/20'
                              : ev.color === 'pink'
                              ? 'text-pink-300 bg-pink-400/10 border-pink-400/20'
                              : 'text-[#a79aff] bg-[#8978ff]/10 border-[#8978ff]/20'

                          return (
                            <div key={ev.id} className="relative flex items-start gap-3">
                              <div className={`relative z-10 grid size-7 shrink-0 place-items-center rounded-full border ${tone}`}>
                                <EventIcon className="size-3.5" />
                              </div>
                              <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.025] px-3 py-2.5 transition hover:border-white/20 hover:bg-white/[0.045]">
                                <p className="leading-relaxed text-white/75">
                                  <strong className="font-semibold text-white">{ev.actor}</strong>{' '}
                                  {ev.action}
                                </p>
                                {ev.body && (
                                  <p className="mt-1.5 leading-relaxed text-[11px] text-white/45">
                                    {ev.body}
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Card: Editable Details */}
            <div className="lg:col-span-7 rounded-3xl bg-[#0e0c24] border border-white/10 p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Company & Billing Profile</h3>
                <p className="text-xs text-white/50 mb-6">
                  Update your tax and invoice header attributes.
                </p>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block text-white/60 mb-1.5">Company Name</label>
                    <input
                      type="text"
                      defaultValue={profileData.companyName}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-white/60 mb-1.5">Billing Address</label>
                    <textarea
                      rows={3}
                      defaultValue={profileData.address}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-white/60 mb-1.5">Primary Contact</label>
                      <input
                        type="text"
                        defaultValue={profileData.name}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 mb-1.5">Phone Number</label>
                      <input
                        type="text"
                        defaultValue={profileData.phone}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 flex justify-end">
                <button
                  onClick={() => {
                    setBannerNotice('Company details saved successfully.')
                    setTimeout(() => setBannerNotice(null), 3000)
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#8978ff] hover:bg-[#9b8cff] text-white font-semibold text-xs transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Invoice Detail Modal (Image 3 right card) */}
      <InvoiceModal
        invoice={selectedInvoice}
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        mode="portal"
        onRefresh={() => {
          fetchPortalData()
          if (selectedInvoice) handleOpenInvoiceModal(selectedInvoice.id)
        }}
      />

      {/* Add Payment Card Modal */}
      <PaymentCardModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        onSuccess={(newCard) => {
          setPaymentMethod(newCard)
          setBannerNotice('Payment method saved and set as primary!')
          setTimeout(() => setBannerNotice(null), 3000)
        }}
      />

      {/* Razorpay Payment Modal */}
      {razorpayInvoice && (
        <RazorpayPaymentModal
          isOpen={isRazorpayModalOpen}
          onClose={() => { setIsRazorpayModalOpen(false); setRazorpayInvoice(null); }}
          onSuccess={handleRazorpaySuccess}
          invoiceId={razorpayInvoice.id}
          invoiceSeq={razorpayInvoice.seq}
          amount={razorpayInvoice.amount}
          formattedAmount={razorpayInvoice.formattedAmount}
          mode="portal"
        />
      )}
    </div>
  )
}
