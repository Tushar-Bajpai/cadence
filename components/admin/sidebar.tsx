'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Layers,
  FileText,
  Users,
  CreditCard,
  Zap,
  Tag,
  Package,
  ExternalLink,
  ChevronRight,
  LogOut,
  Bell,
  Sparkles,
} from 'lucide-react'

interface SidebarProps {
  onRunBillingClick: () => void
  onCustomerModalClick?: () => void
}

export function AdminSidebar({ onRunBillingClick, onCustomerModalClick }: SidebarProps) {
  const pathname = usePathname()

  const mainLinks = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Subscriptions', href: '/admin/subscriptions', icon: Layers },
    { name: 'Invoices', href: '/admin/invoices', icon: FileText },
    { name: 'Customers', href: '/admin/customers', icon: Users },
  ]

  const categoryLinks = [
    { name: 'Products & Plans', href: '/admin/products', icon: Package },
    { name: 'Taxes & Discounts', href: '/admin/discounts', icon: Tag },
  ]

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-zinc-200/80 flex flex-col justify-between h-screen sticky top-0 text-zinc-700 select-none z-30">
      {/* Brand Header matching Screenshot 1 */}
      <div>
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#8978ff] to-[#6042f5] flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-[#8978ff]/30">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-zinc-900 tracking-tight text-base group-hover:text-[#8978ff] transition-colors">
                  Cadence
                </span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-violet-50 text-[#8978ff] border border-violet-100">
                  Engine
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono tracking-wider">by CodeLifters</p>
            </div>
          </Link>
        </div>

        {/* Navigation Sections */}
        <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-170px)]">
          {/* Main Features */}
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-semibold text-zinc-400 tracking-wider mb-2">
              Main Features
            </p>
            {mainLinks.map((item) => {
              const active = isActive(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    active
                      ? 'bg-zinc-900 text-white shadow-xs font-semibold'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-zinc-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-[#8978ff]" />}
                </Link>
              )
            })}
          </div>

          {/* Categories */}
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-semibold text-zinc-400 tracking-wider mb-2">
              Categories
            </p>
            {categoryLinks.map((item) => {
              const active = isActive(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    active
                      ? 'bg-zinc-900 text-white shadow-xs font-semibold'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-zinc-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-[#8978ff]" />}
                </Link>
              )
            })}
          </div>

          {/* Utility */}
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-semibold text-zinc-400 tracking-wider mb-2">
              Utility
            </p>
            <button
              onClick={onRunBillingClick}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#8978ff] hover:bg-violet-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 fill-[#8978ff]" />
                <span className="font-semibold">Run Invoicing ⚡</span>
              </div>
              <span className="text-[10px] bg-violet-100 text-[#8978ff] px-1.5 py-0.5 rounded font-mono">
                Batch
              </span>
            </button>

            <Link
              href="/"
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ExternalLink className="w-4 h-4 text-zinc-400" />
                <span>Magazine View</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Profile matching Screenshot 2 */}
      <div className="p-4 border-t border-zinc-100 bg-zinc-50/50">
        <button
          onClick={onCustomerModalClick}
          className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white hover:shadow-xs border border-transparent hover:border-zinc-200/80 transition-all text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#8978ff] to-[#6042ec] flex items-center justify-center text-white font-bold text-xs ring-2 ring-white/10">
              AD
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-zinc-900 truncate">Admin Console</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />
                <span className="text-[10px] text-violet-700 font-semibold">Operations</span>
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-400" />
        </button>
      </div>
    </aside>
  )
}

