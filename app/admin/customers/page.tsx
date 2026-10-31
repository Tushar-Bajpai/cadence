'use client'

import React, { useState, useEffect } from 'react'
import { Users, Search, Mail, Phone, Calendar, MapPin, ChevronRight } from 'lucide-react'
import { CustomerModal, CustomerModalData } from '@/components/admin/customer-modal'
import { CardSkeletonGrid } from '@/components/ui/skeleton'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerModalData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/customers')
      const data = await res.json()
      if (!res.ok || !Array.isArray(data)) {
        setCustomers([])
        setError(data?.error || 'Unable to load customers.')
        return
      }
      setCustomers(data)
    } catch (err) {
      console.error(err)
      setCustomers([])
      setError('Unable to load customers. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const initialSearch = new URLSearchParams(window.location.search).get('search')
    if (initialSearch !== null) setSearch(initialSearch)
    fetchCustomers()
  }, [])

  const handleOpenCustomer = async (customerId: string) => {
    try {
      const res = await fetch(`/api/customers?id=${customerId}`)
      const data = await res.json()
      if (res.ok) {
        setSelectedCustomer(data)
        setIsModalOpen(true)
      } else {
        alert(data.error || 'Failed to fetch customer details')
      }
    } catch (err: any) {
      alert(err.message || 'Error opening customer modal')
    }
  }

  const filteredCustomers = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.companyName?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-10 py-8 space-y-6 text-white">
      {/* Header */}
      <div>
        <p className="eyebrow text-[#a79aff] text-[10px] tracking-[0.25em] font-mono uppercase mb-1">
          SUBSCRIBER PORTFOLIO
        </p>
        <h1 className="text-3xl font-normal tracking-[-0.085em]">
          Customer Directory. <em className="italic text-[#8978ff]">Unified Profiles.</em>
        </h1>
        <p className="text-xs text-white/60 mt-1 font-mono">
          Subscriber profiles, active contracts, and cross-channel activity feeds
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          placeholder="Search by name, company, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white/[0.04] text-white placeholder-white/40 border border-white/10 focus:outline-none focus:border-[#8978ff] focus:ring-1 focus:ring-[#8978ff] shadow-sm"
        />
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {/* Grid of Customer Cards */}
      {loading ? <CardSkeletonGrid count={6} /> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((cust) => (
          <div
            key={cust.id}
            onClick={() => handleOpenCustomer(cust.id)}
            className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-sm hover:border-[#8978ff]/50 hover:shadow-[0_10px_35px_rgba(137,120,255,0.2)] transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-amber-500 flex items-center justify-center text-amber-950 font-bold text-sm shadow-xs">
                    {cust.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm group-hover:text-[#8978ff] transition-colors">
                      {cust.name}
                    </h3>
                    <p className="text-[11px] text-white/50 font-medium">{cust.companyName}</p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    cust.role === 'ADMIN'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-white/10 text-white/70'
                  }`}
                >
                  {cust.role === 'ADMIN' ? 'Admin' : 'Customer'}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-xs text-white/70">
                <div className="flex items-center gap-2 text-white/60">
                  <Mail className="w-3.5 h-3.5 text-[#8978ff] shrink-0" />
                  <span className="truncate">{cust.email}</span>
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <Phone className="w-3.5 h-3.5 text-[#8978ff] shrink-0" />
                  <span>{cust.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <MapPin className="w-3.5 h-3.5 text-[#8978ff] shrink-0" />
                  <span className="truncate">{cust.location}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-white/40 uppercase font-mono font-semibold">Active Sub</span>
                <p className="font-bold text-white">{cust.activeSubscriptionsCount}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-white/40 uppercase font-mono font-semibold">Total Paid</span>
                <p className="font-bold text-emerald-400">{cust.formattedTotalSpent}</p>
              </div>
              <div className="p-1 rounded-lg bg-white/5 group-hover:bg-[#8978ff]/20 text-white/40 group-hover:text-[#8978ff] transition-colors">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>}

      <CustomerModal
        customer={selectedCustomer}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
