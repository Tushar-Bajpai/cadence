'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  Check,
  Copy,
  Flame,
  Heart,
} from 'lucide-react'
import { SiGithub, SiVercel, SiX, SiInstagram, SiYoutube } from 'react-icons/si'
import { FaLinkedinIn } from 'react-icons/fa6'
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
      <div className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between border-b border-white/15 pb-3 sm:pb-4 text-[11px] sm:text-sm font-bold tracking-[0.22em] text-[#a096b7] uppercase">
        <span>PROJECT SHOWCASE</span>
        <span className="flex items-center gap-1.5">
          <Flame className="size-3.5 text-[#8978ff]" />
          CODELIFTERS
        </span>
      </div>

      {/* Maximalist closing composition */}
      <div className="relative z-10 flex w-full flex-1 flex-col justify-center gap-4 py-5 sm:gap-6 sm:py-8 lg:gap-8">
        {/* Massive display headline with hollow echo */}
        <div className="flex items-end justify-between gap-6">
          <h2 className="display-stretch max-w-6xl">
            connect with
            <br />
            <em>codelifters.</em>
          </h2>
          <span
            aria-hidden="true"
            className="display-stretch text-hollow hidden shrink-0 select-none lg:block"
          >
            04
          </span>
        </div>

        {/* Access rows — ground-style oversized link list */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-10">
          <p className="eyebrow text-[11px] tracking-[0.28em] sm:text-xs lg:col-span-3">
            ACCESS &<br />DEMO
          </p>

          <div className="lg:col-span-9 xl:col-span-8">
            {/* Primary Action Button (Target for Jelly Guide) */}
            <a
              id="contact-btn"
              href="mailto:utsav0111@gmail.com?subject=Cadence%20by%20CodeLifters"
              onClick={() => triggerCelebration('Opening email to CodeLifters...')}
              className="round-link light-link inline-flex cursor-pointer items-center gap-3 text-base transition hover:text-white sm:text-lg"
            >
              <span>Say hello to the team</span>
              <ArrowUpRight className="transition-transform hover:translate-x-1 hover:-translate-y-1" size={22} />
            </a>

            {/* Hackathon Project Action Hub */}
            <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8 sm:gap-4 sm:text-base">
              {/* Quick Copy Team Email */}
              <button
                onClick={handleCopyEmail}
                className="group inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/5 px-4 py-2 font-mono text-xs text-white/80 transition hover:bg-white/15 hover:border-white/40 sm:px-5 sm:py-2.5 sm:text-sm cursor-pointer"
                title="Click to copy team email"
              >
                {copied ? (
                  <>
                    <Check className="size-4 text-emerald-400" />
                    <span className="text-emerald-300">utsav0111@gmail.com copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-4 text-white/50 transition group-hover:text-white" />
                    <span>utsav0111@gmail.com</span>
                  </>
                )}
              </button>

              <a
                href="https://github.com/Tushar-Bajpai/cadence"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 transition hover:bg-white/15 hover:text-white hover:border-white/30 sm:px-5 sm:py-2.5 sm:text-base"
              >
                <SiGithub className="size-4" />
                <span>GitHub Codebase</span>
                <ArrowUpRight className="size-3.5 opacity-60" />
              </a>

              <a
                href="https://codelifters.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-full border border-[#8978ff]/40 bg-[#8978ff]/15 px-4 py-2 text-[#cfc7ff] transition hover:bg-[#8978ff]/30 hover:text-white hover:border-[#8978ff]/60 sm:px-5 sm:py-2.5 sm:text-base"
              >
                <SiVercel className="size-4" />
                <span>Deployment Link</span>
                <ArrowUpRight className="size-3.5 opacity-60" />
              </a>

              <Link
                href="/auth"
                className="inline-flex items-center gap-2.5 rounded-full border border-[#8978ff]/50 bg-[#8978ff]/25 px-4 py-2 text-base font-medium text-white transition hover:bg-[#8978ff]/40 hover:border-[#8978ff] shadow-[0_0_20px_rgba(137,120,255,0.3)] sm:px-5 sm:py-2.5 sm:text-lg"
              >
                <span>Portal Sign In</span>
                <ArrowUpRight className="size-4 opacity-70" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Colophon Footer — Ironclad-style brand + link sections + aurora waves */}
      <footer className="aurora-footer relative z-20 mx-auto w-full max-w-7xl border-t border-white/12 px-1 pt-6 sm:pt-8">
        {/* Aurora grain-wave landscape (background) */}
        <div className="aurora-waves" aria-hidden="true" />
        <div className="aurora-grain" aria-hidden="true" />

        <div className="grid gap-8 pb-8 sm:pb-10 lg:grid-cols-12 lg:gap-6">
          {/* Brand column */}
          <div className="flex flex-col items-start gap-3 lg:col-span-4 lg:gap-4">
            <div className="flex items-center gap-2.5">
              <CadenceLogo className="size-6 sm:size-7" />
              <span className="text-lg font-semibold tracking-tight text-white sm:text-xl">
                Cadence
              </span>
            </div>
            <p className="max-w-[280px] text-[11px] leading-relaxed text-white/55 sm:text-sm">
              Join teams already running recurring billing on Cadence — every
              cycle invoiced. Zero missed. Never twice.
            </p>
            {/* Social tiles */}
            <div className="mt-1 flex items-center gap-2.5">
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Cadence on X"
                className="social-tile"
              >
                <SiX className="size-3.5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Cadence on Instagram"
                className="social-tile"
              >
                <SiInstagram className="size-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Cadence on LinkedIn"                className="social-tile"
              >
                <FaLinkedinIn className="size-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Cadence on YouTube"
                className="social-tile"
              >
                <SiYoutube className="size-4" />
              </a>
            </div>
          </div>

          {/* Link sections */}
          <nav className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4 lg:col-span-8 lg:gap-x-4">
            <div>
              <h4 className="footer-col-head">Product</h4>
              <ul>
                {['Features', 'Integrations', 'Pricing', 'Changelog', 'Security'].map((l) => (
                  <li key={l}>
                    <button
                      onClick={() => onNavigate(2)}
                      className="footer-col-link cursor-pointer text-left"
                    >
                      {l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="footer-col-head">Company</h4>
              <ul>
                <li>
                  <a href="https://codelifters.xyz" target="_blank" rel="noopener noreferrer" className="footer-col-link">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="https://codelifters.xyz/careers" target="_blank" rel="noopener noreferrer" className="footer-col-link">
                    Careers
                  </a>
                </li>
                <li>
                  <button onClick={handleCopyEmail} className="footer-col-link cursor-pointer">
                    Contact
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="footer-col-head">Resources</h4>
              <ul>
                <li>
                  <a href="https://github.com/Tushar-Bajpai/cadence" target="_blank" rel="noopener noreferrer" className="footer-col-link">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="https://github.com/Tushar-Bajpai/cadence" target="_blank" rel="noopener noreferrer" className="footer-col-link">
                    API Reference
                  </a>
                </li>
                <li>
                  <a href="https://github.com/Tushar-Bajpai/cadence" target="_blank" rel="noopener noreferrer" className="footer-col-link">
                    Help Center
                  </a>
                </li>
                <li>
                  <button onClick={() => onNavigate(0)} className="footer-col-link cursor-pointer">
                    Community
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="footer-col-head">Legal</h4>
              <ul>
                <li><a href="#" className="footer-col-link">Privacy Policy</a></li>
                <li><a href="#" className="footer-col-link">Terms of Service</a></li>
                <li><a href="#" className="footer-col-link">Cookie Policy</a></li>
                <li>
                  <Link href="/auth" className="footer-col-link">
                    Portal Sitemap
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        {/* Legal bar */}
        <div className="flex flex-col items-start gap-2 border-t border-white/12 py-3.5 text-[10px] uppercase tracking-[0.14em] text-white/45 sm:flex-row sm:items-center sm:justify-between sm:text-[11px]">
          <span>© 2026 Cadence by CodeLifters. All rights reserved.</span>
          <button
            onClick={() => onNavigate(0)}
            className="font-mono text-white/50 hover:text-white transition cursor-pointer"
          >
            ↑ RETURN TO OVERVIEW
          </button>
          <span className="flex items-center gap-1.5 normal-case">
            Made with
            <Heart className="size-3 fill-[#8978ff] text-[#8978ff]" />
            by
            <a
              href="https://codelifters.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 text-white/80 hover:text-white"
            >
              CodeLifters
            </a>
          </span>
        </div>
      </footer>
    </section>
  )
}
