import { create } from 'zustand'

export type PortalTab = 'billing' | 'subscriptions' | 'invoices' | 'catalog' | 'profile'

export interface PortalInvoice {
  id: string
  seq: number
  number: string
  issueDate: string
  dueDate: string
  status: 'DRAFT' | 'CONFIRMED' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  total: number
  formattedTotal: string
  amountPaid: number
  formattedAmountPaid: string
  balanceDue: number
  formattedBalanceDue: string
  isOverdue: boolean
}

interface PortalState {
  // Navigation & Search
  activeTab: PortalTab
  searchQuery: string
  setActiveTab: (tab: PortalTab) => void
  setSearchQuery: (query: string) => void

  // Catalog / Plan Configurator State
  selectedPlanId: string | null
  selectedProductId: string | null
  selectedVariantId: string | null
  quantity: number
  setSelectedPlanId: (id: string | null) => void
  setSelectedProductId: (id: string | null) => void
  setSelectedVariantId: (id: string | null) => void
  setQuantity: (qty: number) => void
  incrementQuantity: () => void
  decrementQuantity: (min?: number) => void
  resetConfigurator: () => void

  // Payment Modal State
  isPaymentModalOpen: boolean
  selectedInvoiceForPayment: PortalInvoice | null
  openPaymentModal: (invoice: PortalInvoice) => void
  closePaymentModal: () => void

  // Data Refresh Trigger
  refreshKey: number
  triggerRefresh: () => void
}

export const usePortalStore = create<PortalState>((set) => ({
  // Navigation & Search
  activeTab: 'billing',
  searchQuery: '',
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Catalog Configurator
  selectedPlanId: null,
  selectedProductId: null,
  selectedVariantId: null,
  quantity: 1,
  setSelectedPlanId: (id) => set({ selectedPlanId: id }),
  setSelectedProductId: (id) => set({ selectedProductId: id }),
  setSelectedVariantId: (id) => set({ selectedVariantId: id }),
  setQuantity: (qty) => set({ quantity: Math.max(1, qty) }),
  incrementQuantity: () => set((state) => ({ quantity: state.quantity + 1 })),
  decrementQuantity: (min = 1) =>
    set((state) => ({ quantity: Math.max(min, state.quantity - 1) })),
  resetConfigurator: () =>
    set({
      selectedPlanId: null,
      selectedProductId: null,
      selectedVariantId: null,
      quantity: 1,
    }),

  // Payment Modal
  isPaymentModalOpen: false,
  selectedInvoiceForPayment: null,
  openPaymentModal: (invoice) =>
    set({
      isPaymentModalOpen: true,
      selectedInvoiceForPayment: invoice,
    }),
  closePaymentModal: () =>
    set({
      isPaymentModalOpen: false,
      selectedInvoiceForPayment: null,
    }),

  // Refresh
  refreshKey: 0,
  triggerRefresh: () => set((state) => ({ refreshKey: state.refreshKey + 1 })),
}))
