'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { PortalTopNavbar } from '@/components/portal/portal-top-navbar'
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  FileText,
  CreditCard,
} from 'lucide-react'

export default function SubscriptionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const subId = params?.id as string

  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [actionInProgress, setActionInProgress] = useState(false)

  const fetchSubscription = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/portal/subscriptions/${subId}`)
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
        setSubscription(data)
      }
    } catch (err) {
      console.error('Error fetching subscription details:', err)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (subId) fetchSubscription()
  }, [subId])

  const handleAction = async (action: 'pause' | 'resume' | 'close') => {
    try {
      setActionInProgress(true)
      const res = await fetch(`/api/portal/subscriptions/${subId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Action failed')
      setNotice(data.message)
      setTimeout(() => setNotice(null), 4000)
      await fetchSubscription()
    } catch (err: any) {
      alert(err.message || 'Action error')
    } finally {
      setActionInProgress(false)
    }
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#05051a] text-white flex flex-col font-sans antialiased relative">
        <PortalTopNavbar activeTab="subscriptions" />
        <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white">Subscription Not Found</h1>
          <p className="text-sm text-white/50 max-w-md mx-auto">
            The subscription you requested does not exist or you do not have permission to access it.
          </p>
          <Link
            href="/portal/subscriptions"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Subscriptions</span>
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#05051a] text-white flex flex-col font-sans antialiased selection:bg-[#8978ff]/30 selection:text-white relative">
      <div className="fixed inset-0 pointer-events-none opacity-40 [background-image:radial-gradient(circle_at_25%_10%,rgba(113,86,255,.35),transparent_40%),radial-gradient(circle_at_80%_65%,rgba(82,67,244,.2),transparent_45%)]" />
      <div className="fixed inset-0 opacity-[0.035] pointer-events-none noise-overlay" />

      <PortalTopNavbar activeTab="subscriptions" />

      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Link
          href="/portal/subscriptions"
          className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Subscriptions</span>
        </Link>

        {notice && (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2.5 animate-in slide-in-from-top-2 duration-200">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {loading ? (
          <div className="h-96 rounded-3xl bg-white/[0.02] border border-white/5 animate-pulse" />
        ) : subscription ? (
          <div className="space-y-6">
            {/* Top Detail Card */}
            <div className="rounded-3xl bg-white/[0.03] backdrop-blur-md border border-white/10 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-[#8978ff]">
                    {subscription.number}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      subscription.status === 'ACTIVE' && !subscription.isPaused
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : subscription.isPaused
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : subscription.status === 'CLOSED'
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        : 'bg-white/10 text-white/60'
                    }`}
                  >
                    {subscription.isPaused ? 'PAUSED' : subscription.status}
                  </span>
                </div>
                <h1 className="text-3xl font-extrabold text-white">
                  {subscription.plan.name}
                </h1>
                <p className="text-sm text-white/50">
                  Billing cycle: {subscription.plan.billingPeriod} &bull; Next invoice renewal on{' '}
                  <span className="text-emerald-300 font-semibold">{subscription.nextBillingDate}</span>
                </p>
              </div>

              {/* Self-service actions */}
              <div className="flex items-center gap-2.5">
                {subscription.isPaused ? (
                  <button
                    disabled={actionInProgress}
                    onClick={() => handleAction('resume')}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-semibold transition cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Resume Subscription</span>
                  </button>
                ) : (
                  subscription.plan.pausable && subscription.status === 'ACTIVE' && (
                    <button
                      disabled={actionInProgress}
                      onClick={() => handleAction('pause')}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 text-white/80 hover:text-white hover:bg-white/10 border border-white/10 text-xs font-semibold transition cursor-pointer"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause Subscription</span>
                    </button>
                  )
                )}

                {subscription.plan.closable && subscription.status !== 'CLOSED' && (
                  <button
                    disabled={actionInProgress}
                    onClick={() => {
                      if (confirm('Are you sure you want to cancel this subscription?')) {
                        handleAction('close')
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 text-xs font-semibold transition cursor-pointer"
                  >
                    <span>Cancel Subscription</span>
                  </button>
                )}
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-5">
                <span className="text-xs text-white/40 block font-medium">Recurring Price</span>
                <span className="text-2xl font-bold text-white mt-1 block">
                  {subscription.plan.formattedPrice}
                </span>
                <span className="text-[11px] text-white/40 mt-0.5 block">
                  Per {subscription.plan.billingPeriod.toLowerCase()}
                </span>
              </div>

              <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-5">
                <span className="text-xs text-white/40 block font-medium">Start Date</span>
                <span className="text-base font-semibold text-white mt-1 block">
                  {subscription.startDate}
                </span>
                <span className="text-[11px] text-white/40 mt-0.5 block">Activation date</span>
              </div>

              <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-5">
                <span className="text-xs text-white/40 block font-medium">Next Billing Date</span>
                <span className="text-base font-semibold text-emerald-400 mt-1 block">
                  {subscription.nextBillingDate}
                </span>
                <span className="text-[11px] text-white/40 mt-0.5 block">Automatic billing run</span>
              </div>

              <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-5">
                <span className="text-xs text-white/40 block font-medium">Expiry / Term</span>
                <span className="text-base font-semibold text-white mt-1 block">
                  {subscription.expiryDate}
                </span>
                <span className="text-[11px] text-white/40 mt-0.5 block">
                  Payment term: {subscription.paymentTermDays} days
                </span>
              </div>
            </div>

            {/* Subscription Line Items */}
            <div className="rounded-3xl bg-white/[0.03] backdrop-blur-md border border-white/10 p-6 space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white/70">
                Subscribed Items & Lines ({subscription.lines?.length || 0})
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-white/40">
                      <th className="py-3 px-4 font-medium">Item / Description</th>
                      <th className="py-3 px-4 font-medium">Quantity</th>
                      <th className="py-3 px-4 font-medium">Unit Price</th>
                      <th className="py-3 px-4 font-medium text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {subscription.lines?.map((line: any) => (
                      <tr key={line.id} className="hover:bg-white/[0.02]">
                        <td className="py-3.5 px-4 text-white font-medium">{line.description}</td>
                        <td className="py-3.5 px-4 text-white/70">{line.quantity}</td>
                        <td className="py-3.5 px-4 text-white/70">{line.formattedUnitPrice}</td>
                        <td className="py-3.5 px-4 text-right font-semibold text-[#a79aff]">
                          {line.formattedAmount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Invoices linked to this subscription */}
            <div className="rounded-3xl bg-white/[0.03] backdrop-blur-md border border-white/10 p-6 space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white/70">
                Invoices Generated ({subscription.invoices?.length || 0})
              </h2>

              {subscription.invoices?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-white/40">
                        <th className="py-3 px-4 font-medium">Invoice #</th>
                        <th className="py-3 px-4 font-medium">Issue Date</th>
                        <th className="py-3 px-4 font-medium">Due Date</th>
                        <th className="py-3 px-4 font-medium">Total</th>
                        <th className="py-3 px-4 font-medium">Status</th>
                        <th className="py-3 px-4 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {subscription.invoices.map((inv: any) => (
                        <tr key={inv.id} className="hover:bg-white/[0.02]">
                          <td className="py-3.5 px-4 font-mono font-semibold text-white">
                            {inv.number}
                          </td>
                          <td className="py-3.5 px-4 text-white/70">{inv.issueDate}</td>
                          <td className="py-3.5 px-4 text-white/70">{inv.dueDate}</td>
                          <td className="py-3.5 px-4 font-semibold text-white">
                            {inv.formattedTotal}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                inv.status === 'PAID'
                                  ? 'bg-emerald-500/15 text-emerald-300'
                                  : 'bg-amber-500/15 text-amber-300'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Link
                              href={`/portal/invoices/${inv.id}`}
                              className="text-xs text-[#8978ff] hover:underline"
                            >
                              View Invoice &rarr;
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-white/40 italic">
                  No billing invoices have been issued for this subscription yet.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}

