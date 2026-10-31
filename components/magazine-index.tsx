'use client'

import React, { useState } from 'react'
import { MAGAZINE_PAGES } from '@/constants/magazine'

interface MagazineIndexProps {
  currentPage: number
  onNavigate: (index: number) => void
}

export function MagazineIndex({ currentPage, onNavigate }: MagazineIndexProps) {
  const [isSideHovered, setIsSideHovered] = useState(false)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  return (
    <aside
      onMouseEnter={() => setIsSideHovered(true)}
      onMouseLeave={() => {
        setIsSideHovered(false)
        setHoveredIdx(null)
      }}
      className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex flex-col items-end gap-2.5 sm:gap-4 select-none py-8 pl-12 pr-3 sm:pr-6"
      aria-label="Magazine page index"
    >
      {MAGAZINE_PAGES.map((page, idx) => {
        const isCurrent = currentPage === idx
        const isHovered = hoveredIdx === idx
        // Show text label only when hovered on that side:
        // - If a specific dot is hovered, show that dot's label
        // - If that side is hovered generally, show the active page's label
        const showLabel = isSideHovered && (isHovered || (hoveredIdx === null && isCurrent))

        return (
          <button
            key={page.id}
            onClick={() => onNavigate(idx)}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            className="group flex items-center justify-end gap-3 text-right cursor-pointer py-1 pl-3 pr-1"
            title={`Turn to Page 0${idx + 1}: ${page.title}`}
            aria-label={`Turn to ${page.label}`}
          >
            <span
              className={`hidden md:inline-block text-[10px] font-mono tracking-[0.2em] uppercase transition-all duration-300 pointer-events-none ${
                showLabel
                  ? 'text-white opacity-100 translate-x-0'
                  : 'text-white/40 opacity-0 translate-x-2'
              } ${isCurrent ? 'font-bold' : 'font-medium'}`}
            >
              {page.label}
            </span>
            <span
              className={`rounded-full transition-all duration-300 ${
                isCurrent
                  ? 'size-2 sm:size-2.5 bg-[#9d88ff] shadow-[0_0_10px_#9d88ff]'
                  : 'size-1.5 bg-white/25 group-hover:bg-white/60 group-hover:scale-125'
              }`}
            />
          </button>
        )
      })}
    </aside>
  )
}
