'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  CreditCard,
  ScrollText,
  FileText,
  Sparkles,
  User,
  Search,
  Settings,
  Shield,
  LogOut,
  ExternalLink,
} from 'lucide-react'

export type PortalTab = 'billing' | 'subscriptions' | 'invoices' | 'catalog' | 'profile'

interface PortalTopNavbarProps {
  activeTab: PortalTab
  onTabChange: (tab: PortalTab) => void
  customerName?: string
  searchQuery: string
  onSearchChange: (q: string) => void
}

export function PortalTopNavbar({
  activeTab,
  onTabChange,
  customerName = 'Subscriber',
  searchQuery,
  onSearchChange,
}: PortalTopNavbarProps) {
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)

  const navTabs = [
    {
      id: 'billing' as PortalTab,
      label: 'Billing & Overview',
      icon: CreditCard,
    },
    {
      id: 'subscriptions' as PortalTab,
      label: 'Subscriptions',
      icon: ScrollText,
    },
    {
      id: 'invoices' as PortalTab,
      label: 'Invoices',
      icon: FileText,
    },
    {
      id: 'catalog' as PortalTab,
      label: 'Browse Plans & Add-ons',
      icon: Sparkles,
    },
    {
      id: 'profile' as PortalTab,
      label: 'Profile & Activity',
      icon: User,
    },
  ]

  return (
    <header className="sticky top-0 z-40 w-full bg-[#08061d]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-3 select-none">
      <div className="w-full flex items-center justify-between gap-4">
        {/* Left Section: 4-Dots Emblem + Brand Name + 5 Icon Navigation Tabs */}
        <div className="flex items-center gap-5 sm:gap-7 shrink-0">
          {/* Logo matching uploaded reference screenshot */}
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

          {/* Icon Tabs Bar */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {navTabs.map((item) => {
              const Icon = item.icon
              const active = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  title={item.label}
                  className={`relative p-2.5 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
                    active
                      ? 'bg-[#8978ff] text-white shadow-[0_0_16px_rgba(137,120,255,0.45)]'
                      : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                  {active && (
                    <span className="hidden xl:inline-block ml-2 text-xs font-semibold whitespace-nowrap">
                      {item.label}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Center / Right: Search Input + Settings & Quick Switcher */}
        <div className="flex items-center gap-3">
          {/* Pill Search Input */}
          <div className="relative hidden md:block w-48 lg:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search invoices, plans..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#8978ff] focus:ring-1 focus:ring-[#8978ff] transition"
            />
          </div>

          {/* Quick Switch to Admin Studio */}
          <Link
            href="/admin"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 text-xs font-medium transition cursor-pointer"
            title="Switch to Admin Studio"
          >
            <Shield className="w-3.5 h-3.5 text-[#8978ff]" />
            <span>Admin Studio</span>
          </Link>

          {/* Settings Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Customer Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {showSettingsMenu && (
              <div
                className="absolute right-0 mt-2 w-56 bg-[#0e0c24] border border-white/15 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] py-2 z-50 text-xs animate-in fade-in duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-3.5 py-2 border-b border-white/10">
                  <p className="font-semibold text-white truncate">{customerName}</p>
                  <p className="text-[10px] text-white/50">Customer Workspace</p>
                </div>

                <button
                  onClick={() => {
                    onTabChange('profile')
                    setShowSettingsMenu(false)
                  }}
                  className="w-full text-left px-3.5 py-2 text-white/80 hover:text-white hover:bg-white/5 transition flex items-center gap-2 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-[#8978ff]" />
                  <span>My Profile & Activity</span>
                </button>

                <Link
                  href="/"
                  className="w-full text-left px-3.5 py-2 text-white/80 hover:text-white hover:bg-white/5 transition flex items-center gap-2 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-white/40" />
                  <span>Landing Magazine</span>
                </Link>

                <div className="my-1 border-t border-white/10" />

                <Link
                  href="/auth"
                  className="w-full text-left px-3.5 py-2 text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 transition flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
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

