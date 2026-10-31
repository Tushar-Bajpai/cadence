'use client'

import { useEffect, useRef } from 'react'

// Ping interval: 3.5 minutes (210,000 ms)
// Neon Serverless PostgreSQL enters cold sleep after 5 minutes (300,000 ms) of query inactivity.
// Pinging at 3.5 minutes prevents cold sleep indefinitely while any browser tab or server is open.
const KEEP_ALIVE_INTERVAL_MS = 3.5 * 60 * 1000
const MAX_STALE_BEFORE_PING_MS = 3 * 60 * 1000

export function DbKeepAlive() {
  const lastPingTimeRef = useRef<number>(Date.now())
  const isPingingRef = useRef<boolean>(false)

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null
    const abortController = new AbortController()

    const sendKeepAlivePing = async () => {
      if (isPingingRef.current) return
      isPingingRef.current = true

      try {
        const res = await fetch('/api/keep-alive', {
          method: 'GET',
          cache: 'no-store',
          signal: abortController.signal,
          headers: {
            'x-cadence-keepalive': 'true',
          },
        })

        if (res.ok) {
          lastPingTimeRef.current = Date.now()
        }
      } catch (err: any) {
        // Silent failure — keep-alive runs opportunistically in the background
        if (err?.name !== 'AbortError') {
          // Ignore network or timeout blips
        }
      } finally {
        isPingingRef.current = false
      }
    }
    // 1. Initial warm-up ping 1.2s after mount (does not delay initial page load)
    const initialDelay = setTimeout(() => {
      sendKeepAlivePing()
    }, 1200)

    // 2. Periodic interval ping every 3.5 minutes
    timer = setInterval(() => {
      sendKeepAlivePing()
    }, KEEP_ALIVE_INTERVAL_MS)

    // 3. Wakes database up immediately if the user returns to this tab after inactivity
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const elapsedSinceLastPing = Date.now() - lastPingTimeRef.current
        if (elapsedSinceLastPing >= MAX_STALE_BEFORE_PING_MS) {
          sendKeepAlivePing()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearTimeout(initialDelay)
      if (timer) clearInterval(timer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      abortController.abort()
    }
  }, [])

  return null
}
