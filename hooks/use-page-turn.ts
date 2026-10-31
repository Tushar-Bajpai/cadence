'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  TOTAL_PAGES,
  PAGE_TRANSITION_DURATION_MS,
  WHEEL_THRESHOLD,
  TOUCH_SWIPE_THRESHOLD,
} from '@/constants/magazine'

interface UsePageTurnOptions {
  totalPages?: number
  transitionDuration?: number
}

export function usePageTurn({
  totalPages = TOTAL_PAGES,
  transitionDuration = PAGE_TRANSITION_DURATION_MS,
}: UsePageTurnOptions = {}) {
  const [currentPage, setCurrentPage] = useState(0)
  const isAnimatingRef = useRef(false)
  const wheelAccumulatorRef = useRef(0)

  const goToPage = useCallback(
    (index: number) => {
      if (isAnimatingRef.current) return
      const target = Math.max(0, Math.min(totalPages - 1, index))
      if (target === currentPage) return

      isAnimatingRef.current = true
      setCurrentPage(target)

      setTimeout(() => {
        isAnimatingRef.current = false
        wheelAccumulatorRef.current = 0
      }, transitionDuration)
    },
    [currentPage, totalPages, transitionDuration]
  )

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1)
  }, [goToPage, currentPage])

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1)
  }, [goToPage, currentPage])

  // Wheel & Trackpad gesture handler with auto-decay
  useEffect(() => {
    let decayTimer: NodeJS.Timeout | null = null

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      if (isAnimatingRef.current) return

      wheelAccumulatorRef.current += e.deltaY

      if (decayTimer) clearTimeout(decayTimer)
      decayTimer = setTimeout(() => {
        wheelAccumulatorRef.current = 0
      }, 120)

      if (Math.abs(wheelAccumulatorRef.current) >= WHEEL_THRESHOLD) {
        if (decayTimer) clearTimeout(decayTimer)
        const direction = wheelAccumulatorRef.current > 0 ? 1 : -1
        wheelAccumulatorRef.current = 0
        goToPage(currentPage + direction)
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      window.removeEventListener('wheel', handleWheel)
      if (decayTimer) clearTimeout(decayTimer)
    }
  }, [currentPage, goToPage])

  // Keyboard navigation handler (Arrows, Space, PageUp/PageDown)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnimatingRef.current) return

      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault()
        goToPage(currentPage + 1)
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        goToPage(currentPage - 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentPage, goToPage])

  // Touch swipe support for mobile & tablet screens
  useEffect(() => {
    let startY = 0
    let startX = 0

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY
      startX = e.touches[0].clientX
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (isAnimatingRef.current) return
      const diffY = startY - e.changedTouches[0].clientY
      const diffX = startX - e.changedTouches[0].clientX

      // If user is swiping horizontally (e.g. through mobile card carousel), do not turn page
      if (Math.abs(diffX) > Math.abs(diffY)) return

      if (Math.abs(diffY) > TOUCH_SWIPE_THRESHOLD) {
        if (diffY > 0) {
          goToPage(currentPage + 1)
        } else {
          goToPage(currentPage - 1)
        }
      }
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [currentPage, goToPage])

  const getPageStateClass = useCallback(
    (pageIndex: number) => {
      if (pageIndex === currentPage) return 'page-state-active'
      if (pageIndex < currentPage) return 'page-state-prev'
      return 'page-state-next'
    },
    [currentPage]
  )

  return {
    currentPage,
    goToPage,
    nextPage,
    prevPage,
    getPageStateClass,
  }
}
