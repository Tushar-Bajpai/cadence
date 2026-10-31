'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'

interface JellyGuideProps {
  currentPage?: number
  className?: string
}

type PointDirection = 'left' | 'down-left' | 'down'

interface PageTargetConfig {
  page: number
  id: string
  name: string
  mode: 'side-left' | 'down-left'
}

const PAGE_TARGETS: PageTargetConfig[] = [
  { page: 0, id: 'hero-auth-btn', name: 'Portal Sign In', mode: 'side-left' },
  { page: 1, id: 'story-btn', name: 'Keep exploring', mode: 'side-left' },
  { page: 2, id: 'world-target', name: 'Field Notes', mode: 'down-left' },
  { page: 3, id: 'contact-btn', name: 'Say hello', mode: 'side-left' },
]

/**
 * Calculates layout-based un-transformed screen coordinates of an element,
 * completely immune to ongoing 3D CSS rotations on ancestor pages.
 */
function getTargetRect(el: HTMLElement) {
  let left = 0
  let top = 0
  let current: HTMLElement | null = el

  while (current && !current.classList.contains('magazine-viewport')) {
    left += current.offsetLeft
    top += current.offsetTop
    current = current.offsetParent as HTMLElement | null
  }

  const width = el.offsetWidth || el.clientWidth
  const height = el.offsetHeight || el.clientHeight

  if (width > 0 && height > 0 && (left > 0 || top > 0)) {
    return {
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
    }
  }

  return el.getBoundingClientRect()
}

export function JellyGuide({ currentPage = 0, className = '' }: JellyGuideProps) {
  const [pointDir, setPointDir] = useState<PointDirection>('left')
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isBlinking, setIsBlinking] = useState(false)
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 })
  const [isNearCursor, setIsNearCursor] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  const [isHovered, setIsHovered] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const coordsRef = useRef(coords)
  coordsRef.current = coords

  // Calculate exact position based on current active page target
  const updatePosition = useCallback(() => {
    if (typeof window === 'undefined') return
    const vw = window.innerWidth
    const vh = window.innerHeight

    // Hide Jelly mascot completely on mobile/touch screens (< 768px)
    if (vw < 768) {
      setIsVisible(false)
      return
    }

    const targetConfig = PAGE_TARGETS[currentPage] || PAGE_TARGETS[0]
    let el = document.getElementById(targetConfig.id)
    if (!el && currentPage === 0) {
      el = document.getElementById('hero-btn') || document.getElementById('hero-actions')
    }
    if (!el) return

    const rect = getTargetRect(el)

    if (targetConfig.mode === 'down-left') {
      // Section 3: Field Notes
      // Hover in the open space on the right, pointing down-left across all 3 cards
      setPointDir('down-left')
      setCoords({
        x: Math.max(16, Math.min(vw - 120, rect.right - 140)),
        y: Math.max(48, rect.top - 75),
      })
    } else {
      // Sections 0, 1, 3: Primary Buttons
      // Sit directly to the right of the button, pointing straight LEFT into it
      const minSpaceNeeded = 85
      const hasRightSpace = rect.right + minSpaceNeeded < vw

      if (hasRightSpace) {
        setPointDir('left')
        // Nest Jelly snugly right alongside the target button
        const xOffset = currentPage === 0 ? 6 : 8

        setCoords({
          x: rect.right + xOffset,
          y: Math.max(50, Math.min(vh - 120, rect.top + rect.height / 2 - 50)),
        })
      } else {
        // Fallback for very narrow screens: hover above and point down
        setPointDir('down')
        setCoords({
          x: Math.max(16, Math.min(vw - 85, rect.left + rect.width / 2 - 40)),
          y: Math.max(50, rect.top - 75),
        })
      }
    }

    setIsVisible(true)
  }, [currentPage])

  // Instant hardware-accelerated update on page change with zero frame polling
  useEffect(() => {
    updatePosition()

    // Micro-refinement once page CSS transition finishes (500ms)
    const settleTimer = setTimeout(() => {
      updatePosition()
    }, 520)

    const handleResize = () => updatePosition()
    window.addEventListener('resize', handleResize, { passive: true })

    return () => {
      clearTimeout(settleTimer)
      window.removeEventListener('resize', handleResize)
    }
  }, [currentPage, updatePosition])

  // Natural blinking timer
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true)
      setTimeout(() => setIsBlinking(false), 160)
    }, 3800)
    return () => clearInterval(blinkInterval)
  }, [])

  // Full-viewport smooth cursor tracking for eye gaze with zero distance cutoff
  useEffect(() => {
    let animFrame: number | null = null
    let idleTimer: NodeJS.Timeout | null = null

    const handleMouseMove = (e: MouseEvent) => {
      if (animFrame) return

      animFrame = requestAnimationFrame(() => {
        animFrame = null
        const centerX = coordsRef.current.x + 50
        const centerY = coordsRef.current.y + 50
        const dx = e.clientX - centerX
        const dy = e.clientY - centerY
        const dist = Math.hypot(dx, dy)

        setIsNearCursor(true)

        if (dist > 0.5) {
          const angle = Math.atan2(dy, dx)
          // Smooth travel scaling: gently dampens when cursor is right over his face
          const intensity = Math.min(1, Math.max(0.15, dist / 45))
          const maxTravelX = 3.6
          const maxTravelY = 2.8

          setMouseOffset({
            x: Math.cos(angle) * maxTravelX * intensity,
            y: Math.sin(angle) * maxTravelY * intensity,
          })
        }

        // Reset idle timer: if no movement for 6s, softly glance back to target button
        if (idleTimer) clearTimeout(idleTimer)
        idleTimer = setTimeout(() => {
          setIsNearCursor(false)
        }, 6000)
      })
    }

    const handleMouseLeave = () => {
      setIsNearCursor(false)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      if (animFrame) cancelAnimationFrame(animFrame)
      if (idleTimer) clearTimeout(idleTimer)
    }
  }, [])

  const handleMouseEnter = () => setIsHovered(true)
  const handleMouseLeave = () => setIsHovered(false)

  // Eye gaze direction based on real-time cursor tracking or target button fallback
  const getEyeOffsets = () => {
    if (isNearCursor) {
      return { x: mouseOffset.x, y: mouseOffset.y }
    }
    switch (pointDir) {
      case 'left':
        return { x: -3.4, y: 0.5 }
      case 'down-left':
        return { x: -2.6, y: 2.6 }
      case 'down':
        return { x: 0, y: 3.4 }
    }
  }

  const eyeOffset = getEyeOffsets()

  // Tilt angle based on pointing direction
  const getTiltClass = () => {
    switch (pointDir) {
      case 'left':
        return '-rotate-[8deg]'
      case 'down-left':
        return '-rotate-[15deg]'
      case 'down':
        return 'rotate-[2deg]'
    }
  }

  // Cosmic Violet palette (Permanent user default)
  const activePalette = {
    accent: '#9d88ff',
    bodyStart: '#dcd3ff',
    bodyMid: '#987eff',
    bodyDark: '#6041e6',
    bodyBottom: '#2d168d',
    caustic: '#ba9eff',
    sparkle: '#c5bdf5',
  }

  if (!isVisible) return null

  return (
    <div
      ref={containerRef}
      className={`hidden md:block fixed top-0 left-0 z-40 select-none pointer-events-none transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${className}`}
      style={{
        transform: `translate3d(${coords.x}px, ${coords.y}px, 0)`,
      }}
    >
      {/* Jelly Companion Character with Smooth Float & Eye Tracking */}
      <div
        className="relative flex flex-col items-center"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Jelly Body with Pointing Arm & Organic Floating */}
        <div
          className={`transition-transform duration-300 ${getTiltClass()} hover:scale-105 animate-[float-jelly_4s_ease-in-out_infinite]`}
          style={{ transformOrigin: 'bottom center' }}
        >
          <svg
            className="w-20 h-20 sm:w-28 sm:h-28 overflow-visible transition-transform duration-300"
            style={{
              filter: 'drop-shadow(0 8px 16px rgba(109, 40, 217, 0.3)) drop-shadow(0 4px 8px rgba(0,0,0,0.4))',
            }}
            viewBox="-20 5 165 125"
            fill="none"
          >
            <defs>
              {/* Gelatinous 3D Body Gradient */}
              <linearGradient
                id="jellyPointingBody"
                x1="70"
                y1="18"
                x2="70"
                y2="114"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#ded5ff" stopOpacity="0.95" />
                <stop offset="22%" stopColor="#a78bfa" stopOpacity="0.92" />
                <stop offset="65%" stopColor="#7c3aed" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#431497" stopOpacity="0.98" />
              </linearGradient>

              {/* Internal Bioluminescent Core Light */}
              <radialGradient id="jellyInnerCaustic" cx="50%" cy="80%" r="46%">
                <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.7" />
                <stop offset="48%" stopColor="#8b5cf6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>

              {/* Top Dome Specular Curved Gloss */}
              <linearGradient
                id="jellyDomeGloss"
                x1="50"
                y1="20"
                x2="88"
                y2="46"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                <stop offset="60%" stopColor="#ffffff" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>

              {/* Soft Airbrushed Blush Cheeks */}
              <radialGradient id="jellyBlushGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ff6584" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#ff859d" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#ff859d" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Plump, Bouncy Kawaii Jelly Body */}
            <path
              d={
                pointDir === 'down-left'
                  ? `M 70 20
                     C 88 20, 102 34, 104 50
                     C 112 54, 120 62, 120 72
                     C 120 80, 112 85, 104 84
                     C 100 98, 88 110, 70 110
                     C 52 110, 40 102, 36 94
                     C 28 98, 16 96, 10 88
                     C 4 80, 12 72, 26 70
                     C 33 68, 36 50, 36 50
                     C 38 34, 52 20, 70 20 Z`
                  : pointDir === 'down'
                  ? `M 70 20
                     C 88 20, 102 34, 104 50
                     C 110 56, 118 64, 116 76
                     C 114 86, 104 88, 98 86
                     C 94 100, 84 110, 70 110
                     C 56 110, 46 100, 42 86
                     C 36 88, 26 86, 24 76
                     C 22 64, 30 56, 36 50
                     C 36 50, 36 50, 36 50
                     C 38 34, 52 20, 70 20 Z`
                  : `M 70 20
                     C 88 20, 102 34, 104 50
                     C 112 54, 120 62, 120 72
                     C 120 80, 112 85, 104 84
                     C 100 98, 88 110, 70 110
                     C 52 110, 40 98, 36 84
                     C 25 85, 12 79, 7 72
                     C 2 64, 10 56, 25 56
                     C 33 56, 36 50, 36 50
                     C 38 34, 52 20, 70 20 Z`
              }
              fill="url(#jellyPointingBody)"
              stroke="rgba(255,255,255,0.48)"
              strokeWidth="1.6"
              className="transition-[d] duration-500 ease-out"
            />

            {/* Inner Bioluminescent Subsurface Core Glow */}
            <ellipse cx="70" cy="94" rx="32" ry="12" fill="url(#jellyInnerCaustic)" />

            {/* 3D Top Dome Curved Highlight */}
            <path
              d="M 50 25 C 58 22, 82 22, 90 25 C 85 31, 65 33, 50 25 Z"
              fill="url(#jellyDomeGloss)"
            />

            {/* Specular Glints (Clean organic curved 3D reflection) */}
            <ellipse cx="56" cy="35" rx="6.5" ry="3.2" transform="rotate(-22 56 35)" fill="#ffffff" opacity="0.65" />
            <circle cx="68" cy="32" r="1.8" fill="#ffffff" opacity="0.75" />

            {/* Subtle Arm Rim Highlights */}
            {pointDir === 'down-left' ? (
              <path
                d="M 24 71 C 16 75, 11 81, 12 87"
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />
            ) : pointDir === 'left' ? (
              <path
                d="M 22 57 C 14 58, 9 63, 9 70"
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />
            ) : (
              <path
                d="M 26 62 C 24 70, 28 78, 34 83"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />
            )}
            <path
              d="M 108 58 C 115 62, 118 67, 118 72"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />

            {/* Soft Rosy Blush Cheeks */}
            <ellipse cx="48" cy="74" rx="7" ry="5" fill="url(#jellyBlushGlow)" />
            <ellipse cx="92" cy="74" rx="7" ry="5" fill="url(#jellyBlushGlow)" />

            {/* Expressive Little Eyebrows */}
            <path
              d="M 52 57 Q 57 53, 62 56"
              stroke="#2e1065"
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
              opacity="0.65"
            />
            <path
              d="M 78 56 Q 83 53, 88 57"
              stroke="#2e1065"
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
              opacity="0.65"
            />

            {/* Expressive Anime Eyes with Cursor Eye Tracking */}
            <g transform={`translate(${eyeOffset.x}, ${eyeOffset.y})`}>
              {isBlinking ? (
                // Happy curved anime smiling eyes (◠ ◠) when blinking!
                <>
                  <path
                    d="M 51 67 Q 57 60, 63 67"
                    stroke="#160d3d"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M 77 67 Q 83 60, 89 67"
                    stroke="#160d3d"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    fill="none"
                  />
                </>
              ) : (
                // Big shiny Kawaii eyes with dual catchlights & iris glow
                <>
                  {/* Left Eye */}
                  <ellipse cx="57" cy="66" rx="5.2" ry="6.2" fill="#160d3d" />
                  <ellipse cx="57" cy="69" rx="3.2" ry="1.4" fill="#a78bfa" opacity="0.8" />
                  <circle cx="55.2" cy="63.8" r="2.2" fill="#ffffff" />
                  <circle cx="58.6" cy="67.5" r="1.1" fill="#ffffff" />

                  {/* Right Eye */}
                  <ellipse cx="83" cy="66" rx="5.2" ry="6.2" fill="#160d3d" />
                  <ellipse cx="83" cy="69" rx="3.2" ry="1.4" fill="#a78bfa" opacity="0.8" />
                  <circle cx="81.2" cy="63.8" r="2.2" fill="#ffffff" />
                  <circle cx="84.6" cy="67.5" r="1.1" fill="#ffffff" />
                </>
              )}
            </g>

            {/* Cheerful Kawaii Open Smile with Tongue */}
            <path
              d="M 66 73 Q 70 81, 74 73 Z"
              fill="#831843"
              stroke="#160d3d"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M 67.5 76 Q 70 79.2, 72.5 76 Q 70 74.5, 67.5 76 Z"
              fill="#f472b6"
            />
          </svg>
        </div>
      </div>

      <style jsx>{`
        @keyframes float-jelly {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }
      `}</style>
    </div>
  )
}
