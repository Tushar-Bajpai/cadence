'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  IconSmartHome,
  IconRepeat,
  IconReceipt2,
  IconBox,
  IconUser,
  IconSearch,
  IconSettings,
  IconShieldLock,
  IconLogout,
  IconExternalLink,
} from '@tabler/icons-react'
import { usePortalStore, PortalTab } from '@/stores/use-portal-store'

export type { PortalTab }

interface PortalTopNavbarProps {
  activeTab?: PortalTab
  onTabChange?: (tab: PortalTab) => void
  customerName?: string
  searchQuery?: string
  onSearchChange?: (q: string) => void
}

export function PortalTopNavbar({
  activeTab: propActiveTab,
  onTabChange: propOnTabChange,
  customerName = 'Subscriber',
  searchQuery: propSearchQuery,
  onSearchChange: propOnSearchChange,
}: PortalTopNavbarProps) {
  const store = usePortalStore()
  const activeTab = propActiveTab ?? store.activeTab
  const onTabChange = propOnTabChange ?? store.setActiveTab
  const searchQuery = propSearchQuery ?? store.searchQuery
  const onSearchChange = propOnSearchChange ?? store.setSearchQuery

  const [showSettingsMenu, setShowSettingsMenu] = useState(false)

  // 5 tab icons using Tabler icons matching the InvoPilot reference mockup
  const navTabs = [
    {
      id: 'billing' as PortalTab,
      label: 'Home & Billing',
      icon: IconSmartHome,
    },
    {
      id: 'subscriptions' as PortalTab,
      label: 'My Subscriptions',
      icon: IconRepeat,
    },
    {
      id: 'invoices' as PortalTab,
      label: 'Invoices & Receipts',
      icon: IconReceipt2,
    },
    {
      id: 'catalog' as PortalTab,
      label: 'Products & Plans',
      icon: IconBox,
    },
    {
      id: 'profile' as PortalTab,
      label: 'Profile & Activity',
      icon: IconUser,
    },
  ]

  return (
    <header className="sticky top-0 z-40 w-full bg-[#08061d]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-3 select-none">
      <div className="w-full flex items-center justify-between gap-4">
        {/* Left Section: 4-Dots Emblem + Brand Name + 5 Tabler Icon Navigation Tabs */}
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

          {/* 5 Tabler Icon Navigation Buttons */}
          <nav className="flex items-center gap-1.5 sm:gap-2">
            {navTabs.map((item) => {
              const Icon = item.icon
              const active = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  title={item.label}
                  className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
                    active
                      ? 'bg-[#8978ff] text-white shadow-[0_0_16px_rgba(137,120,255,0.45)]'
                      : 'bg-white/[0.04] text-white/50 hover:text-white hover:bg-white/[0.08] border border-white/5'
                  }`}
                >
                  <Icon size={20} stroke={1.8} />
                </button>
              )
            })}
          </nav>
        </div>

        {/* Center / Right: Search Bar + Admin Studio + Settings Gear */}
        <div className="flex items-center gap-2.5">
          {/* Pill Search Input */}
          <div className="relative hidden md:block w-48 lg:w-72">
            <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" stroke={1.8} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search invoices, plans..."
              className="w-full h-9 bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-4 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#8978ff] focus:ring-1 focus:ring-[#8978ff] transition"
            />
          </div>

          {/* Quick Switch to Admin Studio */}
          <Link
            href="/admin"
            className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white/[0.04] border border-white/10 text-white/70 hover:text-white hover:bg-white/[0.08] hover:border-white/20 text-xs font-medium transition cursor-pointer"
            title="Switch to Admin Studio"
          >
            <IconShieldLock size={16} stroke={1.8} className="text-[#8978ff]" />
            <span>Admin Studio</span>
          </Link>

          {/* Settings Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 text-white/60 hover:text-white hover:bg-white/[0.08] flex items-center justify-center transition cursor-pointer"
              title="Customer Settings"
            >
              <IconSettings size={18} stroke={1.8} />
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

                <button
                  onClick={() => {
                    onTabChange('profile')
                    setShowSettingsMenu(false)
                  }}
                  className="w-full text-left px-3.5 py-2 text-white/80 hover:text-white hover:bg-white/5 transition flex items-center gap-2 cursor-pointer"
                >
                  <IconUser size={16} stroke={1.8} className="text-[#8978ff]" />
                  <span>My Profile & Activity</span>
                </button>

                <Link
                  href="/"
                  className="w-full text-left px-3.5 py-2 text-white/80 hover:text-white hover:bg-white/5 transition flex items-center gap-2 cursor-pointer"
                >
                  <IconExternalLink size={16} stroke={1.8} className="text-white/40" />
                  <span>Landing Magazine</span>
                </Link>

                <div className="my-1 border-t border-white/10" />

                <Link
                  href="/auth"
                  className="w-full text-left px-3.5 py-2 text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 transition flex items-center gap-2 cursor-pointer"
                >
                  <IconLogout size={16} stroke={1.8} />
                  <span>Sign Out</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
