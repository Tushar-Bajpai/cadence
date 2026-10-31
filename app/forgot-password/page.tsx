'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Check, Loader2, Mail } from 'lucide-react'
import { AuthShell } from '@/components/auth-shell'

// Step 1 of the OTP reset flow: request a one-time code.
// The API always answers 200 (never leaks whether the email exists).
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(json.error || 'Something went wrong. Please try again.')
        return
      }
      setSent(json.message || 'A 6-digit code has been sent.')
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <div className="relative rounded-3xl border border-white/12 bg-[#0a0728]/95 p-6 sm:p-9 shadow-[0_25px_80px_rgba(0,0,0,0.85)] backdrop-blur-2xl">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 size-40 rounded-full bg-[#8978ff]/20 blur-3xl pointer-events-none" />

        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl border border-white/12 bg-white/5">
            <Mail className="size-5 text-[#8978ff]" />
          </div>
          <h1 className="text-2xl font-normal tracking-[-0.035em] text-white sm:text-3xl">
            Reset your <em className="italic text-[#8978ff]">password.</em>
          </h1>
          <p className="mt-1.5 text-xs text-white/50">
            Enter your registered email and we&apos;ll send a one-time 6-digit code
          </p>
        </div>

        {sent ? (
          <div className="py-6 text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-500/20 border border-emerald-500/40">
              <Check className="size-6 text-emerald-400" />
            </div>
            <p className="mt-4 text-base font-medium text-white">Check your inbox</p>
            <p className="mx-auto mt-1.5 max-w-[280px] text-xs text-white/50">
              {sent} It can only be used once.
            </p>
            <Link
              href={`/reset-password?email=${encodeURIComponent(email)}`}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#8978ff] py-2.5 px-4 text-xs font-semibold text-white shadow-[0_5px_20px_rgba(137,120,255,0.4)] transition hover:bg-[#9b8cff]"
            >
              Enter reset code
            </Link>
            <p className="mt-3 text-[10px] text-white/40">
              Didn&apos;t get it? Come back here and submit again (60s cooldown).
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-[0.16em] text-white/50 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-white/12 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-[#8978ff] focus:outline-none focus:ring-1 focus:ring-[#8978ff]"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-3 w-full rounded-full bg-[#8978ff] py-2.5 px-4 text-xs font-semibold text-white shadow-[0_5px_20px_rgba(137,120,255,0.4)] transition hover:bg-[#9b8cff] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Sending code...</span>
                </>
              ) : (
                <span>Send reset code</span>
              )}
            </button>

            <p className="text-center text-[10px] text-white/40 pt-1">
              The code expires after 10 minutes.
            </p>
          </form>
        )}
      </div>
    </AuthShell>
  )
}
