'use client'

import React from 'react'
import { usePageTurn } from '@/hooks/use-page-turn'
import {
  CoverSection,
  StorySection,
  FieldNotesSection,
  ContactSection,
} from '@/components/sections'
import { MagazineIndex } from '@/components/magazine-index'
import { JellyGuide } from '@/components/jelly-guide'

export default function Page() {
  const { currentPage, goToPage, getPageStateClass } = usePageTurn()

  return (
    <main className="magazine-viewport text-white select-none">
      {/* Ambient Gradient Theme Backdrop from reference Image 2 */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-45 mix-blend-screen bg-cover bg-center"
        style={{ backgroundImage: `url('/images/gradient-theme.jpg')` }}
        aria-hidden="true"
      />
      <div className="noise-overlay" aria-hidden="true" />
      <div className="magazine-spine" aria-hidden="true" />

      {/* Page 0: Cover / Hero Spread */}
      <CoverSection
        pageStateClass={getPageStateClass(0)}
        onNavigate={goToPage}
      />

      {/* Page 1: The Story Spread */}
      <StorySection
        pageStateClass={getPageStateClass(1)}
        onNavigate={goToPage}
      />

      {/* Page 2: Field Notes Spread */}
      <FieldNotesSection
        pageStateClass={getPageStateClass(2)}
        onNavigate={goToPage}
      />

      {/* Page 3: Back Cover / Contact & Colophon */}
      <ContactSection
        pageStateClass={getPageStateClass(3)}
        onNavigate={goToPage}
      />

      {/* Editorial Vertical Page Index Indicator */}
      <MagazineIndex
        currentPage={currentPage}
        onNavigate={goToPage}
      />

      {/* Interactive Violet Jelly Companion Guide */}
      <JellyGuide currentPage={currentPage} />
    </main>
  )
}
