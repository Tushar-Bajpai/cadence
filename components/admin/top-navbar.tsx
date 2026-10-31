'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  Users,
  ShoppingBag,
  ScrollText,
  Box,
  Search,
  Settings,
  Zap,
  ExternalLink,
  Tag,
  User,
} from 'lucide-react'

interface TopNavbarProps {
  onRunBillingClick: () => void
  onCustomerModalClick?: () => void
}

export function TopNavbar({ onRunBillingClick, onCustomerModalClick }: TopNavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)

  // 5 navigation icon tabs matching reference screenshot:
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
        {/* Left Section: 4-Dots Logo + Cadence Title + 5 Icon Tabs */}
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
                  <Icon className="w-[18px] h-[18px] transition-transform group-hover:scale-105" strokeWidth={1.9} />

                  {/* Tooltip on hover */}
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-[#120e28] text-white text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl border border-white/15 z-50">
                    {item.name}
                  </span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right Section: Long Search Bar + Settings Gear Icon Button */}
        <div className="flex items-center gap-2.5 flex-1 max-w-md justify-end">
          {/* Search bar matching screenshot */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex-1 max-w-sm hidden sm:block"
          >
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" strokeWidth={1.8} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search here ..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-[11px] bg-white/[0.04] text-white placeholder-white/40 border border-white/10 focus:outline-none focus:border-[#8978ff] focus:ring-1 focus:ring-[#8978ff] transition-all"
            />
          </form>

          {/* Quick link to Customer Portal */}
          <Link
            href="/portal"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-[11px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/80 hover:text-white text-xs font-medium transition cursor-pointer"
            title="Open Customer Billing Portal"
          >
            <Box className="w-3.5 h-3.5 text-[#8978ff]" />
            <span>Customer Portal</span>
          </Link>

          {/* Quick Billing Engine Run Action */}
          <button
            onClick={onRunBillingClick}
            title="Execute Idempotent Billing Cycle"
            className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-[11px] bg-[#8978ff] hover:bg-[#9b8cff] text-white text-xs font-semibold shadow-[0_4px_20px_rgba(137,120,255,0.35)] transition-all whitespace-nowrap cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>Run Billing ⚡</span>
          </button>

          {/* Settings Gear icon matching screenshot */}
          <div className="relative">
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              title="Settings & Tools"
              className="w-10 h-10 rounded-[11px] bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/[0.08] border border-white/10 flex items-center justify-center transition-all cursor-pointer"
            >
              <Settings className="w-[18px] h-[18px]" strokeWidth={1.8} />
            </button>

            {showSettingsMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-[#120e28] rounded-xl border border-white/15 shadow-2xl p-1.5 z-50 text-xs space-y-1 backdrop-blur-xl">
                <button
                  onClick={() => {
                    setShowSettingsMenu(false)
                    onRunBillingClick()
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 text-left font-medium cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-[#8978ff]" />
                  <span>Run Invoicing Batch</span>
                </button>
                <button
                  onClick={() => {
                    setShowSettingsMenu(false)
                    if (onCustomerModalClick) onCustomerModalClick()
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 text-left font-medium cursor-pointer"
                >
                  <User className="w-4 h-4 text-[#8978ff]" />
                  <span>Operations Profile</span>
                </button>
                <Link
                  href="/"
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 text-left font-medium"
                  onClick={() => setShowSettingsMenu(false)}
                >
                  <ExternalLink className="w-4 h-4 text-white/50" />
                  <span>Switch to Magazine View</span>
                </Link>
                <Link
                  href="/auth"
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 text-left font-medium"
                  onClick={() => setShowSettingsMenu(false)}
                >
                  <Users className="w-4 h-4 text-white/50" />
                  <span>Authentication Portal</span>
                </Link>
              </div>
            )}
          </div>

          {/* User profile avatar pill */}
          <button
            onClick={onCustomerModalClick}
            title="Administrator Account"
            className="w-10 h-10 rounded-[11px] bg-gradient-to-tr from-[#8978ff] to-[#6042ec] text-white font-bold text-xs flex items-center justify-center ring-1 ring-white/20 hover:scale-105 transition-transform cursor-pointer"
          >
            AD
          </button>
        </div>
      </div>
    </header>
  )
}
