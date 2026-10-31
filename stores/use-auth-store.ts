import { create } from 'zustand'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER'
  customerId?: string | null
}

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  setUser: (user: AuthUser | null) => void
  clearUser: () => void
  logout: () => Promise<void>
  fetchUser: () => Promise<AuthUser | null>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,

  setUser: (user) => set({ user, isLoading: false }),

  clearUser: () => set({ user: null, isLoading: false }),

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {}
    if (typeof document !== 'undefined') {
      document.cookie = 'cadence_session=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
    set({ user: null, isLoading: false })
    window.location.href = '/auth'
  },

  fetchUser: async () => {
    set({ isLoading: true })
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        set({ user: data.user, isLoading: false })
        return data.user
      } else {
        set({ user: null, isLoading: false })
        return null
      }
    } catch {
      set({ user: null, isLoading: false })
      return null
    }
  },
}))
