import { MagazinePage } from '@/types/magazine'

export const MAGAZINE_PAGES: MagazinePage[] = [
  { id: 'hero', label: 'OVERVIEW', title: 'Cadence — Subscription Engine' },
  { id: 'story', label: 'ENGINE', title: 'Transactional Billing & Invoicing' },
  { id: 'world', label: 'MODULES', title: 'Lifecycle & System Pillars' },
  { id: 'contact', label: 'CONNECT', title: 'Access Cadence by CodeLifters' },
]

export const TOTAL_PAGES = MAGAZINE_PAGES.length
export const PAGE_TRANSITION_DURATION_MS = 500
export const WHEEL_THRESHOLD = 25
export const TOUCH_SWIPE_THRESHOLD = 30
