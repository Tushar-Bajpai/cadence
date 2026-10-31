'use client'

import React from 'react'
import { ArrowRight } from 'lucide-react'

interface StorySectionProps {
  pageStateClass: string
  onNavigate: (index: number) => void
}

export function StorySection({ pageStateClass, onNavigate }: StorySectionProps) {
  return (
    <section
      id="story"
      className={`magazine-page ${pageStateClass} bg-[#080628] flex flex-col justify-between px-4 py-4 sm:px-8 sm:py-5 lg:px-14`}
    >
      {/* Top Page Header */}
      <div className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between border-b border-white/10 pb-3 sm:pb-4 text-[10px] sm:text-xs font-bold tracking-[0.2em] text-[#a096b7] uppercase">
        <span>THE ENGINE</span>
        <span>TRANSACTIONAL BILLING RUNS</span>
      </div>

      {/* Story Spread Body */}
      <div className="relative z-10 mx-auto my-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:gap-14">
        <div>
          <p className="eyebrow text-[10px] tracking-[0.28em] sm:text-xs text-[#a79aff]">
            ATOMIC REVENUE PIPELINE
          </p>
          <h2 className="mt-2.5 max-w-2xl text-2xl leading-[.9] tracking-[-0.085em] sm:mt-4 sm:text-5xl lg:text-[4.2rem]">
            The heartbeat of recurring revenue.<br />
            <em>Never billed twice.</em>
          </h2>
        </div>
        <div className="max-w-xl lg:pt-2">
          <p className="text-xs leading-relaxed text-white/75 sm:text-base lg:text-lg">
            At the heart of Cadence is an atomic invoicing engine designed to eliminate billing leakage. Powered by PostgreSQL transactions, catch-up loops for missed periods, dynamic line-item taxes, and auto-expiring discounts, every subscription is billed accurately on its exact cadence—daily, weekly, monthly, or yearly.
          </p>

          <button
            id="story-btn"
            onClick={() => onNavigate(2)}
            className="group mt-5 inline-flex items-center gap-2.5 text-xs font-semibold text-[#8978ff] transition hover:text-white sm:mt-6 sm:text-sm cursor-pointer"
          >
            <span>Explore Core Modules</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      <div className="curve-line curve-line-one pointer-events-none" />

      {/* Bottom Page Footer */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between border-t border-white/10 pt-4 text-xs font-mono text-white/40 tracking-[0.15em] uppercase">
        <button
          onClick={() => onNavigate(0)}
          className="hover:text-white transition cursor-pointer"
        >
          ↑ PREV
        </button>
        <button
          onClick={() => onNavigate(2)}
          className="hover:text-white transition cursor-pointer"
        >
          NEXT ↓
        </button>
      </div>
    </section>
  )
}

