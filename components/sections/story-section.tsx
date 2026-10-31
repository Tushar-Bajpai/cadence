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
      <div className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between border-b border-white/10 pb-3 sm:pb-4 text-[11px] sm:text-sm font-bold tracking-[0.22em] text-[#a096b7] uppercase">
        <span>THE ENGINE</span>
        <span className="hidden sm:inline">TRANSACTIONAL BILLING RUNS</span>
      </div>

      {/* Story Spread Body — maximalist stretched editorial composition */}
      <div className="relative z-10 flex w-full flex-1 flex-col justify-center gap-4 py-5 sm:gap-6 sm:py-8 lg:gap-8">
        {/* Massive display headline stretching across the spread */}
        <div className="flex items-end justify-between gap-6">
          <h2 className="display-stretch max-w-6xl">
            the heartbeat
            <br />
            of recurring
            <br />
            revenue. <em>never</em>
            <br />
            <em>billed twice.</em>
          </h2>
          <span
            aria-hidden="true"
            className="display-stretch text-hollow hidden shrink-0 select-none lg:block"
          >
            02
          </span>
        </div>

        {/* Offset narrative row — body pushed to the right like a footnote */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-10">
          <p className="eyebrow order-1 text-[11px] tracking-[0.28em] sm:text-xs lg:col-span-3">
            ATOMIC REVENUE
            <br />
            PIPELINE
          </p>
          <div className="order-2 lg:col-span-6 lg:col-start-6 xl:col-span-5 xl:col-start-7">
            <p className="spread-lead max-w-xl">
              At the heart of Cadence is an atomic invoicing engine designed to
              eliminate billing leakage. Powered by PostgreSQL transactions,
              catch-up loops for missed periods, dynamic line-item taxes, and
              auto-expiring discounts, every subscription is billed accurately
              on its exact cadence—daily, weekly, monthly, or yearly.
            </p>

            <button
              id="story-btn"
              onClick={() => onNavigate(2)}
              className="group mt-5 inline-flex items-center gap-3 text-sm font-semibold text-[#8978ff] transition hover:text-white sm:mt-7 sm:text-base cursor-pointer"
            >
              <span className="border-b border-[#8978ff]/50 pb-1 transition group-hover:border-white">
                Explore Core Modules
              </span>
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="curve-line curve-line-one pointer-events-none" />
      <div className="aurora-band" aria-hidden="true" />

      {/* Bottom Page Footer */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between border-t border-white/10 pt-4 text-xs sm:text-sm font-mono text-white/40 tracking-[0.15em] uppercase">
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
