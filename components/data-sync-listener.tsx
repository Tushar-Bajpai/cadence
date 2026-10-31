'use client'

import { useEffect } from 'react'

const SYNC_EVENT = 'cadence:data-changed'
const SYNC_STORAGE_KEY = 'cadence:data-changed-at'
const EXCLUDED_PREFIXES = ['/api/auth', '/api/keep-alive']

function isMutation(input: RequestInfo | URL, init?: RequestInit): boolean {
  const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase()
  return !['GET', 'HEAD', 'OPTIONS'].includes(method)
}

function getPath(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.pathname
  return new URL(input.url, window.location.origin).pathname
}

export function DataSyncListener() {
  useEffect(() => {
    let reloadTimer: ReturnType<typeof setTimeout> | null = null
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('cadence-data-sync') : null

    const reloadAfterChange = () => {
      if (reloadTimer) return
      reloadTimer = setTimeout(() => window.location.reload(), 500)
    }

    const handleChange = () => reloadAfterChange()
    const handleStorage = (event: StorageEvent) => {
      if (event.key === SYNC_STORAGE_KEY) handleChange()
    }

    channel?.addEventListener('message', handleChange)
    window.addEventListener(SYNC_EVENT, handleChange)
    window.addEventListener('storage', handleStorage)

    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const response = await originalFetch(...args)
      const [input, init] = args
      const path = getPath(input)
      if (response.ok && isMutation(input, init) && path.startsWith('/api/') &&
        !EXCLUDED_PREFIXES.some((prefix) => path.startsWith(prefix))) {
        const timestamp = String(Date.now())
        window.localStorage.setItem(SYNC_STORAGE_KEY, timestamp)
        channel?.postMessage(timestamp)
      }
      return response
    }

    return () => {
      window.fetch = originalFetch
      channel?.removeEventListener('message', handleChange)
      channel?.close()
      window.removeEventListener(SYNC_EVENT, handleChange)
      window.removeEventListener('storage', handleStorage)
      if (reloadTimer) clearTimeout(reloadTimer)
    }
  }, [])

  return null
}
