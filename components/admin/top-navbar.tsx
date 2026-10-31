'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  Users,
  ShoppingBag,
  CreditCard,
  ScrollText,
  Box,
  Tag,
  FileText,
  Search,
  Settings,
  Zap,
  ExternalLink,
  User,
  LogOut,
} from 'lucide-react'
import { useAdminStore } from '@/stores/use-admin-store'
import { useAuthStore } from '@/stores/use-auth-store'

interface TopNavbarProps {
  onRunBillingClick?: () => void
  onCustomerModalClick?: () => void
}

export function TopNavbar({ onRunBillingClick, onCustomerModalClick }: TopNavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const store = useAdminStore()

  const handleRunBilling = onRunBillingClick || store.openRunBilling
  const handleCustomerModal = onCustomerModalClick || (() => store.openCustomerModal())

  const searchQuery = store.searchQuery
  const setSearchQuery = store.setSearchQuery
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)

  // 7 navigation icon tabs matching reference screenshot:
  const navItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: Home,
    },
    {
      name: 'Customers',
      href: '/admin/customers',
      icon: Users,
    },
    {
      name: 'Invoices',
      href: '/admin/invoices',
      icon: ShoppingBag,
    },
    {
      name: 'Payments',
      href: '/admin/payments',
      icon: CreditCard,
    },
    {
      name: 'Subscriptions',
      href: '/admin/subscriptions',
      icon: ScrollText,
    },
    {
      name: 'Products & Plans',
      href: '/admin/products',
      icon: Box,
    },
    {
      name: 'Taxes & Discounts',
      href: '/admin/discounts',
      icon: Tag,
    },
    {
      name: 'Quotation Templates',
      href: '/admin/templates',
      icon: FileText,
    },
  ]

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    router.push(`/admin/invoices?search=${encodeURIComponent(searchQuery)}`)
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-[#08061d]/90 backdrop-blur-xl border-b border-white/10 px-5 py-3 select-none">
      <div className="w-full flex items-center justify-between gap-4">
        {/* Left Section: 4-Dots Logo + Cadence Title + 7 Icon Tabs */}
        <div className="flex items-center gap-6 sm:gap-7 shrink-0">
          {/* Exact 4-dots brand logo matching reference image */}
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <svg
              className="w-5 h-5 shrink-0 group-hover:scale-105 transition-transform"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="6.5" cy="6.5" r="4.2" fill="white" />
              <circle cx="17.5" cy="6.5" r="4.2" fill="white" />
              <circle cx="6.5" cy="17.5" r="4.2" fill="white" />
              <circle cx="17.5" cy="17.5" r="4.2" fill="white" />
            </svg>
            <span className="font-bold text-white text-[17px] tracking-tight group-hover:text-[#8978ff] transition-colors">
              Cadence
            </span>
          </Link>

          {/* Sequence of square rounded icon tabs matching reference image */}
          <nav className="flex items-center gap-2">
            {navItems.map((item) => {
              const active = isActive(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.name}
                  className={`group relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                    active
                      ? 'bg-[#8978ff] text-white shadow-[0_0_20px_rgba(137,120,255,0.4)] ring-1 ring-[#8978ff]'
                      : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] border border-white/10'
                  }`}
                >
                  <Icon className="w-[18px] h-[18px] transition-transform group-hover:scale-105" strokeWidth={1.8} />

                  {/* Tooltip on hover */}
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-[#120e28] text-white text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl border border-white/15 z-50">
                    {item.name}
                  </span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right Section: Search Bar + Run Billing + Settings + Avatar (Matching Image 1) */}
        <div className="flex items-center gap-3 flex-1 max-w-lg justify-end">
          {/* Search bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex-1 max-w-xs hidden sm:block"
          >
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" strokeWidth={1.8} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search here ..."
              className="w-full h-10 pl-9 pr-3 text-xs rounded-xl bg-white/[0.04] text-white placeholder-white/35 border border-white/10 focus:outline-none focus:border-[#8978ff] focus:ring-1 focus:ring-[#8978ff] transition-all"
            />
          </form>

          {/* Quick Billing Engine Run Action matching Image 1 */}
          <button
            onClick={handleRunBilling}
            title="Execute Idempotent Billing Cycle"
            className="hidden sm:inline-flex items-center gap-2 h-10 px-5 rounded-full bg-[#8978ff] hover:bg-[#9b8cff] text-white text-xs sm:text-sm font-semibold shadow-[0_4px_20px_rgba(137,120,255,0.4)] transition-all whitespace-nowrap cursor-pointer active:scale-95"
          >
            <Zap className="w-4 h-4 fill-white text-white" />
            <span>Run Billing</span>
            <span>⚡</span>
          </button>

          {/* Settings & Account Cluster matching Image 1 */}
          <div className="relative">
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              title="Settings & Account (Click to Open Menu)"
              className="w-10 h-10 rounded-2xl bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/[0.08] border border-white/10 flex items-center justify-center transition-all cursor-pointer active:scale-95"
            >
              <Settings className="w-5 h-5" strokeWidth={1.8} />
            </button>

            {showSettingsMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-[#120e28] rounded-2xl border border-white/15 shadow-2xl p-2 z-50 text-xs space-y-1 backdrop-blur-xl animate-in fade-in duration-150">
                <div className="px-3 py-2 border-b border-white/10 mb-1">
                  <p className="font-semibold text-white truncate">Administrator</p>
                  <p className="text-[10px] text-white/50 font-mono">admin@cadence.dev</p>
                </div>

                <button
                  onClick={() => {
                    setShowSettingsMenu(false)
                    handleRunBilling()
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 text-left font-medium cursor-pointer transition-colors"
                >
                  <Zap className="w-4 h-4 text-[#8978ff]" />
                  <span>Run Invoicing Batch</span>
                </button>

                <button
                  onClick={() => {
                    setShowSettingsMenu(false)
                    handleCustomerModal()
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 text-left font-medium cursor-pointer transition-colors"
                >
                  <User className="w-4 h-4 text-[#8978ff]" />
                  <span>Operations Profile</span>
                </button>

                <Link
                  href="/portal"
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 text-left font-medium transition-colors"
                  onClick={() => setShowSettingsMenu(false)}
                >
                  <Box className="w-4 h-4 text-[#8978ff]" />
                  <span>Customer Billing Portal</span>
                </Link>

                <Link
                  href="/"
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 text-left font-medium transition-colors"
                  onClick={() => setShowSettingsMenu(false)}
                >
                  <ExternalLink className="w-4 h-4 text-white/50" />
                  <span>Landing Magazine</span>
                </Link>

                <div className="my-1 border-t border-white/10" />

                <button
                  onClick={async () => {
                    setShowSettingsMenu(false)
                    await useAuthStore.getState().logout()
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 text-left font-medium cursor-pointer transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

          {/* User profile avatar matching Image 1 (Toggles account menu with Sign Out) */}
          <button
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            title="Administrator Account (Click for Profile & Sign Out)"
            className="w-10 h-10 rounded-2xl bg-[#8978ff] hover:bg-[#9b8cff] border border-white/10 text-white font-bold text-sm flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-[0_2px_12px_rgba(137,120,255,0.3)]"
          >
            <span>AD</span>
          </button>
        </div>
      </div>
    </header>
  )
}
