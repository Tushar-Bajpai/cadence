'use client'

import React, { useState, useEffect } from 'react'
import { Tag, Plus, X, Trash2, Power, Pencil, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/format'
import { useAdminStore } from '@/stores/use-admin-store'
import { createTaxSchema } from '@/lib/validators'
import { CardSkeletonGrid } from '@/components/ui/skeleton'

interface DiscountRow {
  id: string
  name: string
  type: string
  value: number
  scope: string
  minPurchase: number | null
  minQuantity: number | null
  usageLimit: number
  usedCount: number
  startDate: string
  endDate: string
  isActive: boolean
  isExpired: boolean
  productIds: string[]
  productNames: string[]
}

interface TaxRow {
  id: string
  name: string
  type: string
  value: number
  isActive: boolean
  productCount: number
}

interface ProductRow {
  id: string
  name: string
}

type Modal = 'discount' | 'tax' | null

export default function DiscountsPage() {
  const { showToast } = useAdminStore()
  const [discounts, setDiscounts] = useState<DiscountRow[]>([])
  const [taxes, setTaxes] = useState<TaxRow[]>([])
  const [products, setProducts] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<Modal>(null)
  const [editingTax, setEditingTax] = useState<TaxRow | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Discount form
  const [dName, setDName] = useState('')
  const [dType, setDType] = useState('PERCENTAGE')
  const [dValue, setDValue] = useState('')
  const [dScope, setDScope] = useState('SUBSCRIPTION')
  const [dProducts, setDProducts] = useState<string[]>([])
  const [dUsageLimit, setDUsageLimit] = useState('100')
  const [dStart, setDStart] = useState('')
  const [dEnd, setDEnd] = useState('')
  const [dMinPurchase, setDMinPurchase] = useState('')
  const [dMinQuantity, setDMinQuantity] = useState('')

  // Tax form
  const [tName, setTName] = useState('')
  const [tType, setTType] = useState('PERCENTAGE')
  const [tValue, setTValue] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [discRes, taxRes, prodRes] = await Promise.all([
        fetch('/api/discounts'),
        fetch('/api/taxes'),
        fetch('/api/products'),
      ])
      const [d, t, p] = await Promise.all([discRes.json(), taxRes.json(), prodRes.json()])
      setDiscounts(d.discounts ?? [])
      setTaxes(Array.isArray(t) ? t : t.taxes ?? [])
      setProducts(Array.isArray(p) ? p : p.products ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openDiscountModal = () => {
    const today = new Date()
    const end = new Date(today)
    end.setDate(end.getDate() + 30)
    setDName('')
    setDType('PERCENTAGE')
    setDValue('')
    setDScope('SUBSCRIPTION')
    setDProducts([])
    setDUsageLimit('100')
    setDStart(today.toISOString().slice(0, 10))
    setDEnd(end.toISOString().slice(0, 10))
    setDMinPurchase('')
    setDMinQuantity('')
    setError(null)
    setModal('discount')
  }

  const openTaxModal = (tax?: TaxRow) => {
    setEditingTax(tax ?? null)
    setTName(tax?.name ?? '')
    setTType(tax?.type ?? 'PERCENTAGE')
    setTValue(tax ? String(tax.value) : '')
    setError(null)
    setModal('tax')
  }

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Instant client-side input validation
    if (!dName.trim()) {
      setError('Discount code name is required')
      showToast('Discount code name is required', 'error')
      return
    }
    if (!Number(dValue) || Number(dValue) <= 0) {
      setError('A positive discount value is required')
      showToast('A positive discount value is required', 'error')
      return
    }
    if (dType === 'PERCENTAGE' && Number(dValue) > 100) {
      setError('A percentage discount cannot exceed 100%')
      showToast('A percentage discount cannot exceed 100%', 'error')
      return
    }
    if (dScope === 'PRODUCT' && dProducts.length === 0) {
      setError('Please select at least one product for product-scoped discounts')
      showToast('Please select at least one product for product-scoped discounts', 'error')
      return
    }

    try {
      const res = await fetch('/api/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: dName,
          type: dType,
          value: Number(dValue),
          scope: dScope,
          productIds: dScope === 'PRODUCT' ? dProducts : [],
          usageLimit: Number(dUsageLimit),
          startDate: dStart,
          endDate: dEnd,
          minPurchase: dMinPurchase === '' ? null : Number(dMinPurchase),
          minQuantity: dMinQuantity === '' ? null : Number(dMinQuantity),
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Failed to create discount')
      setModal(null)
      showToast('Discount promotion created successfully', 'success')
      fetchData()
    } catch (err: any) {
      showToast(err.message || 'Error creating discount', 'error')
      setError(err.message || 'Error creating discount')
    }
  }

  const toggleDiscount = async (disc: DiscountRow) => {
    setBusyId(disc.id)
    try {
      await fetch(`/api/discounts/${disc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !disc.isActive }),
      })
      fetchData()
    } finally {
      setBusyId(null)
    }
  }

  const deleteDiscount = async (disc: DiscountRow) => {
    if (!confirm(`Delete discount "${disc.name}"? This cannot be undone.`)) return
    setBusyId(disc.id)
    try {
      await fetch(`/api/discounts/${disc.id}`, { method: 'DELETE' })
      fetchData()
    } finally {
      setBusyId(null)
    }
  }

  const handleSaveTax = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Instant client-side Zod input validation
    const parsed = createTaxSchema.safeParse({
      name: tName,
      type: tType,
      value: tValue,
    })
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || 'Please check tax inputs'
      setError(msg)
      showToast(msg, 'error')
      return
    }

    try {
      const res = editingTax
        ? await fetch(`/api/taxes/${editingTax.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: tName, type: tType, value: Number(tValue) }),
          })
        : await fetch('/api/taxes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: tName, type: tType, value: Number(tValue) }),
          })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Failed to save tax')
      setModal(null)
      setEditingTax(null)
      showToast('Tax policy saved successfully', 'success')
      fetchData()
    } catch (err: any) {
      showToast(err.message || 'Error saving tax', 'error')
      setError(err.message || 'Error saving tax')
    }
  }

  const toggleTax = async (tax: TaxRow) => {
    setBusyId(tax.id)
    try {
      await fetch(`/api/taxes/${tax.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !tax.isActive }),
      })
      fetchData()
    } finally {
      setBusyId(null)
    }
  }

  const deleteTax = async (tax: TaxRow) => {
    if (!confirm(`Delete tax "${tax.name}"?`)) return
    setBusyId(tax.id)
    try {
      const res = await fetch(`/api/taxes/${tax.id}`, { method: 'DELETE' })
      const json = await res.json().catch(() => ({}))
      if (!json.deleted) alert(json.message || 'Tax deactivated (linked to products)')
      fetchData()
    } finally {
      setBusyId(null)
    }
  }

  const toggleProduct = (id: string) =>
    setDProducts((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-10 py-8 space-y-10 text-white">
      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
          {error}
        </p>
      )}

      {/* Discounts Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-[#a79aff] text-[10px] tracking-[0.25em] font-mono uppercase mb-1">
              AUTO-EXPIRING PROMOTIONS
            </p>
            <h1 className="text-3xl font-normal tracking-[-0.085em]">
              Discounts & Taxes. <em className="italic text-[#8978ff]">Automated Policies.</em>
            </h1>
            <p className="text-xs text-white/60 mt-1 font-mono">
              Time-windowed campaigns with usage ceilings, product targeting and dynamic tax rules
            </p>
          </div>

          <button
            onClick={openDiscountModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#8978ff] hover:bg-[#9b8cff] text-white text-xs font-semibold shadow-[0_4px_20px_rgba(137,120,255,0.4)] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Discount</span>
          </button>
        </div>

        {loading ? (
          <CardSkeletonGrid count={3} />
        ) : discounts.length === 0 ? (
          <p className="text-xs text-white/40 font-mono py-8 text-center">No discount rules yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {discounts.map((disc) => (
              <div
                key={disc.id}
                className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-sm hover:border-[#8978ff]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-white/10 text-white border border-white/15">
                      {disc.name}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        disc.isExpired
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {disc.isExpired ? 'Expired' : 'Active'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleDiscount(disc)}
                        disabled={busyId === disc.id}
                        title={disc.isActive ? 'Deactivate' : 'Activate'}
                        className={`grid size-7 place-items-center rounded-lg border transition cursor-pointer disabled:opacity-40 ${
                          disc.isActive
                            ? 'border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/15'
                            : 'border-white/15 text-white/40 hover:bg-white/10'
                        }`}
                      >
                        <Power className="size-3.5" />
                      </button>
                      <button
                        onClick={() => deleteDiscount(disc)}
                        disabled={busyId === disc.id}
                        title="Delete"
                        className="grid size-7 place-items-center rounded-lg border border-white/15 text-white/40 hover:text-rose-300 hover:border-rose-500/40 transition cursor-pointer disabled:opacity-40"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">
                      {disc.type === 'PERCENTAGE' ? `${disc.value}%` : `₹${disc.value}`}
                    </span>
                    <span className="text-xs text-white/50 font-mono">OFF</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded-full bg-[#8978ff]/15 border border-[#8978ff]/30 text-[#a79aff]">
                      {disc.scope === 'PRODUCT' ? 'Product scope' : 'Whole subscription'}
                    </span>
                    {disc.scope === 'PRODUCT' && (
                      <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50">
                        {disc.productIds.length} product{disc.productIds.length === 1 ? '' : 's'}
                      </span>
                    )}
                    {disc.minPurchase != null && (
                      <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50">
                        min ₹{disc.minPurchase}
                      </span>
                    )}
                    {disc.minQuantity != null && (
                      <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50">
                        min qty {disc.minQuantity}
                      </span>
                    )}
                  </div>
                  {disc.scope === 'PRODUCT' && disc.productNames.length > 0 && (
                    <p className="mt-2 text-[10px] text-white/50 font-mono truncate">
                      {disc.productNames.join(', ')}
                    </p>
                  )}

                  <div className="mt-5 space-y-2 text-xs text-white/70 border-t border-white/10 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white/40 font-mono">Redemptions:</span>
                      <span className="font-bold text-white font-mono">
                        {disc.usedCount} / {disc.usageLimit}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[#8978ff] h-1.5 rounded-full shadow-[0_0_10px_rgba(137,120,255,0.6)]"
                        style={{
                          width: `${Math.min(100, (disc.usedCount / disc.usageLimit) * 100)}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-white/40 pt-1 font-mono">
                      <span>Starts:</span>
                      <span className="font-medium text-white/80">{formatDate(disc.startDate)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-white/40 font-mono">
                      <span>Valid until:</span>
                      <span className="font-medium text-white/80">{formatDate(disc.endDate)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Taxes Section */}
      <div className="space-y-6 pt-6 border-t border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-[#a79aff] text-[10px] tracking-[0.25em] font-mono uppercase mb-1">
              STATUTORY LEVIES
            </p>
            <h2 className="text-2xl font-normal tracking-[-0.085em]">
              Configured Taxes. <em className="italic text-[#8978ff]">Auto Calculated.</em>
            </h2>
            <p className="text-xs text-white/60 mt-1 font-mono">
              Percentage or fixed taxes, linked to products and snapshotted per line
            </p>
          </div>

          <button
            onClick={() => openTaxModal()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#8978ff] hover:bg-[#9b8cff] text-white text-xs font-semibold shadow-[0_4px_20px_rgba(137,120,255,0.4)] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Tax</span>
          </button>
        </div>

        {loading ? (
          <CardSkeletonGrid count={3} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {taxes.map((t) => (
              <div
                key={t.id}
                className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-sm hover:border-[#8978ff]/40 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base">{t.name}</h3>
                    <p className="text-xs text-white/40 capitalize mt-0.5 font-mono">{t.type.toLowerCase()} rate · {t.productCount} products</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openTaxModal(t)}
                      disabled={busyId === t.id}
                      title="Edit"
                      className="grid size-7 place-items-center rounded-lg border border-white/15 text-white/50 hover:text-white transition cursor-pointer disabled:opacity-40"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => toggleTax(t)}
                      disabled={busyId === t.id}
                      title={t.isActive ? 'Deactivate' : 'Activate'}
                      className={`grid size-7 place-items-center rounded-lg border transition cursor-pointer disabled:opacity-40 ${
                        t.isActive
                          ? 'border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/15'
                          : 'border-white/15 text-white/40 hover:bg-white/10'
                      }`}
                    >
                      <Power className="size-3.5" />
                    </button>
                    <button
                      onClick={() => deleteTax(t)}
                      disabled={busyId === t.id}
                      title="Delete"
                      className="grid size-7 place-items-center rounded-lg border border-white/15 text-white/40 hover:text-rose-300 hover:border-rose-500/40 transition cursor-pointer disabled:opacity-40"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      t.isActive
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-white/5 border-white/10 text-white/40'
                    }`}
                  >
                    {t.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-3xl font-extrabold text-[#8978ff]">
                    {t.type === 'PERCENTAGE' ? `${t.value}%` : `₹${t.value}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Discount Modal */}
      {modal === 'discount' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md max-h-[92dvh] overflow-y-auto bg-[#0e0c24] text-white rounded-3xl p-6 shadow-2xl border border-white/15 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-bold text-white text-sm">Create Discount Rule</h3>
              <button onClick={() => setModal(null)}>
                <X className="w-4 h-4 text-white/50" />
              </button>
            </div>

            <form onSubmit={handleCreateDiscount} className="space-y-4 text-xs">
              <div>
                <label className="block text-white/60 font-medium mb-1 font-mono">Coupon Code / Name</label>
                <input
                  type="text"
                  value={dName}
                  onChange={(e) => setDName(e.target.value.toUpperCase())}
                  placeholder="e.g. FLASH2026"
                  className="w-full p-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none uppercase font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 font-medium mb-1 font-mono">Discount Type</label>
                  <select
                    value={dType}
                    onChange={(e) => setDType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none"
                  >
                    <option value="PERCENTAGE" className="bg-[#120e28] text-white">Percentage (%)</option>
                    <option value="FIXED" className="bg-[#120e28] text-white">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/60 font-medium mb-1 font-mono">Value</label>
                  <input
                    type="number"
                    step="0.01"
                    value={dValue}
                    onChange={(e) => setDValue(e.target.value)}
                    placeholder="e.g. 20"
                    className="w-full p-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/60 font-medium mb-1 font-mono">Scope</label>
                <select
                  value={dScope}
                  onChange={(e) => setDScope(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none"
                >
                  <option value="SUBSCRIPTION" className="bg-[#120e28] text-white">Whole subscription</option>
                  <option value="PRODUCT" className="bg-[#120e28] text-white">Specific products</option>
                </select>
              </div>

              {dScope === 'PRODUCT' && (
                <div className="space-y-1.5 max-h-40 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-3">
                  {products.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-white/80 cursor-pointer py-0.5">
                      <input
                        type="checkbox"
                        checked={dProducts.includes(p.id)}
                        onChange={() => toggleProduct(p.id)}
                        className="accent-[#8978ff]"
                      />
                      <span>{p.name}</span>
                    </label>
                  ))}
                  {products.length === 0 && (
                    <p className="text-white/40 font-mono">No products available yet.</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 font-medium mb-1 font-mono">Min Purchase (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={dMinPurchase}
                    onChange={(e) => setDMinPurchase(e.target.value)}
                    placeholder="Optional"
                    className="w-full p-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/60 font-medium mb-1 font-mono">Min Quantity</label>
                  <input
                    type="number"
                    value={dMinQuantity}
                    onChange={(e) => setDMinQuantity(e.target.value)}
                    placeholder="Optional"
                    className="w-full p-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 font-medium mb-1 font-mono">Start Date</label>
                  <input
                    type="date"
                    value={dStart}
                    onChange={(e) => setDStart(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none [color-scheme:dark]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white/60 font-medium mb-1 font-mono">End Date</label>
                  <input
                    type="date"
                    value={dEnd}
                    onChange={(e) => setDEnd(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none [color-scheme:dark]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/60 font-medium mb-1 font-mono">Usage Limit</label>
                <input
                  type="number"
                  value={dUsageLimit}
                  onChange={(e) => setDUsageLimit(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none"
                />
              </div>

              {error && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-4 py-2 rounded-full text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#8978ff] text-white font-semibold hover:bg-[#9b8cff] shadow-[0_4px_20px_rgba(137,120,255,0.4)] cursor-pointer"
                >
                  Create Discount
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tax Modal (create / edit) */}
      {modal === 'tax' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0e0c24] text-white rounded-3xl p-6 shadow-2xl border border-white/15 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-bold text-white text-sm">{editingTax ? 'Edit Tax' : 'Create Tax'}</h3>
              <button onClick={() => setModal(null)}>
                <X className="w-4 h-4 text-white/50" />
              </button>
            </div>

            <form onSubmit={handleSaveTax} className="space-y-4 text-xs">
              <div>
                <label className="block text-white/60 font-medium mb-1 font-mono">Tax Name</label>
                <input
                  type="text"
                  value={tName}
                  onChange={(e) => setTName(e.target.value)}
                  placeholder="e.g. GST 18%"
                  className="w-full p-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 font-medium mb-1 font-mono">Tax Type</label>
                  <select
                    value={tType}
                    onChange={(e) => setTType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none"
                  >
                    <option value="PERCENTAGE" className="bg-[#120e28] text-white">Percentage (%)</option>
                    <option value="FIXED" className="bg-[#120e28] text-white">Fixed ($ per unit)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/60 font-medium mb-1 font-mono">Value</label>
                  <input
                    type="number"
                    step="0.01"
                    value={tValue}
                    onChange={(e) => setTValue(e.target.value)}
                    placeholder="e.g. 18"
                    className="w-full p-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-4 py-2 rounded-full text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#8978ff] text-white font-semibold hover:bg-[#9b8cff] shadow-[0_4px_20px_rgba(137,120,255,0.4)] cursor-pointer"
                >
                  {editingTax ? 'Save Changes' : 'Create Tax'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
