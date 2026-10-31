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
  fetchUser: () => Promise<AuthUser | null>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,

  setUser: (user) => set({ user, isLoading: false }),

  clearUser: () => set({ user: null, isLoading: false }),

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
