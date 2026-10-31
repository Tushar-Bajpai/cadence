'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { MagazineHeader } from '@/components/magazine-header'

interface CoverSectionProps {
  pageStateClass: string
  onNavigate: (index: number) => void
}

export function CoverSection({ pageStateClass, onNavigate }: CoverSectionProps) {
  return (
    <section
      className={`magazine-page ${pageStateClass} hero flex flex-col justify-between px-4 py-4 sm:px-8 sm:py-5 lg:px-14`}
    >
      <div className="hero-shade absolute inset-0 pointer-events-none" />
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_30%_20%,rgba(113,86,255,.55),transparent_32%),linear-gradient(180deg,transparent_48%,#080625_100%)] pointer-events-none" />
      <div className="aurora-band" aria-hidden="true" />

      {/* Global Masthead Header */}
      <MagazineHeader onNavigate={onNavigate} />

      {/* Hero Headline & Action Triggers */}
      <div className="relative z-10 mx-auto my-auto w-full max-w-7xl py-2">
        <div className="max-w-3xl pt-1 sm:pt-4">
          <p className="eyebrow mb-2.5 text-[10px] tracking-[0.28em] sm:text-xs sm:mb-3 text-[#a79aff]">
            SUBSCRIPTION LIFECYCLE & BILLING ENGINE
          </p>
          <h1 className="text-3xl font-normal leading-[.88] tracking-[-0.085em] text-balance sm:text-5xl md:text-6xl lg:text-[5.8rem]">
            Recurring billing.<br />
            <em>Zero missed cycles.</em>
          </h1>
          <p className="mt-3.5 max-w-xl text-xs leading-relaxed text-white/75 sm:mt-5 sm:text-sm md:text-base">
            Cadence is an enterprise recurring billing engine built by <strong>CodeLifters</strong>. Guaranteed idempotent invoice generation, strict subscription state machines, multi-tier tax and discount automation, and sub-2s financial reporting.
          </p>
          <div id="hero-actions" className="mt-5 inline-flex flex-wrap items-center gap-3 sm:mt-7 sm:gap-3.5">
            <button
              id="hero-btn"
              onClick={() => onNavigate(1)}
              className="group inline-flex items-center gap-2.5 rounded-full bg-[#8978ff] px-5 py-2.5 text-xs font-semibold shadow-[0_10px_35px_rgba(137,120,255,.4)] transition hover:bg-[#9b8cff] sm:px-6 sm:py-3.5 sm:text-sm cursor-pointer"
            >
              <span>Explore the Engine</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </button>

            <Link
              id="hero-auth-btn"
              href="/auth"
              className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/15 hover:border-white/40 sm:px-5 sm:py-3.5 sm:text-sm cursor-pointer"
            >
              <span>Portal Sign In</span>
              <ArrowUpRight className="size-4 text-white/70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Colophon Bar */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between border-t border-white/15 pt-3 sm:pt-4 text-[10px] sm:text-xs font-mono tracking-[0.15em] text-white/40 uppercase">
        <span className="hidden sm:block text-white/40">CADENCE RECURRING BILLING ENGINE • CODELIFTERS</span>
        <button
          onClick={() => onNavigate(1)}
          className="ml-auto hover:text-white transition cursor-pointer flex items-center gap-1.5"
        >
          <span>NEXT</span>
          <span>↓</span>
        </button>
      </div>
    </section>
  )
}
