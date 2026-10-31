'use client'

import React, { useState, useEffect } from 'react'
import { Sparkles, Check, ArrowRight, ShieldCheck, Zap } from 'lucide-react'

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
  salesPrice: number
  formattedSalesPrice: string
  variants: ProductVariantItem[]
}

interface CatalogViewProps {
  onSubscriptionCreated: () => void
}

export function CatalogView({ onSubscriptionCreated }: CatalogViewProps) {
  const [plans, setPlans] = useState<PlanItem[]>([])
  const [products, setProducts] = useState<ProductItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [subscribing, setSubscribing] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [plansRes, productsRes] = await Promise.all([
        fetch('/api/plans'),
        fetch('/api/products'),
      ])
      const plansData = await plansRes.json()
      const productsData = await productsRes.json()
      setPlans(Array.isArray(plansData) ? plansData : [])
      setProducts(Array.isArray(productsData) ? productsData : [])
      if (plansData.length > 0) {
        setSelectedPlanId(plansData[0].id)
      }
      if (productsData.length > 0) {
        setSelectedProductId(productsData[0].id)
        if (productsData[0].variants?.length > 0) {
          setSelectedVariantId(productsData[0].variants[0].id)
        }
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

  // Pricing calculation matching lib/pricing.ts getUnitPrice()
  const basePrice = selectedPlan ? Number(selectedPlan.price) : 29
  const variantExtra = selectedVariant ? Number(selectedVariant.extraPrice) : 0
  const totalPrice = basePrice + variantExtra

  const handleSubscribe = async () => {
    if (!selectedPlanId) return
    try {
      setSubscribing(true)
      const res = await fetch('/api/portal/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanId,
          productId: selectedProductId,
          variantId: selectedVariantId,
          quantity: selectedPlan?.minQuantity || 1,
        }),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to subscribe')

      setSuccessMessage(`Activated subscription to ${selectedPlan?.name}!`)
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

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-white/50 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#8978ff] border-t-transparent animate-spin" />
        <span className="text-xs">Loading Phase 3 catalog and plan policies...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Title */}
      <div>
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#8978ff]">
          Phase 3 Catalog Engine
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
          Browse Plans & <em className="italic text-[#8978ff] font-serif">Add-on Variants</em>
        </h2>
        <p className="text-sm text-white/50 mt-1">
          Choose a recurrence interval with fine-grained policy switches (pausable, closable, auto-close).
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => {
          const isSelected = selectedPlanId === plan.id
          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              className={`relative rounded-3xl p-5 border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#15113d] border-[#8978ff] shadow-[0_0_30px_rgba(137,120,255,0.25)]'
                  : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]'
              }`}
            >
              {isSelected && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#8978ff] flex items-center justify-center text-white">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}

              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-white/50">
                  {plan.billingPeriod}
                </span>
                <h3 className="text-xl font-bold text-white mt-1">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">
                    ${Number(plan.price).toFixed(2)}
                  </span>
                  <span className="text-xs text-white/50">
                    /{plan.billingPeriod.toLowerCase()}
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10 space-y-2 text-xs text-white/70">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${plan.pausable ? 'bg-emerald-400' : 'bg-white/20'}`} />
                    <span>{plan.pausable ? 'Pausable anytime' : 'Non-pausable'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${plan.closable ? 'bg-emerald-400' : 'bg-white/20'}`} />
                    <span>{plan.closable ? 'Cancel anytime' : 'Fixed contract'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${plan.renewable ? 'bg-emerald-400' : 'bg-white/20'}`} />
                    <span>{plan.renewable ? 'Auto-renewable' : 'Non-renewable'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-2">
                <button
                  type="button"
                  className={`w-full py-2 px-3 rounded-xl text-xs font-semibold transition ${
                    isSelected
                      ? 'bg-[#8978ff] text-white shadow-[0_2px_12px_rgba(137,120,255,0.4)]'
                      : 'bg-white/10 text-white/70 hover:text-white'
                  }`}
                >
                  {isSelected ? 'Selected' : 'Choose Plan'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Product Variants & Add-ons (e.g. Odoo brand +560) */}
      {products.length > 0 && (
        <div className="rounded-3xl bg-[#0e0c24] border border-white/10 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#8978ff]" />
                Select Integration & Variant Add-on
              </h3>
              <p className="text-xs text-white/50 mt-0.5">
                Dynamic extra price calculation (`getUnitPrice`) applied seamlessly to the subscription line.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {products.flatMap((prod) =>
              (prod.variants || []).map((v) => {
                const isSelected = selectedVariantId === v.id
                return (
                  <div
                    key={v.id}
                    onClick={() => {
                      setSelectedProductId(prod.id)
                      setSelectedVariantId(isSelected ? null : v.id)
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#1b1548] border-[#8978ff] text-white shadow-[0_0_16px_rgba(137,120,255,0.2)]'
                        : 'bg-white/[0.02] border-white/10 text-white/70 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-mono uppercase text-white/40 block">
                        {v.attribute} Addon
                      </span>
                      <span className="text-sm font-semibold text-white block mt-0.5">
                        {v.value}
                      </span>
                      <span className="text-xs text-[#8978ff] font-medium block mt-1">
                        +${Number(v.extraPrice).toFixed(2)}
                      </span>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'bg-[#8978ff] border-[#8978ff] text-white'
                          : 'border-white/20'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Checkout Breakdown Summary */}
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs text-white/50">Calculated Effective Price:</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">
                  ${totalPrice.toFixed(2)}
                </span>
                <span className="text-xs text-white/40">
                  ({selectedPlan?.name || 'Pro Plan'} ${basePrice.toFixed(2)}
                  {variantExtra > 0 ? ` + ${selectedVariant?.value} $${variantExtra.toFixed(2)}` : ''})
                </span>
              </div>
            </div>

            <button
              onClick={handleSubscribe}
              disabled={subscribing || !selectedPlanId}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#8978ff] hover:bg-[#9b8cff] text-white font-semibold text-sm transition shadow-[0_4px_20px_rgba(137,120,255,0.4)] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{subscribing ? 'Provisioning...' : 'Confirm Subscription'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
