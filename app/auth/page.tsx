'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Zap,
  User,
} from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'
import { CadenceLogo } from '@/components/cadence-logo'
import { useAuthStore } from '@/stores/use-auth-store'
import { loginSchema, signupSchema } from '@/lib/validators'
import { toUserFriendlyError } from '@/lib/friendly-error'
import { startTopLoading, stopTopLoading } from '@/lib/loading'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [showPassword, setShowPassword] = useState(false)
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    const googleError = new URLSearchParams(window.location.search).get('googleError')
    if (!googleError) return

    const messages: Record<string, string> = {
      unconfigured: 'Google sign-in is not configured on this server.',
      invalid_state: 'Google sign-in expired or was cancelled. Please try again.',
      token_exchange: 'Google sign-in could not be completed. Please try again.',
      profile: 'Google profile information could not be read. Please try again.',
      no_email: 'Google did not provide an email address for this account.',
      unverified_email: 'Your Google email address is not verified.',
      server_error: 'Google sign-in failed unexpectedly. Please try again.',
    }
    setError(messages[googleError] || 'Google sign-in failed. Please try again.')
    window.history.replaceState({}, '', '/auth')
  }, [])

  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoadingProvider('email')

    const endpoint = mode === 'signin' ? '/api/auth/login' : '/api/auth/signup'
    const body = mode === 'signin' ? { email, password } : { name, email, password }

    // Instant client-side Zod input validation
    const schema = mode === 'signin' ? loginSchema : signupSchema
    const parseResult = schema.safeParse(body)
    if (!parseResult.success) {
      setError(parseResult.error.issues[0]?.message || 'Invalid input')
      setLoadingProvider(null)
      return
    }

    try {
      startTopLoading()
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        stopTopLoading()
        setError(toUserFriendlyError(json.error || 'Something went wrong. Please try again.'))
        setLoadingProvider(null)
        return
      }

      if (json?.user) {
        useAuthStore.getState().setUser(json.user)
      }

      setIsSuccess(true)
      setSuccessMsg(mode === 'signin' ? 'Welcome back' : 'Account created')

      const role = json?.user?.role as string | undefined
      const isAdmin = role === 'ADMIN' || role === 'STAFF'
      setTimeout(() => {
        router.push(isAdmin ? '/admin' : '/portal')
        router.refresh()
      }, 900)
    } catch (err: any) {
      stopTopLoading()
      setError(toUserFriendlyError(err?.message || 'Network error. Please check your connection and try again.'))
      setLoadingProvider(null)
    }
  }

  const handleOAuth = (provider: string) => {
    if (provider === 'Google') {
      setLoadingProvider(provider)
      window.location.assign('/api/auth/google')
    }
  }

  return (
    <main className="relative min-h-[100dvh] w-full overflow-y-auto bg-[#05051a] text-white flex flex-col justify-between p-4 sm:p-8">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none opacity-40 [background-image:radial-gradient(circle_at_50%_15%,rgba(92,75,255,0.4),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(65,45,190,0.25),transparent_50%)]" />

      {/* Top Header */}
      <header className="relative z-20 mx-auto flex w-full max-w-5xl items-center justify-between pb-6 border-b border-white/10">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-white/50 transition hover:text-white"
        >
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-1" />
          <span>Back</span>
        </Link>

        <div className="flex items-center gap-2">
          <CadenceLogo className="size-6" />
          <span className="text-xs font-semibold tracking-[0.24em] text-white/90 uppercase">
            Cadence • CodeLifters
          </span>
        </div>
      </header>

      {/* Auth Card */}
      <div className="relative z-10 mx-auto my-auto w-full max-w-md py-6 sm:py-10">
        <div className="relative rounded-3xl border border-white/12 bg-[#0a0728]/95 p-6 sm:p-9 shadow-[0_25px_80px_rgba(0,0,0,0.85)] backdrop-blur-2xl">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 size-40 rounded-full bg-[#8978ff]/20 blur-3xl pointer-events-none" />

          {/* Mode Switcher */}
          <div className="relative mb-7 flex rounded-full bg-white/5 p-1 border border-white/10">
            <button
              type="button"
              onClick={() => {
                setMode('signin')
                setIsSuccess(false)
              }}
              className={`flex-1 rounded-full py-2 text-xs font-semibold uppercase tracking-[0.14em] transition cursor-pointer ${
                mode === 'signin'
                  ? 'bg-[#8978ff] text-white shadow-[0_0_20px_rgba(137,120,255,0.45)]'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup')
                setIsSuccess(false)
              }}
              className={`flex-1 rounded-full py-2 text-xs font-semibold uppercase tracking-[0.14em] transition cursor-pointer ${
                mode === 'signup'
                  ? 'bg-[#8978ff] text-white shadow-[0_0_20px_rgba(137,120,255,0.45)]'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Card Headline */}
          <div className="mb-6 text-center">
            <CadenceLogo className="size-11 mx-auto mb-3" />
            <h1 className="text-2xl font-normal tracking-[-0.035em] text-white sm:text-3xl">
              {mode === 'signin' ? 'Cadence Portal' : 'Create Portal Account'}
            </h1>
            <p className="mt-1.5 text-xs text-white/50">
              {mode === 'signin'
                ? 'Sign in to access your subscriptions, invoices & reports'
                : 'Register as a customer to manage recurring subscriptions'}
            </p>
          </div>

          {/* Success State */}
          {isSuccess ? (
            <div className="py-8 text-center animate-in zoom-in-95 duration-200">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-500/20 border border-emerald-500/40">
                <Check className="size-6 text-emerald-400" />
              </div>
              <p className="mt-4 text-base font-medium text-white">{successMsg}</p>
              <p className="mt-1 text-xs text-white/40">Redirecting...</p>
            </div>
          ) : (
            <>
              {/* Quick Login & Role Demo Shortcuts */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleOAuth('Google')}
                  disabled={loadingProvider !== null}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-white/12 bg-white/5 py-2 px-2 text-xs font-medium text-white transition hover:bg-white/10 hover:border-white/25 cursor-pointer disabled:opacity-50"
                  title="Sign in with Google OAuth"
                >
                  {loadingProvider === 'Google' ? (
                    <Loader2 className="size-3.5 animate-spin text-white/60" />
                  ) : (
                    <FcGoogle className="size-3.5 shrink-0" />
                  )}
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setError(null)
                    setEmail('admin@cadence.dev')
                    setPassword('Admin@1234')
                    setLoadingProvider('demo-admin')
                    startTopLoading()
                    try {
                      const res = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: 'admin@cadence.dev', password: 'Admin@1234' }),
                      })
                      const json = await res.json().catch(() => ({}))
                      if (res.ok) {
                        if (json?.user) {
                          useAuthStore.getState().setUser(json.user)
                        }
                        setIsSuccess(true)
                        setSuccessMsg('Welcome back, Admin')
                        setTimeout(() => {
                          window.location.href = '/admin'
                        }, 400)
                      } else {
                        stopTopLoading()
                        setError(toUserFriendlyError(json.error || 'Failed to sign in as Demo Admin'))
                      }
                    } catch (err: any) {
                      stopTopLoading()
                      setError(toUserFriendlyError(err?.message || 'Connection error during demo login'))
                    } finally {
                      setLoadingProvider(null)
                    }
                  }}
                  disabled={loadingProvider !== null}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-[#8978ff]/30 bg-[#8978ff]/15 py-2 px-2 text-xs font-semibold text-[#a79aff] transition hover:bg-[#8978ff]/25 cursor-pointer disabled:opacity-50"
                  title="1-click demo login as Admin"
                >
                  {loadingProvider === 'demo-admin' ? (
                    <Loader2 className="size-3 animate-spin text-[#8978ff]" />
                  ) : (
                    <Zap className="size-3 fill-[#8978ff] text-[#8978ff]" />
                  )}
                  <span>Admin ⚡</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setError(null)
                    setEmail('robert.fox@example.com')
                    setPassword('Admin@1234')
                    setLoadingProvider('demo-customer')
                    startTopLoading()
                    try {
                      const res = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: 'robert.fox@example.com', password: 'Admin@1234' }),
                      })
                      const json = await res.json().catch(() => ({}))
                      if (res.ok) {
                        if (json?.user) {
                          useAuthStore.getState().setUser(json.user)
                        }
                        setIsSuccess(true)
                        setSuccessMsg('Welcome back, Robert Fox')
                        setTimeout(() => {
                          window.location.href = '/portal'
                        }, 400)
                      } else {
                        stopTopLoading()
                        setError(toUserFriendlyError(json.error || 'Failed to sign in as Demo Customer'))
                      }
                    } catch (err: any) {
                      stopTopLoading()
                      setError(toUserFriendlyError(err?.message || 'Connection error during demo login'))
                    } finally {
                      setLoadingProvider(null)
                    }
                  }}
                  disabled={loadingProvider !== null}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-white/12 bg-white/5 py-2 px-2 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white cursor-pointer disabled:opacity-50"
                  title="1-click demo login as Customer (Robert Fox)"
                >
                  {loadingProvider === 'demo-customer' ? (
                    <Loader2 className="size-3 animate-spin text-white/60" />
                  ) : (
                    <User className="size-3 text-[#8978ff]" />
                  )}
                  <span>Customer</span>
                </button>
              </div>

              {/* Minimal Divider */}
              <div className="relative my-5 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <span className="relative bg-[#0a0728] px-3 text-[10px] uppercase font-mono tracking-[0.16em] text-white/40">
                  or email
                </span>
              </div>

              {/* Email / Password Form without icon clutter */}
              <form onSubmit={handleAuth} className="space-y-3.5">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-[0.16em] text-white/50 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full rounded-xl border border-white/12 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-[#8978ff] focus:outline-none focus:ring-1 focus:ring-[#8978ff]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-[0.16em] text-white/50 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-white/12 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-[#8978ff] focus:outline-none focus:ring-1 focus:ring-[#8978ff]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-mono uppercase tracking-[0.16em] text-white/50">
                      Password
                    </label>
                    {mode === 'signin' && (
                      <Link
                        href={`/forgot-password?email=${encodeURIComponent(email)}`}
                        className="text-[10px] text-white/40 hover:text-white transition cursor-pointer"
                      >
                        Forgot password?
                      </Link>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
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
                  {mode === 'signup' && (
                    <p className="mt-1.5 text-[10px] text-white/45 font-mono">
                      Must be at least 9 characters with uppercase, lowercase, and special character.
                    </p>
                  )}
                </div>

                {/* Inline API error */}
                {error && !isSuccess && (
                  <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
                    {error}
                  </p>
                )}

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={loadingProvider !== null}
                  className="mt-3 w-full rounded-full bg-[#8978ff] py-2.5 px-4 text-xs font-semibold text-white shadow-[0_5px_20px_rgba(137,120,255,0.4)] transition hover:bg-[#9b8cff] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loadingProvider === 'email' ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>{mode === 'signin' ? 'Sign In to Portal' : 'Create Portal Account'}</span>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Clean Minimal Footer */}
      <footer className="relative z-20 mx-auto flex w-full max-w-5xl items-center justify-between pt-6 border-t border-white/10 text-[10px] font-mono uppercase tracking-[0.16em] text-white/40">
        <span>Cadence by CodeLifters</span>
        <span>© 2026</span>
      </footer>
    </main>
  )
}
