'use client'

import React, { useState, useEffect } from 'react'
import { Tag, Plus, Percent, Calendar, ShieldCheck, X, AlertTriangle } from 'lucide-react'
import { formatDate } from '@/lib/format'

export default function DiscountsPage() {
  const [data, setData] = useState<{ discounts: any[]; taxes: any[] }>({
    discounts: [],
    taxes: [],
  })
  const [loading, setLoading] = useState(true)
  const [isNewDiscountOpen, setIsNewDiscountOpen] = useState(false)

  // Form
  const [name, setName] = useState('')
  const [type, setType] = useState('PERCENTAGE')
  const [value, setValue] = useState('')
  const [usageLimit, setUsageLimit] = useState('100')
  const [days, setDays] = useState('30')

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/discounts')
      const d = await res.json()
      setData(d)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          value: Number(value),
          usageLimit: Number(usageLimit),
          days: Number(days),
        }),
      })
      if (!res.ok) throw new Error('Failed to create discount')
      setIsNewDiscountOpen(false)
      setName('')
      setValue('')
      fetchData()
    } catch (err: any) {
      alert(err.message || 'Error creating discount')
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-10 py-8 space-y-10 text-white">
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
              Time-windowed campaigns with usage limit ceilings and dynamic tax rules
            </p>
          </div>

          <button
            onClick={() => setIsNewDiscountOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#8978ff] hover:bg-[#9b8cff] text-white text-xs font-semibold shadow-[0_4px_20px_rgba(137,120,255,0.4)] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Discount</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.discounts.map((disc) => (
            <div
              key={disc.id}
              className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-sm hover:border-[#8978ff]/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
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
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">
                    {disc.type === 'PERCENTAGE' ? `${disc.value}%` : `₹${disc.value}`}
                  </span>
                  <span className="text-xs text-white/50 font-mono">OFF</span>
                </div>

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
                    <span>Valid until:</span>
                    <span className="font-medium text-white/80">{formatDate(disc.endDate)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Taxes Section */}
      <div className="space-y-6 pt-6 border-t border-white/10">
        <div>
          <p className="eyebrow text-[#a79aff] text-[10px] tracking-[0.25em] font-mono uppercase mb-1">
            STATUTORY LEVIES
          </p>
          <h2 className="text-2xl font-normal tracking-[-0.085em]">
            Configured Taxes. <em className="italic text-[#8978ff]">Auto Calculated.</em>
          </h2>
          <p className="text-xs text-white/60 mt-1 font-mono">
            Dynamic tax rates automatically calculated per item line during invoice generation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.taxes.map((t) => (
            <div
              key={t.id}
              className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-sm hover:border-[#8978ff]/40 transition-all flex items-center justify-between"
            >
              <div>
                <h3 className="font-bold text-white text-base">{t.name}</h3>
                <p className="text-xs text-white/40 capitalize mt-0.5 font-mono">{t.type.toLowerCase()} rate</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-extrabold text-[#8978ff]">
                  {t.type === 'PERCENTAGE' ? `${t.value}%` : `$${t.value}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Discount Modal */}
      {isNewDiscountOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0e0c24] text-white rounded-3xl p-6 shadow-2xl border border-white/15 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-bold text-white text-sm">Create Discount Rule</h3>
              <button onClick={() => setIsNewDiscountOpen(false)}>
                <X className="w-4 h-4 text-white/50" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-white/60 font-medium mb-1 font-mono">Coupon Code / Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase())}
                  placeholder="e.g. FLASH2026"
                  className="w-full p-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none uppercase font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 font-medium mb-1 font-mono">Discount Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
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
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="e.g. 20"
                    className="w-full p-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 font-medium mb-1 font-mono">Usage Limit</label>
                  <input
                    type="number"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/60 font-medium mb-1 font-mono">Duration (Days)</label>
                  <input
                    type="number"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsNewDiscountOpen(false)}
                  className="px-4 py-2 rounded-full text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#8978ff] text-white font-semibold hover:bg-[#9b8cff] shadow-[0_4px_20px_rgba(137,120,255,0.4)]"
                >
                  Create Discount
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
