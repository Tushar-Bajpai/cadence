'use client'

import React, { useState, useEffect } from 'react'
import { TopNavbar } from '@/components/admin/top-navbar'
import { RunBillingModal } from '@/components/admin/run-billing-modal'
import { CustomerModal, CustomerModalData } from '@/components/admin/customer-modal'
import { useAdminStore } from '@/stores/use-admin-store'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const {
    isRunBillingOpen,
    closeRunBilling,
    isCustomerModalOpen,
    closeCustomerModal,
    openCustomerModal,
    toasts,
    dismissToast,
    triggerRefresh,
  } = useAdminStore()

  const [customerData, setCustomerData] = useState<CustomerModalData | null>(null)

  // Fetch primary customer profile for the operations modal
  const fetchCustomerProfile = async () => {
    try {
      const res = await fetch('/api/customers')
      const customers = await res.json()
      const firstCustomer = Array.isArray(customers) && customers.length > 0 ? customers[0] : null
      if (firstCustomer) {
        const detailRes = await fetch(`/api/customers?id=${firstCustomer.id}`)
        const detail = await detailRes.json()
        setCustomerData(detail)
      }
    } catch (err) {
      console.error('Error fetching customer modal data:', err)
    }
  }

  useEffect(() => {
    fetchCustomerProfile()
  }, [])

  const handleOpenCustomerModal = async () => {
    if (!customerData) {
      await fetchCustomerProfile()
    }
    openCustomerModal()
  }

  return (
    <div className="min-h-screen bg-[#05051a] text-white flex flex-col font-sans antialiased selection:bg-[#8978ff]/30 selection:text-white relative">
      {/* Landing page ambient illumination */}
      <div className="fixed inset-0 pointer-events-none opacity-40 [background-image:radial-gradient(circle_at_30%_15%,rgba(113,86,255,.35),transparent_40%),radial-gradient(circle_at_80%_65%,rgba(82,67,244,.2),transparent_45%)]" />
      <div className="fixed inset-0 opacity-[0.035] pointer-events-none noise-overlay" />

      {/* Top Navbar matching the uploaded reference image & landing page theme */}
      <TopNavbar
        onCustomerModalClick={handleOpenCustomerModal}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 w-full pb-16">{children}</main>

      {/* Global Modals synced with Zustand store */}
      <RunBillingModal
        isOpen={isRunBillingOpen}
        onClose={closeRunBilling}
        onSuccess={() => {
          triggerRefresh()
        }}
      />

      <CustomerModal
        isOpen={isCustomerModalOpen}
        customer={customerData}
        onClose={closeCustomerModal}
      />

      {/* Global Zustand Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              onClick={() => dismissToast(t.id)}
              className={`pointer-events-auto px-4 py-3 rounded-2xl border text-xs shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200 cursor-pointer ${
                t.type === 'error'
                  ? 'bg-rose-950/80 border-rose-500/40 text-rose-200'
                  : 'bg-[#120e28]/90 border-white/20 text-white'
              }`}
            >
              <span>{t.message}</span>
              <span className="text-[10px] opacity-40 hover:opacity-100">✕</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
