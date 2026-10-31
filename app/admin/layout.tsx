'use client'

import React, { useState, useEffect } from 'react'
import { TopNavbar } from '@/components/admin/top-navbar'
import { RunBillingModal } from '@/components/admin/run-billing-modal'
import { CustomerModal, CustomerModalData } from '@/components/admin/customer-modal'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false)
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
  const [customerData, setCustomerData] = useState<CustomerModalData | null>(null)

  // Fetch Robert Fox's profile for the customer modal
  const fetchCustomerProfile = async () => {
    try {
      const res = await fetch('/api/customers')
      const customers = await res.json()
      const robert = customers.find((c: any) => c.name.includes('Robert')) || customers[0]
      if (robert) {
        const detailRes = await fetch(`/api/customers?id=${robert.id}`)
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
    setIsCustomerModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-[#05051a] text-white flex flex-col font-sans antialiased selection:bg-[#8978ff]/30 selection:text-white relative">
      {/* Landing page ambient illumination */}
      <div className="fixed inset-0 pointer-events-none opacity-40 [background-image:radial-gradient(circle_at_30%_15%,rgba(113,86,255,.35),transparent_40%),radial-gradient(circle_at_80%_65%,rgba(82,67,244,.2),transparent_45%)]" />
      <div className="fixed inset-0 opacity-[0.035] pointer-events-none noise-overlay" />

      {/* Top Navbar matching the uploaded reference image & landing page theme */}
      <TopNavbar
        onRunBillingClick={() => setIsBillingModalOpen(true)}
        onCustomerModalClick={handleOpenCustomerModal}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 w-full pb-16">{children}</main>

      {/* Global Modals */}
      <RunBillingModal
        isOpen={isBillingModalOpen}
        onClose={() => setIsBillingModalOpen(false)}
        onSuccess={() => {
          // Triggers refresh in sub-views
        }}
      />

      <CustomerModal
        isOpen={isCustomerModalOpen}
        customer={customerData}
        onClose={() => setIsCustomerModalOpen(false)}
      />
    </div>
  )
}
