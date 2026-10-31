'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Layers,
  Search,
  Filter,
  Plus,
  Play,
  Pause,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  Shield,
  Clock,
  ExternalLink,
  FileSpreadsheet,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/format'
import { TableSkeleton } from '@/components/ui/skeleton'

export default function SubscriptionsPage() {
  const router = useRouter()
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [search, setSearch] = useState('')
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Creation mode: 'scratch' | 'template'
  const [creationMode, setCreationMode] = useState<'scratch' | 'template'>('template')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')

  // New subscription form state
  const [newCustId, setNewCustId] = useState('')
  const [newPlanId, setNewPlanId] = useState('')
  const [newSubStatus, setNewSubStatus] = useState('DRAFT')
  const [quantity, setQuantity] = useState(1)

  const fetchSubscriptions = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/subscriptions?search=${encodeURIComponent(search)}`)
      const data = await res.json()
      setSubscriptions(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPrerequisites = async () => {
    try {
      const [plansRes, custRes, tmplRes] = await Promise.all([
        fetch('/api/plans'),
        fetch('/api/customers'),
        fetch('/api/templates'),
      ])
      const p = await plansRes.json()
      const c = await custRes.json()
      const t = await tmplRes.json()

      setPlans(p)
      setCustomers(c)
      setTemplates(t)

      if (p.length > 0) setNewPlanId(p[0].id)
      if (c.length > 0) setNewCustId(c[0].id)
      if (t.length > 0) setSelectedTemplateId(t[0].id)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchSubscriptions()
    fetchPrerequisites()
  }, [])

  const handleTransition = async (id: string, targetStatus?: string, action?: string) => {
    try {
      setActionMessage(null)
      setErrorMessage(null)
      const res = await fetch(`/api/subscriptions/${id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: targetStatus, targetStatus, action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Transition failed')
      setActionMessage(data.message || 'Status updated')
      fetchSubscriptions()
    } catch (err: any) {
      setErrorMessage(err.message || 'Error executing transition')
    }
  }

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setActionMessage(null)
      setErrorMessage(null)

      let payload: any = { customerId: newCustId }

      if (creationMode === 'template') {
        payload.templateId = selectedTemplateId
      } else {
        const selectedPlan = plans.find((p) => p.id === newPlanId)
        const qty = Number(quantity) || selectedPlan?.minQuantity || 1

        payload.planId = newPlanId
        payload.status = newSubStatus
        payload.lines = [
          {
            productId: selectedPlan?.id,
            description: selectedPlan?.name,
            unitPrice: selectedPlan?.price,
            quantity: qty,
          },
        ]
      }

      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create subscription')

      setIsNewModalOpen(false)
      setActionMessage(`Subscription created successfully!`)

      // Redirect directly to the subscription detail page
      if (data?.subscription?.id) {
        router.push(`/admin/subscriptions/${data.subscription.id}`)
      } else {
        fetchSubscriptions()
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error creating subscription')
    }
  }

  const getStatusBadge = (status: string, isPaused: boolean) => {
    if (isPaused) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Paused
        </span>
      )
    }
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Active
          </span>
        )
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#8978ff]/15 text-[#a79aff] border border-[#8978ff]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8978ff]" />
            Confirmed
          </span>
        )
      case 'QUOTATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            Quotation
          </span>
        )
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-white/70 border border-white/20">
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            Draft
          </span>
        )
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/5 text-white/40 border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
            Closed
          </span>
        )
      default:
        return <span>{status}</span>
    }
  }

  const filteredSubs = subscriptions.filter((s) => {
    if (filterStatus !== 'ALL' && s.status !== filterStatus) return false
    return true
  })

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-10 py-8 space-y-6 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-[#a79aff] text-[10px] tracking-[0.25em] font-mono uppercase mb-1">
            SUBSCRIPTION LIFECYCLE
          </p>
          <h1 className="text-3xl font-normal tracking-[-0.085em]">
            State Machine. <em className="italic text-[#8978ff]">Deterministic Flow.</em>
          </h1>
          <p className="text-xs text-white/60 mt-1 font-mono">
            Draft → Quotation → Confirmed → Active → Closed
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#8978ff] hover:bg-[#9b8cff] text-white text-xs font-semibold shadow-[0_4px_20px_rgba(137,120,255,0.4)] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Subscription</span>
        </button>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/[0.03] p-4 rounded-2xl border border-white/10 backdrop-blur-xl">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search subscriptions or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchSubscriptions()}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white/[0.04] text-white placeholder-white/40 border border-white/10 focus:outline-none focus:border-[#8978ff] focus:ring-1 focus:ring-[#8978ff]"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'ACTIVE', 'CONFIRMED', 'QUOTATION', 'DRAFT', 'CLOSED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                filterStatus === st
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
                <th className="py-3 px-6">ID / Seq</th>
                <th className="py-3 px-6">Customer</th>
                <th className="py-3 px-6">Plan / Frequency</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Next Billing</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {loading && subscriptions.length === 0 ? (
                <TableSkeleton columns={6} rows={6} />
              ) : filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-white/40 font-mono">
                    No subscriptions found.
                  </td>
                </tr>
              ) : (
                filteredSubs.map((sub) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-white/[0.04] transition-colors group cursor-pointer"
                    onClick={() => router.push(`/admin/subscriptions/${sub.id}`)}
                  >
                    <td className="py-4 px-6 font-mono font-bold text-white">
                      <div className="flex items-center gap-1.5">
                        <span>{sub.number}</span>
                        <ExternalLink className="size-3 text-white/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white">{sub.customerName}</div>
                      <div className="text-[11px] text-white/40 font-mono">{sub.customerEmail}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-white">{sub.planName}</div>
                      <div className="text-[11px] text-white/40 capitalize font-mono">
                        {sub.billingPeriod.toLowerCase()} • {sub.formattedTotal}
                      </div>
                    </td>
                    <td className="py-4 px-6">{getStatusBadge(sub.status, sub.isPaused)}</td>
                    <td className="py-4 px-6 text-white/70 font-mono">
                      {sub.nextBillingDate ? formatDate(sub.nextBillingDate) : '—'}
                    </td>
                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/subscriptions/${sub.id}`}
                          className="px-2.5 py-1 rounded-full border border-white/15 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 font-medium text-[11px] transition"
                        >
                          Details →
                        </Link>
                        {sub.status === 'DRAFT' && (
                          <button
                            onClick={() => handleTransition(sub.id, 'QUOTATION')}
                            className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 font-semibold cursor-pointer"
                          >
                            Send Quote
                          </button>
                        )}
                        {sub.status === 'QUOTATION' && (
                          <button
                            onClick={() => handleTransition(sub.id, 'CONFIRMED')}
                            className="px-2.5 py-1 rounded-full bg-[#8978ff]/20 text-[#a79aff] hover:bg-[#8978ff]/30 font-semibold cursor-pointer"
                          >
                            Confirm
                          </button>
                        )}
                        {sub.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleTransition(sub.id, 'ACTIVE')}
                            className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 font-semibold cursor-pointer"
                          >
                            Activate
                          </button>
                        )}
                        {sub.status === 'ACTIVE' && (
                          <>
                            {sub.isPaused ? (
                              <button
                                onClick={() => handleTransition(sub.id, undefined, 'resume')}
                                className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/20 cursor-pointer"
                                title="Resume Subscription"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleTransition(sub.id, undefined, 'pause')}
                                className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/20 cursor-pointer"
                                title="Pause Subscription"
                              >
                                <Pause className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleTransition(sub.id, 'CLOSED')}
                              className="px-2 py-1 rounded-full text-white/40 hover:text-rose-400 hover:bg-rose-500/10 text-[11px] cursor-pointer"
                            >
                              Close
                            </button>
                          </>
                        )}
                        {sub.status === 'CLOSED' && (
                          <button
                            onClick={() => handleTransition(sub.id, undefined, 'renew')}
                            className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium cursor-pointer"
                          >
                            Renew
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Subscription Modal with Template Support */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#0e0c24] text-white rounded-3xl p-6 shadow-2xl border border-white/15 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="font-bold text-white text-base">New Subscription Lifecycle</h3>
                <p className="text-[11px] text-white/50">
                  Create from template or compose from scratch
                </p>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-white/50 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Creation Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setCreationMode('template')}
                className={`py-2 rounded-lg text-center transition cursor-pointer ${
                  creationMode === 'template'
                    ? 'bg-[#8978ff] text-white shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                From Quotation Template
              </button>
              <button
                type="button"
                onClick={() => setCreationMode('scratch')}
                className={`py-2 rounded-lg text-center transition cursor-pointer ${
                  creationMode === 'scratch'
                    ? 'bg-[#8978ff] text-white shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                From Scratch
              </button>
            </div>

            <form onSubmit={handleCreateSubscription} className="space-y-4 text-xs">
              <div>
                <label className="block text-white/60 font-medium mb-1 font-mono">
                  Target Customer
                </label>
                <select
                  value={newCustId}
                  onChange={(e) => setNewCustId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-1 focus:ring-[#8978ff]"
                  required
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#120e28] text-white">
                      {c.name} ({c.email}) {c.companyName ? `• ${c.companyName}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {creationMode === 'template' ? (
                <div>
                  <label className="block text-white/60 font-medium mb-1 font-mono">
                    Select Quotation Template
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-1 focus:ring-[#8978ff]"
                    required
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id} className="bg-[#120e28] text-white">
                        {t.name} ({t.planName} • {t.validityDays} days validity)
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-[10px] text-white/40">
                    Template copies plan, product lines, and calculates quote validity period automatically.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-white/60 font-medium mb-1 font-mono">Plan</label>
                    <select
                      value={newPlanId}
                      onChange={(e) => setNewPlanId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-1 focus:ring-[#8978ff]"
                      required
                    >
                      {plans.map((p) => (
                        <option key={p.id} value={p.id} className="bg-[#120e28] text-white">
                          {p.name} ({p.formattedPrice} / {p.billingPeriod})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-white/60 font-medium mb-1 font-mono">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                        className="w-full p-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-1 focus:ring-[#8978ff]"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 font-medium mb-1 font-mono">
                        Initial Status
                      </label>
                      <select
                        value={newSubStatus}
                        onChange={(e) => setNewSubStatus(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-1 focus:ring-[#8978ff]"
                      >
                        <option value="DRAFT" className="bg-[#120e28] text-white">Draft</option>
                        <option value="QUOTATION" className="bg-[#120e28] text-white">Quotation</option>
                        <option value="CONFIRMED" className="bg-[#120e28] text-white">Confirmed</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-full text-white/60 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-[#8978ff] text-white font-semibold hover:bg-[#9b8cff] shadow-[0_4px_20px_rgba(137,120,255,0.4)] transition cursor-pointer"
                >
                  Create & Open
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
