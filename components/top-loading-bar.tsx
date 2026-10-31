'use client'

import React, { useEffect, useState, useTransition } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * TopLoadingBar renders a sleek, glowing progress bar at the very top
 * of the viewport. It triggers on:
 * 1. Next.js route / page transitions
 * 2. Window events 'cadence-loading-start' and 'cadence-loading-done'
 * 3. Any standard link click across the application
 */
export function TopLoadingBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  // Start progress animation
  const start = () => {
    setVisible(true)
    setLoading(true)
    setProgress(15)

    setTimeout(() => {
      setProgress((prev) => (prev < 65 ? 65 : prev))
    }, 150)

    setTimeout(() => {
      setProgress((prev) => (prev < 85 ? 85 : prev))
    }, 450)
  }
  // Complete progress animation
  const complete = () => {
    setProgress(100)
    setTimeout(() => {
      setVisible(false)
      setTimeout(() => {
        setProgress(0)
        setLoading(false)
      }, 300)
    }, 200)
  }

  // Trigger when route/searchParams change
  useEffect(() => {
    start()
    const timer = setTimeout(() => {
      complete()
    }, 250)
    return () => clearTimeout(timer)
  }, [pathname, searchParams])

  // Listen to manual start/done events from anywhere in the app
  useEffect(() => {
    const handleStart = () => start()
    const handleDone = () => complete()

    window.addEventListener('cadence-loading-start', handleStart)
    window.addEventListener('cadence-loading-done', handleDone)

    // Intercept clicks on links to start bar immediately
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a')
      if (
        target &&
        target.href &&
        target.href.startsWith(window.location.origin) &&
        !target.href.includes('#') &&
        target.target !== '_blank'
      ) {
        start()
      }
    }

    document.addEventListener('click', handleLinkClick, { capture: true })

    return () => {
      window.removeEventListener('cadence-loading-start', handleStart)
      window.removeEventListener('cadence-loading-done', handleDone)
      document.removeEventListener('click', handleLinkClick, { capture: true })
    }
  }, [])

  if (!visible && progress === 0) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
      aria-hidden="true"
    >
      {/* Top track */}
      <div
        className="h-[2.5px] bg-gradient-to-r from-[#8978ff] via-[#a89bff] to-[#cfc7ff] transition-all duration-300 ease-out shadow-[0_0_12px_rgba(137,120,255,0.8),0_0_20px_rgba(137,120,255,0.4)] relative"
        style={{
          width: `${progress}%`,
        }}
      >
        {/* Glowing leading pulse dot */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-2 bg-white rounded-full blur-[1px] shadow-[0_0_8px_#ffffff,0_0_15px_#8978ff]" />
      </div>
    </div>
  )
}
