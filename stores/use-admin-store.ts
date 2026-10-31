import { create } from 'zustand'

export interface AdminToast {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

interface AdminState {
  // Search & Filters
  searchQuery: string
  setSearchQuery: (query: string) => void

  // Run Billing Modal
  isRunBillingOpen: boolean
  openRunBilling: () => void
  closeRunBilling: () => void

  // Customer Detail Modal
  isCustomerModalOpen: boolean
  selectedCustomerId: string | null
  openCustomerModal: (customerId?: string | null) => void
  closeCustomerModal: () => void

  // Invoice Detail Modal
  isInvoiceModalOpen: boolean
  selectedInvoiceId: string | null
  openInvoiceModal: (invoiceId: string) => void
  closeInvoiceModal: () => void

  // Product & Plan Modals
  isProductModalOpen: boolean
  openProductModal: () => void
  closeProductModal: () => void

  isPlanModalOpen: boolean
  openPlanModal: () => void
  closePlanModal: () => void

  // Discount Modal
  isDiscountModalOpen: boolean
  openDiscountModal: () => void
  closeDiscountModal: () => void

  // Toasts
  toasts: AdminToast[]
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  dismissToast: (id: string) => void

  // Global Refresh Trigger
  refreshKey: number
  triggerRefresh: () => void
}

export const useAdminStore = create<AdminState>((set) => ({
  // Search
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Run Billing
  isRunBillingOpen: false,
  openRunBilling: () => set({ isRunBillingOpen: true }),
  closeRunBilling: () => set({ isRunBillingOpen: false }),

  // Customer Modal
  isCustomerModalOpen: false,
  selectedCustomerId: null,
  openCustomerModal: (customerId = null) =>
    set({
      isCustomerModalOpen: true,
      selectedCustomerId: customerId,
    }),
  closeCustomerModal: () =>
    set({
      isCustomerModalOpen: false,
      selectedCustomerId: null,
    }),

  // Invoice Modal
  isInvoiceModalOpen: false,
  selectedInvoiceId: null,
  openInvoiceModal: (invoiceId) =>
    set({
      isInvoiceModalOpen: true,
      selectedInvoiceId: invoiceId,
    }),
  closeInvoiceModal: () =>
    set({
      isInvoiceModalOpen: false,
      selectedInvoiceId: null,
    }),

  // Product & Plan
  isProductModalOpen: false,
  openProductModal: () => set({ isProductModalOpen: true }),
  closeProductModal: () => set({ isProductModalOpen: false }),

  isPlanModalOpen: false,
  openPlanModal: () => set({ isPlanModalOpen: true }),
  closePlanModal: () => set({ isPlanModalOpen: false }),

  // Discount
  isDiscountModalOpen: false,
  openDiscountModal: () => set({ isDiscountModalOpen: true }),
  closeDiscountModal: () => set({ isDiscountModalOpen: false }),

  // Toasts
  toasts: [],
  showToast: (message, type = 'success') => {
    const id = Math.random().toString(36).slice(2, 9)
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }))
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }))
    }, 4500)
  },
  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  // Refresh
  refreshKey: 0,
  triggerRefresh: () => set((state) => ({ refreshKey: state.refreshKey + 1 })),
}))
