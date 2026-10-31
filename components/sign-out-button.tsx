'use client'

import { useRouter } from 'next/navigation'
import { Loader2, LogOut } from 'lucide-react'
import { useState } from 'react'

export function SignOutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const signOut = async () => {
    setLoading(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 py-2 text-xs font-mono uppercase tracking-[0.16em] text-white/60 transition hover:border-white/25 hover:text-white cursor-pointer disabled:opacity-50"
    >
      {loading ? <Loader2 className="size-3.5 animate-spin" /> : <LogOut className="size-3.5" />}
      <span>Sign out</span>
    </button>
  )
}
