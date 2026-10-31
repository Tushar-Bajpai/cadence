import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import { TopLoadingBar } from '@/components/top-loading-bar'
import { DbKeepAlive } from '@/components/db-keep-alive'
import { DataSyncListener } from '@/components/data-sync-listener'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cadence — Subscription Management & Invoicing Engine',
  description:
    'Enterprise subscription lifecycle platform and automated billing engine built by CodeLifters. Idempotent invoicing, strict state machines, and sub-2s finance analytics.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="antialiased">
        <Suspense fallback={null}>
          <TopLoadingBar />
          <DbKeepAlive />
          <DataSyncListener />
        </Suspense>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
