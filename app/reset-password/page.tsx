'use client'

import React, { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'
import { AuthShell } from '@/components/auth-shell'

// Step 2 of the OTP reset flow: verify the 6-digit code and set a new password.
function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialEmail = searchParams.get('email') ?? ''

  const [email, setEmail] = useState(initialEmail)
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendMsg, setResendMsg] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, password }),
      })
      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(json.error || 'Something went wrong. Please try again.')
        return
      }
      setDone(true)
      setTimeout(() => {
        router.push('/auth')
      }, 1400)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    if (!email) {
      setError('Enter your email first, then resend the code.')
      return
    }
    setResending(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) setResendMsg('A new code has been sent to your email.')
      else setError('Could not resend the code. Try again in a moment.')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setResending(false)
    }
  }

  if (done) {
    return (
      <div className="relative rounded-3xl border border-white/12 bg-[#0a0728]/95 p-6 sm:p-9 shadow-[0_25px_80px_rgba(0,0,0,0.85)] backdrop-blur-2xl py-10 text-center animate-in zoom-in-95 duration-200">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 size-40 rounded-full bg-[#8978ff]/20 blur-3xl pointer-events-none" />
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-500/20 border border-emerald-500/40">
          <Check className="size-6 text-emerald-400" />
        </div>
        <p className="mt-4 text-base font-medium text-white">Password updated</p>
        <p className="mt-1.5 text-xs text-white/50">
          Sign in with your new password...
        </p>
      </div>
    )
  }

  return (
    <div className="relative rounded-3xl border border-white/12 bg-[#0a0728]/95 p-6 sm:p-9 shadow-[0_25px_80px_rgba(0,0,0,0.85)] backdrop-blur-2xl">
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 size-40 rounded-full bg-[#8978ff]/20 blur-3xl pointer-events-none" />

      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl border border-white/12 bg-white/5">
          <ShieldCheck className="size-5 text-[#8978ff]" />
        </div>
        <h1 className="text-2xl font-normal tracking-[-0.035em] text-white sm:text-3xl">
          Set a <em className="italic text-[#8978ff]">new password.</em>
        </h1>
        <p className="mt-1.5 text-xs text-white/50">
          Enter the 6-digit code sent to your email, then choose a new password
        </p>
      </div>

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

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[10px] font-mono uppercase tracking-[0.16em] text-white/50">
              6-digit code
            </label>
            <button
              type="button"
              onClick={resend}
              disabled={resending}
              className="text-[10px] text-[#8978ff]/80 hover:text-white transition cursor-pointer disabled:opacity-50"
            >
              {resending ? 'Resending...' : 'Resend code'}
            </button>
          </div>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="••••••"
            className="w-full rounded-xl border border-white/12 bg-white/5 px-3.5 py-2.5 text-center text-lg text-white placeholder-white/30 tracking-[0.5em] focus:border-[#8978ff] focus:outline-none focus:ring-1 focus:ring-[#8978ff]"
          />
          {resendMsg && (
            <p className="mt-1.5 text-[10px] text-emerald-300">{resendMsg}</p>
          )}
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-[0.16em] text-white/50 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-white/12 bg-white/5 px-3.5 py-2.5 pr-9 text-xs text-white placeholder-white/30 focus:border-[#8978ff] focus:outline-none focus:ring-1 focus:ring-[#8978ff]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
            <p className="mt-1.5 text-[10px] text-white/45 font-mono">
              Must be at least 9 characters with uppercase, lowercase, and special character.
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-[0.16em] text-white/50 mb-1.5">
              Confirm Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-xl border border-white/12 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-[#8978ff] focus:outline-none focus:ring-1 focus:ring-[#8978ff]"
            />
          </div>
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
              <span>Updating...</span>
            </>
          ) : (
            <span>Reset password</span>
          )}
        </button>
      </form>
    </div>
  )
}

// useSearchParams requires a Suspense boundary during prerendering.
export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <Suspense
        fallback={
          <div className="rounded-3xl border border-white/12 bg-[#0a0728]/95 p-9 text-center text-xs text-white/50">
            <Loader2 className="mx-auto size-5 animate-spin text-white/40" />
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  )
}
