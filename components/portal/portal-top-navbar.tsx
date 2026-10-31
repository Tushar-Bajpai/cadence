'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  CreditCard,
  ScrollText,
  FileText,
  Sparkles,
  User,
  Shield,
  Settings,
  Search,
  ExternalLink,
  LogOut,
} from 'lucide-react'
import { usePortalStore, PortalTab } from '@/stores/use-portal-store'
import { useAuthStore } from '@/stores/use-auth-store'

export type { PortalTab }

interface PortalTopNavbarProps {
  activeTab: PortalTab
  onTabChange?: (tab: PortalTab) => void
  customerName?: string
  searchQuery?: string
  onSearchChange?: (q: string) => void
}

export function PortalTopNavbar({
  activeTab: propActiveTab,
  onTabChange: propOnTabChange,
  customerName = 'Subscriber',
  searchQuery = '',
  onSearchChange,
}: PortalTopNavbarProps) {
  const store = usePortalStore()
  const activeTab = propActiveTab ?? store.activeTab
  const onTabChange = propOnTabChange ?? store.setActiveTab
  const searchQuery = propSearchQuery ?? store.searchQuery
  const onSearchChange = propOnSearchChange ?? store.setSearchQuery

  const [showSettingsMenu, setShowSettingsMenu] = useState(false)

  // 5 tab icons matching the reference mockup (Image 2)
  const navTabs = [
    {
      id: 'billing' as PortalTab,
      label: 'Home & Billing',
      icon: IconSmartHome,
      href: '/portal',
    },
    {
      id: 'subscriptions' as PortalTab,
      label: 'My Subscriptions',
      icon: IconRepeat,
      href: '/portal/subscriptions',
    },
    {
      id: 'invoices' as PortalTab,
      label: 'Invoices & Receipts',
      icon: IconReceipt2,
      href: '/portal/invoices',
    },
    {
      id: 'catalog' as PortalTab,
      label: 'Products & Plans',
      icon: IconBox,
      href: '/portal/products',
    },
    {
      id: 'profile' as PortalTab,
      label: 'Profile & Activity',
      icon: IconUser,
      href: '/portal/profile',
    },
  ]

  return (
    <header className="sticky top-0 z-40 w-full bg-[#08061d]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-3 select-none">
      <div className="w-full flex items-center justify-between gap-4">
        {/* Left Section: 4-Dots Emblem + Brand Name + 5 Icon Navigation Tabs */}
        <div className="flex items-center gap-5 sm:gap-7 shrink-0">
          <Link
            href="/portal"
            className="flex items-center gap-2.5 text-white hover:opacity-90 transition group cursor-pointer"
          >
            {/* 4-dots geometric icon */}
            <div className="grid grid-cols-2 gap-1 w-6 h-6 p-0.5">
              <span className="w-2 h-2 rounded-full bg-white group-hover:bg-[#8978ff] transition-colors" />
              <span className="w-2 h-2 rounded-full bg-white group-hover:bg-[#8978ff] transition-colors" />
              <span className="w-2 h-2 rounded-full bg-white group-hover:bg-[#8978ff] transition-colors" />
              <span className="w-2 h-2 rounded-full bg-white group-hover:bg-[#8978ff] transition-colors" />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Cadence
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-md bg-[#8978ff]/20 text-[#8978ff] font-semibold border border-[#8978ff]/30">
                  Portal
                </span>
              </span>
            </div>
          </Link>

          {/* 5 Squircle Icon Navigation Buttons matching Image 2 */}
          <nav className="flex items-center gap-1.5 sm:gap-2">
            {navTabs.map((item) => {
              const Icon = item.icon
              const active = activeTab === item.id
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={(e) => {
                    if (onTabChange) {
                      onTabChange(item.id)
                    }
                  }}
                  title={item.label}
                  className={`relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
                    active
                      ? 'bg-[#8978ff] text-white shadow-[0_0_20px_rgba(137,120,255,0.45)] ring-1 ring-[#8978ff]/40'
                      : 'bg-white/[0.04] text-white/50 hover:text-white hover:bg-white/[0.08] border border-white/5'
                  }`}
                >
                  <Icon size={20} stroke={1.8} />
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right Section: Search Bar + Admin Studio + Settings Gear (Exact order matching user screenshot) */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Search Bar placed before Admin Studio matching user screenshot */}
          <div className="relative hidden md:block w-48 lg:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" strokeWidth={1.8} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search invoices, plans..."
              className="w-full h-10 bg-white/[0.04] border border-white/10 rounded-2xl pl-9 pr-4 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#8978ff] focus:ring-1 focus:ring-[#8978ff] transition"
            />
          </div>

          {/* Quick Switch to Admin Studio */}
          <Link
            href="/admin"
            className="hidden sm:inline-flex items-center gap-1.5 h-10 px-4 rounded-2xl bg-white/[0.04] border border-white/10 text-white/75 hover:text-white hover:bg-white/[0.08] hover:border-white/20 text-xs font-medium transition cursor-pointer"
            title="Switch to Admin Studio"
          >
            <Shield className="w-4 h-4 text-[#8978ff]" strokeWidth={1.8} />
            <span>Admin Studio</span>
          </Link>

          {/* Settings Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/10 text-white/60 hover:text-white hover:bg-white/[0.08] flex items-center justify-center transition cursor-pointer"
              title="Customer Settings"
            >
              <Settings className="w-4 h-4" strokeWidth={1.8} />
            </button>

            {showSettingsMenu && (
              <div
                className="absolute right-0 mt-2 w-56 bg-[#0e0c24] border border-white/15 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] py-2 z-50 text-xs animate-in fade-in duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-3.5 py-2 border-b border-white/10">
                  <p className="font-semibold text-white truncate">{customerName}</p>
                  <p className="text-[10px] text-white/50 font-mono">Customer Workspace</p>
                </div>

                <Link
                  href="/portal/profile"
                  onClick={() => setShowSettingsMenu(false)}
                  className="w-full text-left px-3.5 py-2 text-white/80 hover:text-white hover:bg-white/5 transition flex items-center gap-2 cursor-pointer"
                >
                  <User className="w-4 h-4 text-[#8978ff]" strokeWidth={1.8} />
                  <span>My Profile & Activity</span>
                </Link>

                <Link
                  href="/"
                  className="w-full text-left px-3.5 py-2 text-white/80 hover:text-white hover:bg-white/5 transition flex items-center gap-2 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 text-white/40" strokeWidth={1.8} />
                  <span>Landing Magazine</span>
                </Link>

                <div className="my-1 border-t border-white/10" />

                <button
                  onClick={async () => {
                    setShowSettingsMenu(false)
                    await useAuthStore.getState().logout()
                  }}
                  className="w-full text-left px-3.5 py-2 text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 rounded-xl transition flex items-center gap-2 cursor-pointer font-medium"
                >
                  <LogOut className="w-4 h-4 text-rose-400" strokeWidth={1.8} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
