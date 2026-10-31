'use client'

import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  Check,
  ArrowRight,
  ShieldCheck,
  Zap,
  Package,
  Clock,
  Layers,
  Plus,
  Minus,
  CheckCircle2,
  Calendar,
  Tag,
  Info,
} from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { usePortalStore } from '@/stores/use-portal-store'

interface PlanItem {
  id: string
  name: string
  price: number
  formattedPrice: string
  billingPeriod: string
  minQuantity: number
  pausable: boolean
  closable: boolean
  renewable: boolean
  autoCloseOnEnd: boolean
}

interface ProductVariantItem {
  id: string
  attribute: string
  value: string
  extraPrice: number
  formattedExtraPrice: string
}

interface ProductItem {
  id: string
  name: string
  type: string
  salesPrice: number
  formattedSalesPrice: string
  notes?: string
  taxes: Array<{ id: string; name: string; type: string; value: number }>
  variants: ProductVariantItem[]
}

interface ExistingSubscription {
  id: string
  seq: number
  number: string
  status: string
  planName: string
}

interface CatalogViewProps {
  onSubscriptionCreated: () => void
}

export function CatalogView({ onSubscriptionCreated }: CatalogViewProps) {
  const [plans, setPlans] = useState<PlanItem[]>([])
  const [products, setProducts] = useState<ProductItem[]>([])
  const [existingSubs, setExistingSubs] = useState<ExistingSubscription[]>([])
  const [loading, setLoading] = useState(true)

  // Zustand global configurator state
  const {
    selectedPlanId,
    setSelectedPlanId,
    selectedProductId,
    setSelectedProductId,
    selectedVariantId,
    setSelectedVariantId,
    quantity,
    setQuantity,
    resetConfigurator,
  } = usePortalStore()

  // Subscribing target mode: 'new' or 'existing'
  const [targetMode, setTargetMode] = useState<'new' | 'existing'>('new')
  const [targetSubId, setTargetSubId] = useState<string | null>(null)

  // Filter
  const [periodFilter, setPeriodFilter] = useState<string>('ALL')

  const [subscribing, setSubscribing] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [plansRes, productsRes, subsRes] = await Promise.all([
        fetch('/api/plans'),
        fetch('/api/products'),
        fetch('/api/portal/subscriptions'),
      ])
      const plansData = await plansRes.json()
      const productsData = await productsRes.json()
      const subsData = await subsRes.json()

      const validPlans = Array.isArray(plansData) ? plansData : []
      const validProducts = Array.isArray(productsData) ? productsData : []
      const validSubs = Array.isArray(subsData) ? subsData : []

      setPlans(validPlans)
      setProducts(validProducts)
      setExistingSubs(
        validSubs.map((s: any) => ({
          id: s.id,
          seq: s.seq,
          number: s.number,
          status: s.status,
          planName: s.plan?.name || 'Subscription',
        }))
      )

      if (validPlans.length > 0 && !selectedPlanId) {
        setSelectedPlanId(validPlans[0].id)
        setQuantity(validPlans[0].minQuantity || 1)
      }
      if (validProducts.length > 0 && !selectedProductId) {
        setSelectedProductId(validProducts[0].id)
        if (validProducts[0].variants?.length > 0) {
          setSelectedVariantId(validProducts[0].variants[0].id)
        }
      }
      if (validSubs.length > 0 && !targetSubId) {
        setTargetSubId(validSubs[0].id)
      }
    } catch (err) {
      console.error('Error fetching catalog data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const selectedPlan = plans.find((p) => p.id === selectedPlanId)
  const selectedProduct = products.find((p) => p.id === selectedProductId)
  const selectedVariant = selectedProduct?.variants?.find((v) => v.id === selectedVariantId)

  // When plan changes, ensure quantity respects minQuantity
  const handleSelectPlan = (plan: PlanItem) => {
    setSelectedPlanId(plan.id)
    if (quantity < plan.minQuantity) {
      setQuantity(plan.minQuantity)
    }
  }

  // Real-time pricing calculations matching Phase 3 specs
  const basePlanPrice = selectedPlan ? Number(selectedPlan.price) : 0
  const productBasePrice = selectedProduct ? Number(selectedProduct.salesPrice) : 0
  const variantExtraPrice = selectedVariant ? Number(selectedVariant.extraPrice) : 0

  // Effective unit price for product + variant (lib/pricing.ts getUnitPrice)
  const effectiveProductUnitPrice = productBasePrice + variantExtraPrice

  // Total line calculation
  const totalBasePrice = basePlanPrice + effectiveProductUnitPrice
  const subtotal = totalBasePrice * quantity

  // Taxes calculation
  const taxRates = selectedProduct?.taxes || []
  const taxPercent = taxRates.reduce((acc, t) => acc + (t.type === 'PERCENTAGE' ? Number(t.value) : 0), 0)
  const taxAmount = (subtotal * taxPercent) / 100
  const grandTotal = subtotal + taxAmount

  const handleSubscribe = async () => {
    try {
      setSubscribing(true)

      if (targetMode === 'existing' && targetSubId) {
        // Add variant addon line to existing subscription
        if (!selectedProductId) throw new Error('Please select a product or variant addon.')
        const res = await fetch(`/api/portal/subscriptions/${targetSubId}/lines`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: selectedProductId,
            variantId: selectedVariantId,
            quantity,
          }),
        })
        const result = await res.json()
        if (!res.ok) throw new Error(result.error || 'Failed to add addon line.')
        setSuccessMessage(`Successfully added ${selectedProduct?.name}${selectedVariant ? ` (${selectedVariant.value})` : ''} to subscription!`)
      } else {
        // Create new subscription with plan & variant
        if (!selectedPlanId) throw new Error('Please select a billing plan.')
        const res = await fetch('/api/portal/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: selectedPlanId,
            productId: selectedProductId,
            variantId: selectedVariantId,
            quantity,
          }),
        })
        const result = await res.json()
        if (!res.ok) throw new Error(result.error || 'Failed to create subscription.')
        setSuccessMessage(`Activated subscription to ${selectedPlan?.name}!`)
      }

      setTimeout(() => {
        setSuccessMessage(null)
        onSubscriptionCreated()
      }, 1500)
    } catch (err: any) {
      alert(err.message || 'Subscription failed')
    } finally {
      setSubscribing(false)
    }
  }

  // Filter plans
  const filteredPlans = plans.filter((p) => {
    if (periodFilter === 'ALL') return true
    return p.billingPeriod === periodFilter
  })

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-white/50 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#8978ff] border-t-transparent animate-spin" />
        <span className="text-xs font-mono uppercase tracking-wider">Loading Products, Variants & Plans...</span>
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-200">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8978ff] font-bold">
            Phase 3 • Subscription Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-normal tracking-[-0.03em] text-white mt-1.5">
            Products, Variants & <em className="italic text-[#8978ff] font-serif">Billing Plans</em>
          </h2>
          <p className="text-xs sm:text-sm text-white/50 mt-1 max-w-2xl leading-relaxed">
            Select contract recurrence, configure modular variant add-ons (such as Odoo integration +₹560), and preview real-time tax breakdowns.
          </p>
        </div>

        {/* Period Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/10 text-xs self-start md:self-end">
          {['ALL', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].map((period) => (
            <button
              key={period}
              onClick={() => setPeriodFilter(period)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                periodFilter === period
                  ? 'bg-[#8978ff] text-white shadow-[0_0_12px_rgba(137,120,255,0.4)]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {period.charAt(0) + period.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2.5 animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Step 1: Select Billing Plan */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#8978ff]/20 text-[#8978ff] border border-[#8978ff]/40 flex items-center justify-center text-xs font-bold font-mono">
              1
            </span>
            <h3 className="text-base font-bold text-white tracking-tight">
              Select Recurring Plan & Contract Terms
            </h3>
          </div>
          <span className="text-[11px] font-mono text-white/40 uppercase">
            {filteredPlans.length} Available Plans
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredPlans.map((plan) => {
            const isSelected = selectedPlanId === plan.id
            return (
              <div
                key={plan.id}
                onClick={() => handleSelectPlan(plan)}
                className={`relative rounded-3xl p-6 border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#15113d] border-[#8978ff] shadow-[0_0_35px_rgba(137,120,255,0.25)] ring-1 ring-[#8978ff]'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#8978ff] flex items-center justify-center text-white shadow-sm">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}

                <div>
                  <span className="inline-block text-[10px] font-mono uppercase tracking-wider text-[#a79aff] bg-[#8978ff]/10 px-2 py-0.5 rounded-md border border-[#8978ff]/20">
                    {plan.billingPeriod}
                  </span>
                  <h4 className="text-xl font-bold text-white mt-2.5">{plan.name}</h4>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white tracking-tight">
                      ₹{Number(plan.price).toFixed(2)}
                    </span>
                    <span className="text-xs text-white/50">
                      /{plan.billingPeriod.toLowerCase()}
                    </span>
                  </div>

                  {/* Policy switches breakdown */}
                  <div className="mt-5 pt-4 border-t border-white/10 space-y-2.5 text-xs text-white/70">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${plan.pausable ? 'bg-emerald-400' : 'bg-white/20'}`} />
                      <span className="text-white/80">{plan.pausable ? 'Pausable anytime' : 'Non-pausable'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${plan.closable ? 'bg-emerald-400' : 'bg-white/20'}`} />
                      <span className="text-white/80">{plan.closable ? 'Cancel anytime' : 'Fixed commitment'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${plan.renewable ? 'bg-emerald-400' : 'bg-white/20'}`} />
                      <span className="text-white/80">{plan.renewable ? 'Auto-renewable' : 'Non-renewable'}</span>
                    </div>
                    {plan.minQuantity > 1 && (
                      <div className="text-[11px] text-[#a79aff] font-mono">
                        Min. Quantity: {plan.minQuantity} units
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-2">
                  <button
                    type="button"
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#8978ff] text-white shadow-[0_2px_12px_rgba(137,120,255,0.4)]'
                        : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {isSelected ? 'Plan Selected' : 'Choose Plan'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Step 2: Select Product & Variant Add-on */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#8978ff]/20 text-[#8978ff] border border-[#8978ff]/40 flex items-center justify-center text-xs font-bold font-mono">
              2
            </span>
            <h3 className="text-base font-bold text-white tracking-tight">
              Select Product & Variant Add-on (Dynamic Price Calculation)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-white/40 uppercase">
            Effective: base + variant
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {products.map((prod) => {
            const isProdSelected = selectedProductId === prod.id
            return (
              <div
                key={prod.id}
                onClick={() => {
                  setSelectedProductId(prod.id)
                  if (prod.variants?.length > 0 && (!selectedVariantId || !prod.variants.some((v) => v.id === selectedVariantId))) {
                    setSelectedVariantId(prod.variants[0].id)
                  }
                }}
                className={`rounded-3xl p-6 border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isProdSelected
                    ? 'bg-[#15113d] border-[#8978ff]/80 shadow-[0_0_25px_rgba(137,120,255,0.2)] ring-1 ring-[#8978ff]/50'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 bg-white/5 px-2 py-0.5 rounded">
                      {prod.type}
                    </span>
                    <span className="text-xs font-bold text-white">
                      Base: ${Number(prod.salesPrice).toFixed(2)}
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-white mt-3">{prod.name}</h4>
                  {prod.notes && (
                    <p className="text-xs text-white/50 mt-1 line-clamp-2">{prod.notes}</p>
                  )}

                  {/* Taxes Tag */}
                  {prod.taxes?.length > 0 && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-[#a79aff]">
                      <Tag className="w-3 h-3" />
                      <span>{prod.taxes.map((t) => `${t.name} (${t.value}%)`).join(', ')}</span>
                    </div>
                  )}

                  {/* Product Variants (e.g. Odoo brand +₹560) */}
                  {prod.variants?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
                        Available Variants & Addons:
                      </span>
                      <div className="space-y-1.5">
                        {prod.variants.map((v) => {
                          const isVarSelected = isProdSelected && selectedVariantId === v.id
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedProductId(prod.id)
                                setSelectedVariantId(isVarSelected ? null : v.id)
                              }}
                              className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition cursor-pointer ${
                                isVarSelected
                                  ? 'bg-[#8978ff] text-white border-[#8978ff] shadow-sm'
                                  : 'bg-white/[0.04] text-white/80 border-white/10 hover:bg-white/[0.08]'
                              }`}
                            >
                              <div>
                                <span className="font-semibold block">{v.value}</span>
                                <span className={`text-[10px] ${isVarSelected ? 'text-white/80' : 'text-white/40'}`}>
                                  {v.attribute}
                                </span>
                              </div>
                              <span className={`font-mono font-bold ${isVarSelected ? 'text-white' : 'text-[#8978ff]'}`}>
                                +₹${Number(v.extraPrice).toFixed(2)}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Step 3: Subscription Mode & Checkout Breakdown */}
      <section className="rounded-3xl bg-[#0e0c24] border border-white/15 p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#8978ff]/20 text-[#8978ff] border border-[#8978ff]/40 flex items-center justify-center text-xs font-bold font-mono">
                3
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Subscription Order Summary
              </h3>
            </div>
            <p className="text-xs text-white/50 mt-1">
              Deterministic subscription line generation with idempotent invoicing guarantee.
            </p>
          </div>

          {/* Target Mode Switcher */}
          {existingSubs.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setTargetMode('new')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                  targetMode === 'new'
                    ? 'bg-[#8978ff] text-white'
                    : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                New Subscription
              </button>
              <button
                type="button"
                onClick={() => setTargetMode('existing')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                  targetMode === 'existing'
                    ? 'bg-[#8978ff] text-white'
                    : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                Add to Existing Active Sub
              </button>
            </div>
          )}
        </div>

        {targetMode === 'existing' && existingSubs.length > 0 && (
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
            <label className="text-xs font-medium text-white/70 block">
              Select Destination Subscription:
            </label>
            <select
              value={targetSubId || ''}
              onChange={(e) => setTargetSubId(e.target.value)}
              className="w-full bg-[#120e28] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#8978ff]"
            >
              {existingSubs.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.number} – {sub.planName} ({sub.status})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Quantity Controls & Line Items Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white/60">
              Configured Line Items
            </h4>

            <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-4 space-y-3 text-xs">
              {/* Plan Line */}
              {targetMode === 'new' && selectedPlan && (
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <div>
                    <span className="font-semibold text-white block">{selectedPlan.name} Plan</span>
                    <span className="text-[11px] text-white/40">{selectedPlan.billingPeriod} recurring cycle</span>
                  </div>
                  <span className="font-mono font-semibold text-white">
                    ${Number(selectedPlan.price).toFixed(2)}
                  </span>
                </div>
              )}

              {/* Product Line */}
              {selectedProduct && (
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <div>
                    <span className="font-semibold text-white block">{selectedProduct.name}</span>
                    <span className="text-[11px] text-white/40">{selectedProduct.type}</span>
                  </div>
                  <span className="font-mono font-semibold text-white">
                    ₹{Number(selectedProduct.salesPrice).toFixed(2)}
                  </span>
                </div>
              )}

              {/* Variant Addon Line (e.g. Odoo connector +₹560) */}
              {selectedVariant && (
                <div className="flex items-center justify-between py-1.5 border-b border-white/5 bg-[#8978ff]/10 p-2.5 rounded-xl border border-[#8978ff]/20">
                  <div>
                    <span className="font-semibold text-[#a79aff] block">
                      {selectedVariant.attribute}: {selectedVariant.value}
                    </span>
                    <span className="text-[11px] text-white/40">Modular variant addon</span>
                  </div>
                  <span className="font-mono font-bold text-[#8978ff]">
                    +₹{Number(selectedVariant.extraPrice).toFixed(2)}
                  </span>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="pt-2 flex items-center justify-between">
                <div>
                  <span className="font-medium text-white block">Quantity / Seats</span>
                  <span className="text-[11px] text-white/40">
                    Min required: {selectedPlan?.minQuantity || 1} units
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(selectedPlan?.minQuantity || 1, quantity - 1))}
                    className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-xs font-bold font-mono text-white">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Total Summary Box */}
          <div className="lg:col-span-5 rounded-2xl bg-white/[0.04] border border-white/10 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-white/60">
                <span>Subtotal ({quantity} {quantity === 1 ? 'unit' : 'units'}):</span>
                <span className="font-mono font-semibold text-white">₹{subtotal.toFixed(2)}</span>
              </div>

              {taxPercent > 0 && (
                <div className="flex items-center justify-between text-white/60">
                  <span>Estimated Taxes ({taxPercent}%):</span>
                  <span className="font-mono font-semibold text-white">₹{taxAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-white/10 flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-white/50 block">Recurring Cycle Total</span>
                  <span className="text-2xl font-extrabold text-white">
                    ₹{grandTotal.toFixed(2)}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-white/40">
                  /{selectedPlan?.billingPeriod?.toLowerCase() || 'cycle'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10">
              <button
                onClick={handleSubscribe}
                disabled={subscribing || (!selectedPlanId && targetMode === 'new')}
                className="w-full py-3 px-4 rounded-xl bg-[#8978ff] hover:bg-[#9b8cff] text-white font-semibold text-xs transition shadow-[0_4px_25px_rgba(137,120,255,0.45)] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {subscribing
                    ? 'Processing Contract...'
                    : targetMode === 'existing'
                    ? 'Attach Addon to Subscription'
                    : 'Confirm & Activate Subscription'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-white/40">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero duplicate billing guarantee (@@unique[subscriptionId, periodStart])</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
