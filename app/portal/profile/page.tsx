'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PortalTopNavbar } from '@/components/portal/portal-top-navbar'
import {
  User,
  Building,
  Phone,
  MapPin,
  Mail,
  CheckCircle2,
  Calendar,
  Save,
  Clock,
  Sparkles,
  Shield,
  Activity,
} from 'lucide-react'

export default function PortalProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/portal/profile')
      if (res.status === 401) {
        router.push('/auth')
        return
      }
      const data = await res.json()
      if (data && !data.error) {
        setProfile(data)
        setName(data.name || '')
        setCompanyName(data.companyName === 'Individual' ? '' : data.companyName || '')
        setPhone(data.phone === '—' ? '' : data.phone || '')
        setAddress(data.address === '—' ? '' : data.address || '')
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const res = await fetch('/api/portal/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          companyName: companyName.trim() || 'Individual',
          phone: phone.trim() || null,
          address: address.trim() || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update profile')
      setNotice('Profile updated successfully!')
      setTimeout(() => setNotice(null), 4000)
      fetchProfile()
    } catch (err: any) {
      alert(err.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#05051a] text-white flex flex-col font-sans antialiased selection:bg-[#8978ff]/30 selection:text-white relative">
      <div className="fixed inset-0 pointer-events-none opacity-40 [background-image:radial-gradient(circle_at_25%_10%,rgba(113,86,255,.35),transparent_40%),radial-gradient(circle_at_80%_65%,rgba(82,67,244,.2),transparent_45%)]" />
      <div className="fixed inset-0 opacity-[0.035] pointer-events-none noise-overlay" />

      <PortalTopNavbar
        activeTab="profile"
        customerName={name || 'Customer'}
      />

      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {notice && (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2.5 animate-in slide-in-from-top-2 duration-200">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Customer Profile & Account
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Manage your personal profile, company details, contact information, and view recent activity.
          </p>
        </div>

        {loading ? (
          <div className="h-96 rounded-3xl bg-white/[0.02] border border-white/5 animate-pulse" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Editable Form */}
            <div className="lg:col-span-7 space-y-6">
              <form
                onSubmit={handleSubmit}
                className="rounded-3xl bg-white/[0.03] backdrop-blur-md border border-white/10 p-6 sm:p-8 space-y-6"
              >
                <div className="flex items-center gap-4 pb-6 border-b border-white/10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#8978ff] to-[#5243f4] flex items-center justify-center font-bold text-2xl text-white shadow-[0_0_24px_rgba(137,120,255,0.4)]">
                    {name ? name.slice(0, 2).toUpperCase() : 'CU'}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{name || 'Customer Name'}</h2>
                    <p className="text-xs text-white/50">{profile?.email}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        {profile?.role || 'Customer'}
                      </span>
                      <span className="text-[11px] text-white/40">
                        Member since {profile?.joined}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Name field */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/60 block mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full h-11 bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#8978ff] focus:ring-1 focus:ring-[#8978ff] transition"
                      />
                    </div>
                  </div>

                  {/* Company Name field */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/60 block mb-1.5">
                      Company Name
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Company or Organization (optional)"
                        className="w-full h-11 bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#8978ff] focus:ring-1 focus:ring-[#8978ff] transition"
                      />
                    </div>
                  </div>

                  {/* Email (Read-only for security) */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/60 block mb-1.5">
                      Email Address (Sign-in Identity)
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type="email"
                        disabled
                        value={profile?.email || ''}
                        className="w-full h-11 bg-white/[0.02] border border-white/5 rounded-xl pl-10 pr-4 text-sm text-white/50 cursor-not-allowed"
                      />
                    </div>
                    <span className="text-[11px] text-white/30 mt-1 block">
                      To change your primary email, contact customer support.
                    </span>
                  </div>

                  {/* Phone field */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/60 block mb-1.5">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full h-11 bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#8978ff] focus:ring-1 focus:ring-[#8978ff] transition"
                      />
                    </div>
                  </div>

                  {/* Billing Address field */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/60 block mb-1.5">
                      Billing Address
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-white/40" />
                      <textarea
                        rows={3}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Street, City, State, PIN code, Country"
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#8978ff] focus:ring-1 focus:ring-[#8978ff] transition resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#8978ff] hover:bg-[#9b8cff] text-white text-xs font-semibold transition shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column: Account Security & Activity Timeline */}
            <div className="lg:col-span-5 space-y-6">
              {/* Account Overview Box */}
              <div className="rounded-3xl bg-white/[0.03] backdrop-blur-md border border-white/10 p-6 space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/60 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#8978ff]" />
                  <span>Security & Account Info</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-white/40">Account ID:</span>
                    <span className="font-mono text-white/70">{profile?.id?.slice(0, 12)}...</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-white/40">Role Authorization:</span>
                    <span className="text-white font-medium">{profile?.role}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-white/40">Account Status:</span>
                    <span className="text-emerald-400 font-medium">Active</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-white/40">Password:</span>
                    <span className="text-white/70">••••••••••••</span>
                  </div>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="rounded-3xl bg-white/[0.03] backdrop-blur-md border border-white/10 p-6 space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/60 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#8978ff]" />
                  <span>Recent Activity Log</span>
                </h3>

                {profile?.activity && profile.activity.length > 0 ? (
                  <div className="space-y-3">
                    {profile.activity.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-white">{item.title}</span>
                          <span className="text-[10px] text-white/40">{item.time}</span>
                        </div>
                        <p className="text-white/50 text-[11px]">{item.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-white/40 italic">
                    No recent events logged for this account.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

