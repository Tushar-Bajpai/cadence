'use client'

import React, { useState, useEffect } from 'react'
import { Plus, X, Trash2, Loader2, FileText, CalendarClock, Package } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { createTemplateSchema } from '@/lib/validators'

interface TemplateRow {
  id: string
  name: string
  plan: { id: string; name: string; price: number; billingPeriod: string }
  validityDays: number
  lines: {
    id: string
    productName: string
    variantLabel: string | null
    unitPrice: number
    quantity: number
  }[]
}

interface PlanRow {
  id: string
  name: string
  billingPeriod: string
}

interface ProductRow {
  id: string
  name: string
  variants: { id: string; attribute: string; value: string; extraPrice: number }[]
}

interface DraftLine {
  productId: string
  variantId: string
  quantity: string
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateRow[]>([])
  const [plans, setPlans] = useState<PlanRow[]>([])
  const [products, setProducts] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Create form
  const [name, setName] = useState('')
  const [planId, setPlanId] = useState('')
  const [validityDays, setValidityDays] = useState('15')
  const [lines, setLines] = useState<DraftLine[]>([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [tplRes, planRes, prodRes] = await Promise.all([
        fetch('/api/templates'),
        fetch('/api/plans'),
        fetch('/api/products'),
      ])
      const [t, p, pr] = await Promise.all([tplRes.json(), planRes.json(), prodRes.json()])
      setTemplates(t.templates ?? t ?? [])
      setPlans(p.plans ?? (Array.isArray(p) ? p : []))
      setProducts(pr.products ?? (Array.isArray(pr) ? pr : []))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openCreateModal = () => {
    setName('')
    setPlanId(plans[0]?.id ?? '')
    setValidityDays('15')
    setLines(
      products[0]
        ? [{ productId: products[0].id, variantId: '', quantity: '1' }]
        : []
    )
    setError(null)
    setIsCreateOpen(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Instant client-side Zod input validation
    const parsed = createTemplateSchema.safeParse({
      name,
      planId,
      validityDays,
      lines: lines.map((l) => ({
        productId: l.productId,
        variantId: l.variantId || null,
        quantity: l.quantity,
      })),
    })

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'Please check template inputs')
      return
    }

    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          planId,
          validityDays: Number(validityDays),
          lines: lines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId || null,
            quantity: Number(l.quantity),
          })),
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Failed to create template')
      setIsCreateOpen(false)
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Error creating template')
    }
  }

  const deleteTemplate = async (tpl: TemplateRow) => {
    if (!confirm(`Delete template "${tpl.name}"?`)) return
    setBusyId(tpl.id)
    try {
      await fetch(`/api/templates/${tpl.id}`, { method: 'DELETE' })
      fetchData()
    } finally {
      setBusyId(null)
    }
  }

  const addLine = () => {
    const productId = products.find((p) => !lines.some((l) => l.productId === p.id))?.id ?? products[0]?.id
    if (!productId) return
    setLines([...lines, { productId, variantId: '', quantity: '1' }])
  }

  const updateLine = (index: number, patch: Partial<DraftLine>) =>
    setLines(lines.map((l, i) => (i === index ? { ...l, ...patch } : l)))

  const removeLine = (index: number) => setLines(lines.filter((_, i) => i !== index))

  const productById = (id: string) => products.find((p) => p.id === id)

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-10 py-8 space-y-10 text-white">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-[#a79aff] text-[10px] tracking-[0.25em] font-mono uppercase mb-1">
            QUOTATION BLUEPRINTS
          </p>
          <h1 className="text-3xl font-normal tracking-[-0.085em]">
            Templates. <em className="italic text-[#8978ff]">Quote in One Click.</em>
          </h1>
          <p className="text-xs text-white/60 mt-1 font-mono">
            Bundled plan + product lines with a validity window — reused to draft quotations instantly
          </p>
        </div>

        <button
          onClick={openCreateModal}
          disabled={plans.length === 0 || products.length === 0}
          title={plans.length === 0 ? 'Create a plan first' : products.length === 0 ? 'Create a product first' : ''}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#8978ff] hover:bg-[#9b8cff] text-white text-xs font-semibold shadow-[0_4px_20px_rgba(137,120,255,0.4)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          <span>Create Template</span>
        </button>
      </div>

      {(plans.length === 0 || products.length === 0) && !loading && (
        <p className="text-[11px] text-white/50 font-mono border border-amber-500/30 bg-amber-500/10 rounded-xl px-3 py-2">
          Templates need at least one plan and one product to exist first.
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-white/40" />
        </div>
      ) : templates.length === 0 ? (
        <p className="text-xs text-white/40 font-mono py-8 text-center">No quotation templates yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map((t) => (
            <div
              key={t.id}
              className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-sm hover:border-[#8978ff]/40 transition-all flex flex-col"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-white/10 text-white border border-white/15">
                    {t.name}
                  </span>
                  <p className="mt-3 text-sm text-white/80">
                    {t.plan.name}
                    <span className="text-white/40 font-mono text-[11px] ml-2">
                      {t.plan.price} · {t.plan.billingPeriod.toLowerCase()}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => deleteTemplate(t)}
                  disabled={busyId === t.id}
                  title="Delete template"
                  className="grid size-7 place-items-center rounded-lg border border-white/15 text-white/40 hover:text-rose-300 hover:border-rose-500/40 transition cursor-pointer disabled:opacity-40 shrink-0"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>

              <div className="mt-4 space-y-2 border-t border-white/10 pt-3 text-xs">
                {t.lines.map((l) => (
                  <div key={l.id} className="flex items-center justify-between text-white/70">
                    <span className="flex items-center gap-2 min-w-0">
                      <Package className="size-3.5 text-[#8978ff] shrink-0" />
                      <span className="truncate">
                        {l.quantity}× {l.productName}
                      </span>
                      {l.variantLabel && (
                        <span className="text-white/40 font-mono text-[10px] truncate">{l.variantLabel}</span>
                      )}
                    </span>
                    <span className="font-mono text-white/50 shrink-0 ml-2">
                      {formatCurrency(l.unitPrice * l.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                <span className="flex items-center gap-1.5 text-[11px] text-white/50 font-mono">
                  <CalendarClock className="size-3.5 text-[#a79aff]" />
                  Quote valid {t.validityDays} days
                </span>
                <span className="font-mono text-white/60 text-[11px] flex items-center gap-1.5">
                  <FileText className="size-3.5" />
                  {t.lines.length} line{t.lines.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Template Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md max-h-[92dvh] overflow-y-auto bg-[#0e0c24] text-white rounded-3xl p-6 shadow-2xl border border-white/15 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-bold text-white text-sm">Create Quotation Template</h3>
              <button onClick={() => setIsCreateOpen(false)}>
                <X className="w-4 h-4 text-white/50" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-white/60 font-medium mb-1 font-mono">Template Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Odoo SME Bundle"
                  className="w-full p-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 font-medium mb-1 font-mono">Plan</label>
                  <select
                    value={planId}
                    onChange={(e) => setPlanId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none"
                    required
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#120e28] text-white">
                        {p.name} ({p.billingPeriod.toLowerCase()})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-white/60 font-medium mb-1 font-mono">Validity (Days)</label>
                  <input
                    type="number"
                    value={validityDays}
                    onChange={(e) => setValidityDays(e.target.value)}
                    min="1"
                    className="w-full p-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Line editor */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-white/60 font-medium font-mono">Product Lines</label>
                  <button
                    type="button"
                    onClick={addLine}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white/80 font-mono text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="size-3" />
                    Add line
                  </button>
                </div>

                {lines.map((l, i) => {
                  const product = productById(l.productId)
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <select
                        value={l.productId}
                        onChange={(e) => updateLine(i, { productId: e.target.value, variantId: '' })}
                        className="flex-1 min-w-0 p-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none truncate"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id} className="bg-[#120e28] text-white">
                            {p.name}
                          </option>
                        ))}
                      </select>

                      {product && product.variants.length > 0 && (
                        <select
                          value={l.variantId}
                          onChange={(e) => updateLine(i, { variantId: e.target.value })}
                          className="w-28 p-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none shrink-0"
                        >
                          <option value="" className="bg-[#120e28] text-white">Base</option>
                          {product.variants.map((v) => (
                            <option key={v.id} value={v.id} className="bg-[#120e28] text-white">
                              {v.value}
                            </option>
                          ))}
                        </select>
                      )}

                      <input
                        type="number"
                        min="1"
                        value={l.quantity}
                        onChange={(e) => updateLine(i, { quantity: e.target.value })}
                        className="w-16 p-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none shrink-0"
                        required
                      />

                      <button
                        type="button"
                        onClick={() => removeLine(i)}
                        disabled={lines.length === 1}
                        title="Remove line"
                        className="grid size-7 shrink-0 place-items-center rounded-lg border border-white/15 text-white/40 hover:text-rose-300 transition cursor-pointer disabled:opacity-30"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>

              {error && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-full text-white/60 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#8978ff] text-white font-semibold hover:bg-[#9b8cff] shadow-[0_4px_20px_rgba(137,120,255,0.4)] cursor-pointer"
                >
                  Create Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
