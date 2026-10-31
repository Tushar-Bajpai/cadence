'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  FileText,
  CreditCard,
  Layers,
  Pause,
  Play,
  RefreshCw,
  Plus,
  Trash2,
  Save,
  Check,
  Calendar,
  Building,
  User,
  ExternalLink,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/format'

const STEPS = ['DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'CLOSED']

export default function SubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  const router = useRouter()

  const [sub, setSub] = useState<any | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [savingLines, setSavingLines] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Local editable lines (for DRAFT and QUOTATION status)
  const [editableLines, setEditableLines] = useState<any[]>([])
  const [selectedProductId, setSelectedProductId] = useState('')

  const fetchSubscription = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/subscriptions/${id}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to fetch subscription')
      }
      const data = await res.json()
      setSub(data)
      setEditableLines(
        data.lines.map((l: any) => ({
          productId: l.productId,
          variantId: l.variantId,
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxRate: l.taxRate,
          taxType: l.taxType,
          amount: l.amount,
        }))
      )
    } catch (err: any) {
      setErrorMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(data)
      if (data.length > 0) setSelectedProductId(data[0].id)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchSubscription()
    fetchProducts()
  }, [id])

  const handleTransition = async (targetStatus?: string, action?: string) => {
    try {
      setActionLoading(true)
      setActionMessage(null)
      setErrorMessage(null)

      const body: any = {}
      if (targetStatus) body.to = targetStatus
      if (action) body.action = action

      const res = await fetch(`/api/subscriptions/${id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'State transition rejected')
      }

      setActionMessage(data.message || 'Status transition completed successfully')
      await fetchSubscription()
    } catch (err: any) {
      setErrorMessage(err.message || 'Error executing transition')
    } finally {
      setActionLoading(false)
    }
  }

  // Add line to editable lines
  const handleAddLine = () => {
    const prod = products.find((p) => p.id === selectedProductId)
    if (!prod) return

    const newLine = {
      productId: prod.id,
      variantId: null,
      description: prod.name,
      quantity: 1,
      unitPrice: Number(prod.salesPrice) || 0,
      taxRate: 0,
      taxType: 'PERCENTAGE',
      amount: Number(prod.salesPrice) || 0,
    }
    setEditableLines([...editableLines, newLine])
  }

  // Remove line
  const handleRemoveLine = (index: number) => {
    const updated = editableLines.filter((_, i) => i !== index)
    setEditableLines(updated)
  }

  // Update line quantity or price
  const handleUpdateLine = (index: number, field: string, value: number) => {
    const updated = [...editableLines]
    updated[index] = {
      ...updated[index],
      [field]: value,
      amount:
        field === 'quantity'
          ? value * updated[index].unitPrice
          : field === 'unitPrice'
          ? updated[index].quantity * value
          : updated[index].amount,
    }
    setEditableLines(updated)
  }

  // Save modified lines
  const handleSaveLines = async () => {
    try {
      setSavingLines(true)
      setActionMessage(null)
      setErrorMessage(null)

      const totalQty = editableLines.reduce((acc, l) => acc + (Number(l.quantity) || 1), 0)
      if (sub?.plan?.minQuantity && totalQty < sub.plan.minQuantity) {
        throw new Error(
          `Minimum quantity for plan "${sub.plan.name}" is ${sub.plan.minQuantity}. Total: ${totalQty}.`
        )
      }

      const res = await fetch(`/api/subscriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines: editableLines }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save line items')
      }

      setActionMessage('Subscription line items saved successfully')
      await fetchSubscription()
    } catch (err: any) {
      setErrorMessage(err.message)
    } finally {
      setSavingLines(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-[#8978ff] border-t-transparent" />
          <p className="text-xs font-mono uppercase tracking-[0.18em] text-white/50">
            Loading Subscription Details...
          </p>
        </div>
      </div>
    )
  }

  if (!sub) {
    return (
      <div className="mx-auto max-w-4xl py-12 text-center">
        <AlertCircle className="mx-auto size-12 text-red-400" />
        <h2 className="mt-4 text-xl font-medium text-white">Subscription not found</h2>
        <Link
          href="/admin/subscriptions"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Subscriptions</span>
        </Link>
      </div>
    )
  }

  const currentStepIndex = STEPS.indexOf(sub.status)
  const isEditable = sub.status === 'DRAFT' || sub.status === 'QUOTATION'
  const totalAmount = editableLines.reduce((sum, l) => sum + Number(l.amount), 0)

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <Link
            href="/admin/subscriptions"
            className="group inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-white/50 transition hover:text-white mb-2"
          >
            <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-1" />
            <span>All Subscriptions</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl font-mono">
              {sub.number}
            </h1>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-mono font-semibold uppercase tracking-wider ${
                sub.status === 'ACTIVE'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.15)]'
                  : sub.status === 'CONFIRMED'
                  ? 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                  : sub.status === 'QUOTATION'
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                  : sub.status === 'DRAFT'
                  ? 'border-purple-500/30 bg-purple-500/10 text-[#8978ff]'
                  : 'border-white/10 bg-white/5 text-white/40'
              }`}
            >
              {sub.status}
            </span>
            {sub.isPaused && (
              <span className="rounded-full border border-amber-500/40 bg-amber-500/20 px-2.5 py-0.5 text-xs font-mono uppercase tracking-wider text-amber-300 animate-pulse">
                Paused
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Contextual Transition Buttons (Strict State Machine) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {sub.status === 'DRAFT' && (
            <button
              onClick={() => handleTransition('QUOTATION')}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-[#8978ff] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-[0_0_20px_rgba(137,120,255,0.35)] transition hover:bg-[#9b8cff] cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="size-4" />
              <span>Send Quotation</span>
            </button>
          )}

          {sub.status === 'QUOTATION' && (
            <>
              <button
                onClick={() => handleTransition('CONFIRMED')}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-[#8978ff] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-[0_0_20px_rgba(137,120,255,0.35)] transition hover:bg-[#9b8cff] cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="size-4" />
                <span>Confirm Order</span>
              </button>
              <button
                onClick={() => handleTransition('CLOSED')}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-red-400 transition hover:bg-red-500/20 cursor-pointer disabled:opacity-50"
              >
                <span>Reject / Close</span>
              </button>
            </>
          )}

          {sub.status === 'CONFIRMED' && (
            <>
              <button
                onClick={() => handleTransition('ACTIVE')}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-[0_0_20px_rgba(52,211,153,0.35)] transition hover:bg-emerald-400 cursor-pointer disabled:opacity-50"
              >
                <Play className="size-4 fill-white" />
                <span>Activate Subscription</span>
              </button>
              <button
                onClick={() => handleTransition('CLOSED')}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-red-400 transition hover:bg-red-500/20 cursor-pointer disabled:opacity-50"
              >
                <span>Cancel</span>
              </button>
            </>
          )}

          {sub.status === 'ACTIVE' && (
            <>
              {sub.plan.pausable && (
                <button
                  onClick={() => handleTransition(undefined, sub.isPaused ? 'resume' : 'pause')}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-amber-300 transition hover:bg-amber-500/20 cursor-pointer disabled:opacity-50"
                >
                  {sub.isPaused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
                  <span>{sub.isPaused ? 'Resume' : 'Pause'}</span>
                </button>
              )}

              {sub.plan.renewable && (
                <button
                  onClick={() => handleTransition(undefined, 'renew')}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#8978ff]/30 bg-[#8978ff]/10 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#8978ff] transition hover:bg-[#8978ff]/20 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className="size-3.5" />
                  <span>Renew +1 Term</span>
                </button>
              )}

              {sub.plan.closable && (
                <button
                  onClick={() => handleTransition('CLOSED')}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-red-400 transition hover:bg-red-500/20 cursor-pointer disabled:opacity-50"
                >
                  <span>Close Early</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Notifications */}
      {actionMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-medium text-emerald-300 animate-in fade-in duration-200">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
          <span>{actionMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-medium text-red-300 animate-in fade-in duration-200">
          <AlertCircle className="size-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 5-Step Lifecycle Status Stepper */}
      <div className="rounded-2xl border border-white/10 bg-[#090733]/40 p-6 backdrop-blur-[18px]">
        <p className="mb-4 text-[10px] font-mono uppercase tracking-[0.2em] text-white/50">
          LIFECYCLE STATE MACHINE (STRICT TRANSITIONS)
        </p>
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex
            const isCurrent = idx === currentStepIndex
            const isFuture = idx > currentStepIndex

            return (
              <div key={step} className="flex flex-1 items-center gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`grid size-8 place-items-center rounded-full font-mono text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-[#8978ff] text-white ring-4 ring-[#8978ff]/30 shadow-[0_0_20px_rgba(137,120,255,0.6)]'
                        : isCompleted
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                        : 'bg-white/5 border border-white/10 text-white/30'
                    }`}
                  >
                    {isCompleted ? <Check className="size-4" /> : idx + 1}
                  </div>
                  <div>
                    <span
                      className={`block font-mono text-xs font-bold uppercase tracking-wider ${
                        isCurrent
                          ? 'text-[#8978ff]'
                          : isCompleted
                          ? 'text-emerald-400'
                          : 'text-white/40'
                      }`}
                    >
                      {step}
                    </span>
                    <span className="block text-[10px] text-white/30">
                      {step === 'DRAFT' && 'Drafting quote'}
                      {step === 'QUOTATION' && 'Sent to buyer'}
                      {step === 'CONFIRMED' && 'Approved & ready'}
                      {step === 'ACTIVE' && 'Billing engine active'}
                      {step === 'CLOSED' && 'Finalized lifecycle'}
                    </span>
                  </div>
                </div>

                {idx < STEPS.length - 1 && (
                  <div
                    className={`hidden flex-1 h-[2px] mx-2 md:block ${
                      idx < currentStepIndex ? 'bg-emerald-500/50' : 'bg-white/10'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Main Grid: Customer & Plan Specs */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Customer Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-[18px]">
          <div className="flex items-center gap-2 mb-3 text-[10px] font-mono uppercase tracking-[0.2em] text-[#8978ff]">
            <User className="size-3.5" />
            <span>Customer Profile</span>
          </div>
          <h3 className="text-base font-semibold text-white">{sub.customer.name}</h3>
          <p className="text-xs text-white/50">{sub.customer.email}</p>
          <div className="mt-4 space-y-2 border-t border-white/8 pt-3 text-xs text-white/70">
            {sub.customer.companyName && (
              <div className="flex items-center gap-2">
                <Building className="size-3.5 text-white/40" />
                <span>{sub.customer.companyName}</span>
              </div>
            )}
            {sub.customer.phone && (
              <p className="text-white/60">Phone: {sub.customer.phone}</p>
            )}
            {sub.customer.address && (
              <p className="text-white/50 text-[11px] leading-relaxed">
                {sub.customer.address}
              </p>
            )}
          </div>
        </div>

        {/* Plan Specification */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-[18px]">
          <div className="flex items-center gap-2 mb-3 text-[10px] font-mono uppercase tracking-[0.2em] text-[#8978ff]">
            <Layers className="size-3.5" />
            <span>Plan Specification</span>
          </div>
          <h3 className="text-base font-semibold text-white">{sub.plan.name}</h3>
          <p className="text-xs text-white/50">
            {sub.plan.formattedPrice} • {sub.plan.billingPeriod} cadence
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5 border-t border-white/8 pt-3">
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-mono uppercase ${
                sub.plan.pausable
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-white/5 text-white/40'
              }`}
            >
              {sub.plan.pausable ? 'Pausable' : 'No Pause'}
            </span>
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-mono uppercase ${
                sub.plan.closable
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-white/5 text-white/40'
              }`}
            >
              {sub.plan.closable ? 'Closable' : 'Locked Term'}
            </span>
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-mono uppercase ${
                sub.plan.renewable
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-white/5 text-white/40'
              }`}
            >
              {sub.plan.renewable ? 'Renewable' : 'Non-Renewable'}
            </span>
            <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-mono uppercase text-white/60">
              Min Qty: {sub.plan.minQuantity}
            </span>
          </div>
        </div>

        {/* Financial Cadence Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-[18px]">
          <div className="flex items-center gap-2 mb-3 text-[10px] font-mono uppercase tracking-[0.2em] text-[#8978ff]">
            <Clock className="size-3.5" />
            <span>Billing Schedule</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-white/50">Start Date:</span>
              <span className="font-mono text-white">{formatDate(sub.startDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Expiry Date:</span>
              <span className="font-mono text-white">{formatDate(sub.expiryDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Next Billing:</span>
              <span className="font-mono font-medium text-emerald-400">
                {sub.nextBillingDate ? formatDate(sub.nextBillingDate) : 'Not Scheduled'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Payment Terms:</span>
              <span className="font-mono text-white">{sub.paymentTermDays} Days Net</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Line Items Editor (Interactive when DRAFT / QUOTATION) */}
      <div className="rounded-2xl border border-white/10 bg-[#090733]/30 p-6 backdrop-blur-[18px]">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Subscription Line Items
            </h2>
            <p className="text-xs text-white/50">
              {isEditable
                ? 'Configure product lines, quantities, and pricing before activation.'
                : 'Lines are locked as this subscription is beyond quotation phase.'}
            </p>
          </div>

          {isEditable && (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2">
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#8978ff]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#05051a] text-white">
                      {p.name} ({formatCurrency(Number(p.salesPrice))})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddLine}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15 cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  <span>Add Line</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleSaveLines}
                disabled={savingLines}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#8978ff] px-4 py-1.5 text-xs font-semibold text-white shadow-[0_0_15px_rgba(137,120,255,0.3)] transition hover:bg-[#9b8cff] cursor-pointer disabled:opacity-50"
              >
                <Save className="size-3.5" />
                <span>{savingLines ? 'Saving...' : 'Save Lines'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Lines Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 font-mono text-[10px] uppercase tracking-wider text-white/40">
                <th className="py-2.5">Product / Description</th>
                <th className="py-2.5 text-right">Quantity</th>
                <th className="py-2.5 text-right">Unit Price</th>
                <th className="py-2.5 text-right">Tax Rate</th>
                <th className="py-2.5 text-right">Line Total</th>
                {isEditable && <th className="py-2.5 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {editableLines.map((line, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02]">
                  <td className="py-3 font-medium text-white">{line.description}</td>
                  <td className="py-3 text-right">
                    {isEditable ? (
                      <input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) =>
                          handleUpdateLine(idx, 'quantity', Math.max(1, Number(e.target.value)))
                        }
                        className="w-16 rounded border border-white/15 bg-white/5 px-2 py-1 text-right text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#8978ff]"
                      />
                    ) : (
                      <span className="font-mono text-white/80">{line.quantity}</span>
                    )}
                  </td>
                  <td className="py-3 text-right font-mono text-white/80">
                    {isEditable ? (
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.unitPrice}
                        onChange={(e) =>
                          handleUpdateLine(idx, 'unitPrice', Number(e.target.value))
                        }
                        className="w-24 rounded border border-white/15 bg-white/5 px-2 py-1 text-right text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#8978ff]"
                      />
                    ) : (
                      formatCurrency(Number(line.unitPrice))
                    )}
                  </td>
                  <td className="py-3 text-right font-mono text-white/50">
                    {line.taxRate ? `${line.taxRate}%` : '0%'}
                  </td>
                  <td className="py-3 text-right font-mono font-semibold text-white">
                    {formatCurrency(Number(line.amount))}
                  </td>
                  {isEditable && (
                    <td className="py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        disabled={editableLines.length <= 1}
                        className="text-white/40 hover:text-red-400 transition cursor-pointer disabled:opacity-20"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/10 font-mono">
                <td colSpan={isEditable ? 4 : 3} className="py-3 text-right text-white/50 uppercase">
                  Recurring Period Total:
                </td>
                <td className="py-3 text-right text-base font-bold text-[#8978ff]">
                  {formatCurrency(totalAmount)}
                </td>
                {isEditable && <td />}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Linked Invoices & Payments History */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Invoices List */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-[18px]">
          <div className="flex items-center justify-between mb-4 border-b border-white/8 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider font-mono">
              <FileText className="size-4 text-[#8978ff]" />
              <span>Invoices Generated ({sub.invoices.length})</span>
            </div>
            <Link
              href="/admin/invoices"
              className="text-[10px] font-mono uppercase tracking-wider text-white/40 hover:text-white"
            >
              View Invoices →
            </Link>
          </div>

          {sub.invoices.length === 0 ? (
            <p className="py-8 text-center text-xs text-white/40">
              No invoices generated yet. Invoices are produced atomically during billing runs.
            </p>
          ) : (
            <div className="divide-y divide-white/5">
              {sub.invoices.map((inv: any) => (
                <div key={inv.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-semibold text-white">{inv.number}</span>
                    <p className="text-[11px] text-white/40 font-mono">
                      Due: {formatDate(inv.dueDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-medium text-white">
                      {inv.formattedTotal}
                    </span>
                    <span
                      className={`block text-[10px] font-mono uppercase ${
                        inv.status === 'PAID'
                          ? 'text-emerald-400'
                          : inv.status === 'CONFIRMED'
                          ? 'text-amber-400'
                          : 'text-white/40'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payments List */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-[18px]">
          <div className="flex items-center justify-between mb-4 border-b border-white/8 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider font-mono">
              <CreditCard className="size-4 text-emerald-400" />
              <span>Payments Received ({sub.payments.length})</span>
            </div>
          </div>

          {sub.payments.length === 0 ? (
            <p className="py-8 text-center text-xs text-white/40">
              No payments recorded against this subscription yet.
            </p>
          ) : (
            <div className="divide-y divide-white/5">
              {sub.payments.map((pmt: any) => (
                <div key={pmt.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-semibold text-white">
                      {pmt.invoiceNumber}
                    </span>
                    <p className="text-[11px] text-white/40 font-mono">
                      {formatDate(pmt.date)} via {pmt.method}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-medium text-emerald-400">
                      {pmt.formattedAmount}
                    </span>
                    <span className="block text-[10px] font-mono uppercase text-emerald-500">
                      {pmt.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

