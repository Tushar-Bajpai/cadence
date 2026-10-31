'use client'

import React from 'react'

interface NoteCard {
  number: string
  title: string
  description: string
  colorClass: string
  numberColor: string
  id?: string
}

const NOTE_CARDS: NoteCard[] = [
  {
    number: '01',
    title: 'State Machine & Plans',
    description: 'Deterministic transitions from Draft to Active to Closed with auto-close, pause, and renewal rules.',
    colorClass: 'world-glass-violet',
    numberColor: 'text-[#c5bdf5]',
    id: 'card-01-btn',
  },
  {
    number: '02',
    title: 'Automated Invoicing',
    description: 'Batch billing runs with line-item taxes, usage-limited discounts, and multi-method payment tracking.',
    colorClass: 'world-glass-blue',
    numberColor: 'text-[#b6c7ff]',
  },
  {
    number: '03',
    title: 'Finance Analytics & RBAC',
    description: 'Instant MRR normalization, overdue tracking, and sub-2s query speed across 5,000+ subscriptions.',
    colorClass: 'world-glass-ink',
    numberColor: 'text-[#9b8cff]',
  },
]

interface FieldNotesSectionProps {
  pageStateClass: string
  onNavigate: (index: number) => void
}

export function FieldNotesSection({ pageStateClass, onNavigate }: FieldNotesSectionProps) {
  return (
    <section
      id="world"
      className={`magazine-page ${pageStateClass} bg-[#120e25] flex flex-col justify-between px-4 py-4 sm:px-8 sm:py-5 lg:px-14`}
    >
      {/* Top Page Header */}
      <div className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between border-b border-white/10 pb-3 sm:pb-4 text-[10px] sm:text-xs font-bold tracking-[0.2em] text-[#a096b7] uppercase">
        <span>CORE CAPABILITIES</span>
        <span>SYSTEM MODULES</span>
      </div>

      {/* Field Notes Cards Grid */}
      <div className="relative z-10 mx-auto my-auto w-full max-w-7xl py-1 sm:py-2">
        <div className="mb-3 sm:mb-6 md:mb-10">
          <p className="eyebrow mb-1 text-[10px] tracking-[0.25em] sm:text-xs sm:mb-2 text-[#a79aff]">
            ENTERPRISE PLATFORM MODULES
          </p>
          <h2 className="text-2xl font-normal leading-[.92] tracking-[-0.085em] text-white sm:text-5xl lg:text-[4rem]">
            Engineered for scale.<br />
            <em>Built for precision.</em>
          </h2>
        </div>

        {/* Responsive Grid: Vertical Stack on Mobile, 3-Column Editorial Grid on Desktop */}
        <div
          id="world-target"
          className="grid grid-cols-1 gap-2.5 sm:gap-3.5 md:grid-cols-3 md:gap-5"
        >
          {NOTE_CARDS.map((card) => (
            <article
              key={card.number}
              id={card.id}
              onClick={() => onNavigate(3)}
              className={`world-glass-card ${card.colorClass} group cursor-pointer flex flex-col justify-between`}
            >
              {/* Card Content */}
              <div className="flex items-center gap-3.5 sm:gap-4 md:block md:w-full">
                <span className={`text-xs font-mono font-semibold tracking-[0.18em] shrink-0 ${card.numberColor}`}>
                  {card.number}
                </span>
                <div className="md:mt-6">
                  <h3 className="text-sm font-medium tracking-[-0.03em] text-white sm:text-base md:text-2xl md:font-normal md:tracking-[-0.04em] mb-0.5 md:mb-2">
                    {card.title}
                  </h3>
                  <p className="text-[11px] leading-relaxed text-white/65 sm:text-xs md:text-sm line-clamp-2 md:line-clamp-none max-w-[260px]">
                    {card.description}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Bottom Page Footer */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between border-t border-white/10 pt-3 sm:pt-4 text-[10px] sm:text-xs font-mono text-white/40 tracking-[0.15em] uppercase">
        <button
          onClick={() => onNavigate(1)}
          className="hover:text-white transition cursor-pointer"
        >
          ↑ PREV
        </button>
        <button
          onClick={() => onNavigate(3)}
          className="hover:text-white transition cursor-pointer"
        >
          NEXT ↓
        </button>
      </div>
    </section>
  )
}

