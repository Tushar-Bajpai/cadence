'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { CadenceLogo } from '@/components/cadence-logo'

interface MagazineHeaderProps {
  onNavigate: (index: number) => void
}

export function MagazineHeader({ onNavigate }: MagazineHeaderProps) {
  const [open, setOpen] = useState(false)

  const handleNavClick = (pageIndex: number) => {
    setOpen(false)
    onNavigate(pageIndex)
  }

  return (
    <>
      <header className="relative z-30 mx-auto flex w-full max-w-7xl items-center justify-between border-b border-white/15 pb-5">
        <button
          onClick={() => handleNavClick(0)}
          className="flex items-center gap-2.5 text-sm font-semibold tracking-[0.16em] uppercase cursor-pointer"
        >
          <CadenceLogo className="size-8" />
          <span className="font-bold tracking-[0.18em]">Cadence</span>
        </button>

        <nav className="hidden items-center gap-8 text-xs font-medium tracking-[0.16em] text-white/70 uppercase md:ml-auto md:mr-10 md:flex">
          <button
            onClick={() => handleNavClick(1)}
            className="transition hover:text-white cursor-pointer"
          >
            Engine
          </button>
          <button
            onClick={() => handleNavClick(2)}
            className="transition hover:text-white cursor-pointer"
          >
            Modules
          </button>
          <button
            onClick={() => handleNavClick(3)}
            className="transition hover:text-white cursor-pointer"
          >
            Connect
          </button>
        </nav>

        <button
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          onClick={() => setOpen(!open)}
          className="rounded-full border border-white/20 p-2 text-white md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        <div className="hidden items-center gap-3 sm:flex">
          <Link
            href="/portal"
            className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold tracking-[0.12em] uppercase backdrop-blur-md transition hover:bg-white/15 text-white"
          >
            Customer Portal
          </Link>
          <Link
            href="/admin"
            className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold tracking-[0.12em] uppercase backdrop-blur-md transition hover:bg-white/15 text-white"
          >
            Admin Studio
          </Link>
          <Link
            href="/auth"
            className="rounded-full border border-[#8978ff]/30 bg-[#8978ff]/15 px-4 py-2 text-xs font-semibold tracking-[0.12em] uppercase backdrop-blur-md transition hover:bg-[#8978ff]/30 hover:border-[#8978ff]/60 text-white shadow-[0_0_15px_rgba(137,120,255,0.2)]"
          >
            Portal Sign In
          </Link>
        </div>
      </header>

      {open && (
        <div className="fixed inset-x-0 top-[68px] bottom-0 z-50 flex flex-col justify-start gap-6 border-b border-white/15 bg-[#0a072c]/98 p-6 backdrop-blur-2xl md:hidden animate-in fade-in duration-200">
          <nav className="flex flex-col gap-5 pt-4">
            <button
              className="text-left text-base font-medium tracking-[0.16em] text-white/80 transition hover:text-white uppercase"
              onClick={() => handleNavClick(1)}
            >
              Engine
            </button>
            <button
              className="text-left text-base font-medium tracking-[0.16em] text-white/80 transition hover:text-white uppercase"
              onClick={() => handleNavClick(2)}
            >
              Modules
            </button>
            <button
              className="text-left text-base font-medium tracking-[0.16em] text-white/80 transition hover:text-white uppercase"
              onClick={() => handleNavClick(3)}
            >
              Connect
            </button>
          </nav>
          <div className="mt-2 flex flex-col gap-2.5">
            <Link
              href="/portal"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-3 text-xs font-semibold tracking-[0.12em] uppercase text-white transition hover:bg-white/10"
            >
              Customer Portal
            </Link>
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-3 text-xs font-semibold tracking-[0.12em] uppercase text-white transition hover:bg-white/10"
            >
              Admin Studio
            </Link>
            <Link
              href="/auth"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#8978ff] px-5 py-3 text-xs font-semibold tracking-[0.12em] uppercase text-white shadow-[0_5px_20px_rgba(137,120,255,0.4)] transition hover:bg-[#9b8cff]"
            >
              Portal Sign In
            </Link>
          </div>
        </div>
      )}
    </>
  )
}

