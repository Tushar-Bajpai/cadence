'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PortalTopNavbar } from '@/components/portal/portal-top-navbar'
import {
  Plus,
  Play,
  Pause,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Repeat,
  ShieldCheck,
  Calendar,
  Layers,
} from 'lucide-react'
import { CardSkeletonGrid } from '@/components/ui/skeleton'

export default function PortalSubscriptionsPage() {
  const router = useRouter()
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED' | 'CLOSED'>('ALL')
  const [notice, setNotice] = useState<string | null>(null)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  const fetchSubscriptions = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/portal/subscriptions')
      if (res.status === 401) {
        router.push('/auth')
        return
      }
      const data = await res.json()
      if (Array.isArray(data)) {
        setSubscriptions(data)
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const handleAction = async (subId: string, action: 'pause' | 'resume' | 'close') => {
    try {
      setActionInProgress(subId)
      const res = await fetch(`/api/portal/subscriptions/${subId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Action failed')
      setNotice(data.message)
      setTimeout(() => setNotice(null), 4000)
      await fetchSubscriptions()
    } catch (err: any) {
      alert(err.message || 'Action failed')
    } finally {
      setActionInProgress(null)
    }
  }

  const filtered = subscriptions.filter((sub) => {
    if (statusFilter === 'ACTIVE' && (sub.status !== 'ACTIVE' || sub.isPaused)) return false
    if (statusFilter === 'PAUSED' && !sub.isPaused) return false
    if (statusFilter === 'CLOSED' && sub.status !== 'CLOSED') return false

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        sub.number.toLowerCase().includes(q) ||
        sub.plan.name.toLowerCase().includes(q) ||
        sub.status.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div className="min-h-screen bg-[#05051a] text-white flex flex-col font-sans antialiased selection:bg-[#8978ff]/30 selection:text-white relative">
      <div className="fixed inset-0 pointer-events-none opacity-40 [background-image:radial-gradient(circle_at_25%_10%,rgba(113,86,255,.35),transparent_40%),radial-gradient(circle_at_80%_65%,rgba(82,67,244,.2),transparent_45%)]" />
      <div className="fixed inset-0 opacity-[0.035] pointer-events-none noise-overlay" />

      <PortalTopNavbar
        activeTab="subscriptions"
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

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <span>My Subscriptions</span>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-white/10 text-white/70">
                {subscriptions.length} Total
              </span>
            </h1>
            <p className="mt-1 text-sm text-white/50">
              Manage your recurring plans, review billing dates, and self-service lifecycle controls.
            </p>
          </div>

          <Link
            href="/portal/products"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#8978ff] hover:bg-[#9b8cff] text-white text-xs font-semibold transition shadow-md cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Subscribe to Plan</span>
          </Link>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-4 text-xs">
          {(['ALL', 'ACTIVE', 'PAUSED', 'CLOSED'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3.5 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                statusFilter === filter
                  ? 'bg-[#8978ff] text-white shadow-sm'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {filter.charAt(0) + filter.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Subscriptions List */}
        {loading ? (
          <CardSkeletonGrid count={2} />
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((sub) => (
              <div
                key={sub.id}
                className="rounded-3xl bg-white/[0.03] backdrop-blur-md border border-white/10 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-white/20 transition group"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-semibold text-[#8978ff]">
                      {sub.number}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        sub.status === 'ACTIVE' && !sub.isPaused
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : sub.isPaused
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : sub.status === 'CLOSED'
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : 'bg-white/10 text-white/60'
                      }`}
                    >
                      {sub.isPaused ? 'PAUSED' : sub.status}
                    </span>
                    <span className="text-xs text-white/40 font-mono">
                      Cycle: {sub.plan.billingPeriod}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-[#a79aff] transition-colors">
                      {sub.plan.name}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/60">
                      <div>
                        <span className="text-white/40 block">Price:</span>
                        <span className="font-semibold text-white">
                          {sub.plan.formattedPrice} / {sub.plan.billingPeriod.toLowerCase()}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/40 block">Start Date:</span>
                        <span>{sub.startDate}</span>
                      </div>
                      <div>
                        <span className="text-white/40 block">Next Renewal:</span>
                        <span className="text-emerald-400 font-medium">{sub.nextBillingDate}</span>
                      </div>
                      <div>
                        <span className="text-white/40 block">Expires:</span>
                        <span>{sub.expiryDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Lines list preview */}
                  {sub.lines && sub.lines.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-2 text-xs">
                      {sub.lines.map((line: any) => (
                        <span
                          key={line.id}
                          className="px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/5 text-white/70"
                        >
                          {line.description} &bull; {line.formattedAmount}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 self-start lg:self-center shrink-0">
                  <Link
                    href={`/portal/subscriptions/${sub.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition"
                  >
                    <span>View Detail</span>
                    <ArrowRight className="w-3.5 h-3.5 text-white/50" />
                  </Link>

                  {/* Self-service pause/resume (only if plan.pausable) */}
                  {sub.isPaused ? (
                    <button
                      disabled={actionInProgress === sub.id}
                      onClick={() => handleAction(sub.id, 'resume')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-semibold transition cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Resume</span>
                    </button>
                  ) : (
                    sub.plan.pausable && sub.status === 'ACTIVE' && (
                      <button
                        disabled={actionInProgress === sub.id}
                        onClick={() => handleAction(sub.id, 'pause')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 text-white/80 hover:text-white hover:bg-white/10 border border-white/10 text-xs font-semibold transition cursor-pointer"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause</span>
                      </button>
                    )
                  )}

                  {/* Self-service close (only if plan.closable) */}
                  {sub.plan.closable && sub.status !== 'CLOSED' && (
                    <button
                      disabled={actionInProgress === sub.id}
                      onClick={() => {
                        if (confirm(`Are you sure you want to cancel subscription ${sub.number}?`)) {
                          handleAction(sub.id, 'close')
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 text-xs font-semibold transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-white/[0.02] border border-white/10 p-12 text-center text-white/40 space-y-3">
            <Repeat className="w-8 h-8 text-white/20 mx-auto" />
            <p>No subscriptions found matching the selected filter.</p>
            <Link
              href="/portal/products"
              className="inline-block text-xs text-[#8978ff] hover:underline"
            >
              Browse catalog to subscribe &rarr;
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
