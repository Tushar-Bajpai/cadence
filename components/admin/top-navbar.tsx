'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  IconSmartHome,
  IconUsers,
  IconShoppingBag,
  IconReceipt2,
  IconBox,
  IconTag,
  IconFileText,
  IconSearch,
  IconSettings,
  IconBolt,
  IconExternalLink,
  IconUser,
  IconShieldLock,
  IconCreditCard,
  IconChartBar,
} from '@tabler/icons-react'

interface TopNavbarProps {
  onRunBillingClick: () => void
  onCustomerModalClick?: () => void
}

export function TopNavbar({ onRunBillingClick, onCustomerModalClick }: TopNavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)

  // Navigation icon tabs matching reference screenshot:
  const navItems = [
    {
      name: 'Finance Dashboard',
      href: '/admin/dashboard',
      icon: IconSmartHome,
    },
    {
      name: 'Customers',
      href: '/admin/customers',
      icon: IconUsers,
    },
    {
      name: 'Invoices',
      href: '/admin/invoices',
      icon: IconShoppingBag,
    },
    {
      name: 'Payments',
      href: '/admin/payments',
      icon: IconCreditCard,
    },
    {
      name: 'Subscriptions',
      href: '/admin/subscriptions',
      icon: IconReceipt2,
    },
    {
      name: 'Products & Plans',
      href: '/admin/products',
      icon: IconBox,
    },
    {
      name: 'Taxes & Discounts',
      href: '/admin/discounts',
      icon: IconTag,
    },
    {
      name: 'Quotation Templates',
      href: '/admin/templates',
      icon: IconFileText,
    },
  ]

  const isActive = (href: string) => {
    if (href === '/admin/dashboard' || href === '/admin') {
      return pathname === '/admin' || pathname === '/admin/dashboard'
    }
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
        {/* Left Section: 4-Dots Logo + Cadence Title + Navigation Tabs */}
        <div className="flex items-center gap-6 sm:gap-7 shrink-0">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5 group">
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

          {/* Sequence of square rounded icon tabs from reference image */}
          <nav className="flex items-center gap-2">
            {navItems.map((item) => {
              const active = isActive(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.name}
                  className={`group relative w-10 h-10 rounded-[11px] flex items-center justify-center transition-all ${
                    active
                      ? 'bg-[#8978ff] text-white shadow-[0_0_20px_rgba(137,120,255,0.4)] ring-1 ring-[#8978ff]'
                      : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] border border-white/10'
                  }`}
                >
                  <Icon size={19} stroke={1.8} className="transition-transform group-hover:scale-105" />

                  {/* Tooltip on hover */}
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-[#120e28] text-white text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl border border-white/15 z-50">
                    {item.name}
                  </span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right Section: Search Bar + Run Billing + Settings + Avatar */}
        <div className="flex items-center gap-2 flex-1 max-w-lg justify-end">
          {/* Search bar matching screenshot */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex-1 max-w-xs hidden sm:block"
          >
            <IconSearch size={15} stroke={1.8} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search here ..."
              className="w-full h-9 pl-8 pr-3 text-xs rounded-xl bg-white/[0.04] text-white placeholder-white/35 border border-white/10 focus:outline-none focus:border-[#8978ff] focus:ring-1 focus:ring-[#8978ff] transition-all"
            />
          </form>

          {/* Quick link to Customer Portal */}
          <Link
            href="/portal"
            className="hidden xl:inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/80 hover:text-white text-xs font-medium transition cursor-pointer"
            title="Open Customer Billing Portal"
          >
            <IconBox size={15} stroke={1.8} className="text-[#8978ff]" />
            <span>Portal</span>
          </Link>

          {/* Quick Billing Engine Run Action */}
          <button
            onClick={onRunBillingClick}
            title="Execute Idempotent Billing Cycle"
            className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-[#8978ff] hover:bg-[#9b8cff] text-white text-xs font-semibold shadow-[0_2px_14px_rgba(137,120,255,0.35)] transition-all whitespace-nowrap cursor-pointer active:scale-95"
          >
            <IconBolt size={15} stroke={2} className="fill-white text-white" />
            <span>Run Billing</span>
          </button>

          {/* Settings Gear icon matching screenshot */}
          <div className="relative">
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              title="Settings & Tools"
              className="w-9 h-9 rounded-xl bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] border border-white/10 flex items-center justify-center transition-all cursor-pointer active:scale-95"
            >
              <IconSettings size={18} stroke={1.8} />
            </button>

            {showSettingsMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-[#120e28] rounded-2xl border border-white/15 shadow-2xl p-1.5 z-50 text-xs space-y-1 backdrop-blur-xl animate-in fade-in duration-150">
                <Link
                  href="/admin/dashboard"
                  onClick={() => setShowSettingsMenu(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 text-left font-medium cursor-pointer"
                >
                  <IconChartBar size={16} stroke={1.8} className="text-[#8978ff]" />
                  <span>Finance Dashboard</span>
                </Link>
                <button
                  onClick={() => {
                    setShowSettingsMenu(false)
                    onRunBillingClick()
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 text-left font-medium cursor-pointer"
                >
                  <IconBolt size={16} stroke={1.8} className="text-[#8978ff]" />
                  <span>Run Invoicing Batch</span>
                </button>
                <button
                  onClick={() => {
                    setShowSettingsMenu(false)
                    if (onCustomerModalClick) onCustomerModalClick()
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 text-left font-medium cursor-pointer"
                >
                  <IconUser size={16} stroke={1.8} className="text-[#8978ff]" />
                  <span>Operations Profile</span>
                </button>
                <Link
                  href="/portal"
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 text-left font-medium"
                  onClick={() => setShowSettingsMenu(false)}
                >
                  <IconBox size={16} stroke={1.8} className="text-[#8978ff]" />
                  <span>Customer Billing Portal</span>
                </Link>
                <Link
                  href="/"
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 text-left font-medium"
                  onClick={() => setShowSettingsMenu(false)}
                >
                  <IconExternalLink size={16} stroke={1.8} className="text-white/50" />
                  <span>Landing Magazine</span>
                </Link>
              </div>
            )}
          </div>

          {/* User profile avatar */}
          <button
            onClick={onCustomerModalClick}
            title="Administrator Account"
            className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#1b1544] via-[#281e64] to-[#3a2c8a] border border-white/20 hover:border-[#8978ff] text-white/90 text-xs font-mono font-bold flex items-center justify-center shadow-inner hover:scale-105 transition-all cursor-pointer relative"
          >
            <span>AD</span>
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#08061d]" />
          </button>
        </div>
      </div>
    </header>
  )
}
