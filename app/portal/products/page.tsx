'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { PortalTopNavbar, PortalTab } from '@/components/portal/portal-top-navbar'
import { CatalogView } from '@/components/portal/catalog-view'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function CustomerProductsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const handleTabChange = (tab: PortalTab) => {
    if (tab === 'billing') router.push('/portal')
    else if (tab === 'subscriptions') router.push('/portal?tab=subscriptions')
    else if (tab === 'invoices') router.push('/portal?tab=invoices')
    else if (tab === 'profile') router.push('/portal?tab=profile')
  }

  return (
    <div className="min-h-screen bg-[#05051a] text-white flex flex-col font-sans antialiased selection:bg-[#8978ff]/30 selection:text-white relative">
      <div className="fixed inset-0 pointer-events-none opacity-40 [background-image:radial-gradient(circle_at_25%_10%,rgba(113,86,255,.35),transparent_40%),radial-gradient(circle_at_80%_65%,rgba(82,67,244,.2),transparent_45%)]" />
      <div className="fixed inset-0 opacity-[0.035] pointer-events-none noise-overlay" />

      <PortalTopNavbar
        activeTab="catalog"
        onTabChange={handleTabChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Link
          href="/portal"
          className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Billing Overview</span>
        </Link>

        <CatalogView onSubscriptionCreated={() => router.push('/portal')} />
      </main>
    </div>
  )
}
