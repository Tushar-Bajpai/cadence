import { Analytics } from '@vercel/analytics/next'
import { Outfit } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import './globals.css'

// Brand display font for the landing page (geometric rounded sans,
// matches the lowercase wordmark style of the reference design).
const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-brand-outfit',
  display: 'swap',
})

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
    <html
      lang="en"
      className={outfit.variable}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
