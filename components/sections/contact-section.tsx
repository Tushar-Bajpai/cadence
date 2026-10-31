'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  Check,
  Copy,
  Flame,
} from 'lucide-react'
import { SiGithub, SiVercel } from 'react-icons/si'
import { CadenceLogo } from '@/components/cadence-logo'

interface ContactSectionProps {
  pageStateClass: string
  onNavigate: (index: number) => void
}

export function ContactSection({ pageStateClass, onNavigate }: ContactSectionProps) {
  const [copied, setCopied] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Trigger celebration feedback
  const triggerCelebration = (toastText?: string) => {
    if (toastText) {
      setToastMessage(toastText)
      setTimeout(() => setToastMessage(null), 3500)
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('jelly-celebrate'))
    }
  }

  // Copy email functionality
  const handleCopyEmail = async () => {
    const email = 'utsav0111@gmail.com'
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      triggerCelebration('Copied utsav0111@gmail.com to clipboard!')
      setTimeout(() => setCopied(false), 2500)
    } catch {
      triggerCelebration('Reach us at utsav0111@gmail.com')
    }
  }

  return (
    <section
      id="contact"
      className={`magazine-page ${pageStateClass} closing-section flex flex-col justify-between px-4 py-5 sm:px-8 lg:px-14`}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-full border border-emerald-500/30 bg-[#120a3a]/95 px-5 py-2.5 text-xs font-medium text-white shadow-[0_10px_35px_rgba(0,0,0,0.6)] backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <Check className="size-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Page Header */}
      <div className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between border-b border-white/15 pb-3 sm:pb-4 text-[10px] sm:text-xs font-bold tracking-[0.2em] text-[#a096b7] uppercase">
        <span>PROJECT SHOWCASE</span>
        <span className="flex items-center gap-1.5">
          <Flame className="size-3 text-[#8978ff]" />
          CODELIFTERS
        </span>
      </div>

      {/* Closing Contact Body */}
      <div className="relative z-10 mx-auto my-auto w-full max-w-7xl py-2">
        <div className="max-w-4xl">
          <p className="eyebrow mb-2.5 text-[10px] tracking-[0.28em] sm:text-xs sm:mb-3 text-[#a79aff]">
            ACCESS & DEMO
          </p>

          <h2 className="text-3xl font-normal leading-[.88] tracking-[-0.09em] sm:text-5xl lg:text-[5.5rem]">
            Connect with<br />
            <em>CodeLifters.</em>
          </h2>

          {/* Primary Action Button (Target for Jelly Guide) */}
          <div className="mt-5 sm:mt-7">
            <a
              id="contact-btn"
              href="mailto:utsav0111@gmail.com?subject=Cadence%20by%20CodeLifters"
              onClick={() => triggerCelebration('Opening email to CodeLifters...')}
              className="round-link light-link cursor-pointer hover:text-white inline-flex"
            >
              <span>Say hello to the team</span>
              <ArrowUpRight size={20} />
            </a>
          </div>

          {/* Hackathon Project Action Hub & Direct Contact */}
          <div className="mt-8 sm:mt-10 pt-5 border-t border-white/10 flex flex-wrap items-center gap-2.5 sm:gap-3.5 text-xs text-white/70">
            {/* Quick Copy Team Email */}
            <button
              onClick={handleCopyEmail}
              className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3.5 py-1.5 text-xs font-mono text-white/80 transition hover:bg-white/15 hover:border-white/40 cursor-pointer"
              title="Click to copy team email"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-emerald-400" />
                  <span className="text-emerald-300">utsav0111@gmail.com copied!</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5 text-white/50 transition group-hover:text-white" />
                  <span>utsav0111@gmail.com</span>
                </>
              )}
            </button>

            <a
              href="https://github.com/Tushar-Bajpai/cadence"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 transition hover:bg-white/15 hover:text-white hover:border-white/30"
            >
              <SiGithub className="size-3.5" />
              <span>GitHub Codebase</span>
              <ArrowUpRight className="size-3 opacity-60" />
            </a>

            <a
              href="https://codelifters.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-[#8978ff]/40 bg-[#8978ff]/15 px-3.5 py-1.5 text-[#cfc7ff] transition hover:bg-[#8978ff]/30 hover:text-white hover:border-[#8978ff]/60"
            >
              <SiVercel className="size-3" />
              <span>Deployment Link</span>
              <ArrowUpRight className="size-3 opacity-60" />
            </a>

            <Link
              href="/auth"
              className="inline-flex items-center gap-2 rounded-full border border-[#8978ff]/50 bg-[#8978ff]/25 px-3.5 py-1.5 text-white font-medium transition hover:bg-[#8978ff]/40 hover:border-[#8978ff] shadow-[0_0_15px_rgba(137,120,255,0.25)]"
            >
              <span>Portal Sign In</span>
              <ArrowUpRight className="size-3 opacity-70" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Colophon Footer */}
      <footer className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between border-t border-white/12 pt-3 sm:pt-4 text-[10px] sm:text-xs uppercase tracking-[0.15em] text-white/60">
        <div className="flex items-center gap-2">
          <CadenceLogo className="size-5 sm:size-6" />
          <span className="font-semibold tracking-wider text-white">Cadence</span>
          <span className="hidden sm:inline text-white/40">• by CodeLifters</span>
        </div>
        <button
          onClick={() => onNavigate(0)}
          className="font-mono text-white/50 hover:text-white transition cursor-pointer text-[10px] sm:text-xs"
        >
          ↑ RETURN TO OVERVIEW
        </button>
        <span>© 2026</span>
      </footer>
    </section>
  )
}
