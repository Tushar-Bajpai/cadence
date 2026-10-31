'use client'

import React, { useState, useEffect } from 'react'
import { Package, Plus, Tag, Check, X, Layers, Clock, ShieldCheck } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { useAdminStore } from '@/stores/use-admin-store'
import { createProductSchema, createPlanSchema } from '@/lib/validators'
import { CardSkeletonGrid } from '@/components/ui/skeleton'

export default function ProductsPage() {
  const {
    isProductModalOpen,
    openProductModal,
    closeProductModal,
    isPlanModalOpen,
    openPlanModal,
    closePlanModal,
    showToast,
  } = useAdminStore()

  const [products, setProducts] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Product form
  const [prodName, setProdName] = useState('')
  const [salesPrice, setSalesPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [variantAttr, setVariantAttr] = useState('Integration')
  const [variantVal, setVariantVal] = useState('Odoo Connector')
  const [variantExtra, setVariantExtra] = useState('560')

  // Plan form
  const [planName, setPlanName] = useState('')
  const [planPrice, setPlanPrice] = useState('')
  const [planPeriod, setPlanPeriod] = useState('MONTHLY')

  const fetchData = async () => {
    try {
      setLoading(true)
      const [pRes, plRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/plans'),
      ])
      const p = await pRes.json()
      const pl = await plRes.json()
      setProducts(p)
      setPlans(pl)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const variants = variantVal
        ? [{ attribute: variantAttr, value: variantVal, extraPrice: Number(variantExtra) || 0 }]
        : []

      // Client Zod input validation
      const val = createProductSchema.safeParse({
        name: prodName,
        salesPrice,
        notes,
        variants,
      })
      if (!val.success) {
        showToast(val.error.issues[0]?.message || 'Please check product inputs', 'error')
        return
      }

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: prodName,
          salesPrice: Number(salesPrice),
          notes,
          variants,
        }),
      })
      if (!res.ok) throw new Error('Failed to create product')
      closeProductModal()
      setProdName('')
      setSalesPrice('')
      showToast('Product created successfully', 'success')
      fetchData()
    } catch (err: any) {
      showToast(err.message || 'Error creating product', 'error')
    }
  }

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Client Zod input validation
      const val = createPlanSchema.safeParse({
        name: planName,
        price: planPrice,
        billingPeriod: planPeriod,
      })
      if (!val.success) {
        showToast(val.error.issues[0]?.message || 'Please check plan inputs', 'error')
        return
      }

      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: planName,
          price: Number(planPrice),
          billingPeriod: planPeriod,
          pausable: true,
          closable: true,
          renewable: true,
        }),
      })
      if (!res.ok) throw new Error('Failed to create plan')
      closePlanModal()
      setPlanName('')
      setPlanPrice('')
      showToast('Plan created successfully', 'success')
      fetchData()
    } catch (err: any) {
      showToast(err.message || 'Error creating plan', 'error')
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-10 py-8 space-y-10 text-white">
      {/* Products Catalog Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-[#a79aff] text-[10px] tracking-[0.25em] font-mono uppercase mb-1">
              CATALOG & ADD-ON MODULES
            </p>
            <h1 className="text-3xl font-normal tracking-[-0.085em]">
              Products & Variants. <em className="italic text-[#8978ff]">Modular Pricing.</em>
            </h1>
            <p className="text-xs text-white/60 mt-1 font-mono">
              Base software tiers, configurable add-on variants (+560), and attached tax policies
            </p>
          </div>

          <button
            onClick={openProductModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#8978ff] hover:bg-[#9b8cff] text-white text-xs font-semibold shadow-[0_4px_20px_rgba(137,120,255,0.4)] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>

        {loading ? <CardSkeletonGrid /> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-sm hover:border-[#8978ff]/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-[#8978ff]/15 text-[#8978ff] flex items-center justify-center border border-[#8978ff]/30">
                    <Package className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    Active
                  </span>
                </div>

                <h3 className="font-bold text-white mt-3 text-sm">{p.name}</h3>
                <p className="text-xs text-white/60 mt-1 leading-relaxed">
                  {p.notes || 'Core recurring subscription line'}
                </p>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-white">
                    {p.formattedSalesPrice}
                  </span>
                  <span className="text-xs text-white/40 font-mono">/ unit</span>
                </div>

                {p.variants && p.variants.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-[#a79aff]">
                      Configurable Variants:
                    </span>
                    <div className="space-y-1.5">
                      {p.variants.map((v: any) => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between text-xs bg-white/[0.04] px-2.5 py-1.5 rounded-lg border border-white/10"
                        >
                          <span className="text-white/80 font-medium">
                            {v.attribute}: {v.value}
                          </span>
                          <span className="font-semibold text-emerald-400 font-mono">
                            +{v.formattedExtraPrice}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>}
      </div>

      {/* Plans Section */}
      <div className="space-y-6 pt-6 border-t border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-[#a79aff] text-[10px] tracking-[0.25em] font-mono uppercase mb-1">
              RECURRING INTERVALS
            </p>
            <h2 className="text-2xl font-normal tracking-[-0.085em]">
              Billing Plans. <em className="italic text-[#8978ff]">Deterministic Engine.</em>
            </h2>
            <p className="text-xs text-white/60 mt-1 font-mono">
              Daily, Weekly, Monthly, Yearly intervals with pausable & renewal policies
            </p>
          </div>

          <button
            onClick={openPlanModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/20 bg-white/5 hover:bg-white/15 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer backdrop-blur-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Plan</span>
          </button>
        </div>

        {loading ? <CardSkeletonGrid /> : <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-sm hover:border-[#8978ff]/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-[#8978ff]/20 text-[#a79aff] border border-[#8978ff]/30">
                    {plan.billingPeriod}
                  </span>
                  <span className="text-xs font-mono text-white/40">
                    {plan.activeSubscribersCount} active
                  </span>
                </div>

                <h3 className="font-bold text-white mt-4 text-base">{plan.name}</h3>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">
                    {plan.formattedPrice}
                  </span>
                  <span className="text-xs text-white/50 font-mono">
                    / {plan.billingPeriod.toLowerCase()}
                  </span>
                </div>

                <div className="mt-5 space-y-2 text-xs text-white/70 border-t border-white/10 pt-4">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Pausable: {plan.pausable ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Closable Early: {plan.closable ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Renewable: {plan.renewable ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>}
      </div>

      {/* New Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0e0c24] text-white rounded-3xl p-6 shadow-2xl border border-white/15 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-bold text-white text-sm">Add New Product</h3>
              <button onClick={closeProductModal}>
                <X className="w-4 h-4 text-white/50" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-white/60 font-medium mb-1 font-mono">Product Name</label>
                <input
                  type="text"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="e.g. Invoicing Engine Connector"
                  className="w-full p-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-white/60 font-medium mb-1 font-mono">Base Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={salesPrice}
                  onChange={(e) => setSalesPrice(e.target.value)}
                  placeholder="e.g. 49.00"
                  className="w-full p-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-white/60 font-medium mb-1 font-mono">Description / Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. High throughput connector"
                  className="w-full p-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-2">
                <span className="font-semibold text-white/80">Add-on Variant (Optional)</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={variantVal}
                    onChange={(e) => setVariantVal(e.target.value)}
                    placeholder="Variant (e.g. Odoo Connector)"
                    className="p-2 rounded-lg border border-white/10 bg-white/5 text-white"
                  />
                  <input
                    type="number"
                    value={variantExtra}
                    onChange={(e) => setVariantExtra(e.target.value)}
                    placeholder="Extra Price (+560)"
                    className="p-2 rounded-lg border border-white/10 bg-white/5 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={closeProductModal}
                  className="px-4 py-2 rounded-full text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#8978ff] text-white font-semibold hover:bg-[#9b8cff] shadow-[0_4px_20px_rgba(137,120,255,0.4)]"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Plan Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0e0c24] text-white rounded-3xl p-6 shadow-2xl border border-white/15 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-bold text-white text-sm">Add New Billing Plan</h3>
              <button onClick={closePlanModal}>
                <X className="w-4 h-4 text-white/50" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4 text-xs">
              <div>
                <label className="block text-white/60 font-medium mb-1 font-mono">Plan Name</label>
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="e.g. Enterprise Unlimited"
                  className="w-full p-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-white/60 font-medium mb-1 font-mono">Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={planPrice}
                  onChange={(e) => setPlanPrice(e.target.value)}
                  placeholder="e.g. 199.00"
                  className="w-full p-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-white/60 font-medium mb-1 font-mono">Billing Period</label>
                <select
                  value={planPeriod}
                  onChange={(e) => setPlanPeriod(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none"
                >
                  <option value="DAILY" className="bg-[#120e28] text-white">Daily</option>
                  <option value="WEEKLY" className="bg-[#120e28] text-white">Weekly</option>
                  <option value="MONTHLY" className="bg-[#120e28] text-white">Monthly</option>
                  <option value="YEARLY" className="bg-[#120e28] text-white">Yearly</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={closePlanModal}
                  className="px-4 py-2 rounded-full text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#8978ff] text-white font-semibold hover:bg-[#9b8cff] shadow-[0_4px_20px_rgba(137,120,255,0.4)]"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
