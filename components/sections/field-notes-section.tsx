'use client'

import React from 'react'

interface NoteCard {
  number: string
  title: string
  description: string
  numberColor: string
  id?: string
}

const NOTE_CARDS: NoteCard[] = [
  {
    number: '01',
    title: 'state machine & plans',
    description:
      'Deterministic transitions from Draft to Active to Closed with auto-close, pause, and renewal rules.',
    numberColor: 'text-[#c5bdf5]',
    id: 'card-01-btn',
  },
  {
    number: '02',
    title: 'automated invoicing',
    description:
      'Batch billing runs with line-item taxes, usage-limited discounts, and multi-method payment tracking.',
    numberColor: 'text-[#b6c7ff]',
  },
  {
    number: '03',
    title: 'finance analytics & rbac',
    description:
      'Instant MRR normalization, overdue tracking, and sub-2s query speed across 5,000+ subscriptions.',
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
      <div className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between border-b border-white/10 pb-3 sm:pb-4 text-[11px] sm:text-sm font-bold tracking-[0.22em] text-[#a096b7] uppercase">
        <span>CORE CAPABILITIES</span>
        <span className="hidden sm:inline">SYSTEM MODULES</span>
      </div>
      <div className="streak-overlay" aria-hidden="true" />

      {/* Maximalist editorial rows */}
      <div className="relative z-10 flex w-full flex-1 flex-col justify-center gap-4 py-5 sm:gap-6 sm:py-8 lg:gap-8">
        <div className="flex items-end justify-between gap-6">
          <h2 className="display-stretch max-w-6xl">
            engineered for scale.
            <br />
            <em>built for precision.</em>
          </h2>
          <span
            aria-hidden="true"
            className="display-stretch text-hollow hidden shrink-0 select-none lg:block"
          >
            03
          </span>
        </div>

        {/* Full-width numbered rows — editorial index instead of card grid */}
        <div
          id="world-target"
          className="border-y border-white/10 divide-y divide-white/10"
        >
          {NOTE_CARDS.map((card) => (
            <article
              key={card.number}
              id={card.id}
              onClick={() => onNavigate(3)}
              className="spread-row group cursor-pointer grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 px-1 py-4 sm:gap-x-8 sm:py-6 lg:grid-cols-12 lg:items-center lg:gap-4"
            >
              <span
                className={`font-mono text-base font-semibold tracking-[0.14em] lg:col-span-2 ${card.numberColor}`}
              >
                {card.number}
              </span>

              <div className="min-w-0 lg:col-span-6 xl:col-span-5">
                <h3 className="text-xl leading-[1.05] tracking-[-0.03em] text-white sm:text-3xl lg:text-4xl xl:text-[2.75rem] lowercase">
                  {card.title}
                </h3>
              </div>

              <p className="col-span-2 max-w-lg text-xs leading-relaxed text-white/55 sm:text-sm sm:text-white/60 lg:col-span-4 lg:col-start-9 lg:text-base lg:leading-snug lg:text-right lg:text-white/70">
                {card.description}
              </p>
            </article>
          ))}
        </div>
      </div>

      {/* Bottom Page Footer */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between border-t border-white/10 pt-3 sm:pt-4 text-xs sm:text-sm font-mono text-white/40 tracking-[0.15em] uppercase">
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
      <div className="aurora-band" aria-hidden="true" />
    </section>
  )
}
