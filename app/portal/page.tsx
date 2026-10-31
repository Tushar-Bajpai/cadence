import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { SignOutButton } from '@/components/sign-out-button'
import { redirect } from 'next/navigation'

// Placeholder shell for the Customer portal. Portal features ship in Phase 8 —
// this page exists so role gating is demonstrable now.
export default async function PortalPlaceholderPage() {
  const session = await getSession()

  if (!session) redirect('/auth?next=/portal')
  if (session.role !== 'CUSTOMER') redirect('/admin')

  return (
    <main className="relative min-h-[100dvh] w-full overflow-y-auto bg-[#05051a] text-white">
      <div className="absolute inset-0 pointer-events-none opacity-40 [background-image:radial-gradient(circle_at_50%_0%,rgba(92,75,255,0.35),transparent_40%)]" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-8">
        <Link
          href="/"
          className="text-xs font-mono uppercase tracking-[0.18em] text-white/50 transition hover:text-white"
        >
          Cadence
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/70">{session.name}</span>
          <SignOutButton />
        </div>
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center justify-center px-4 py-28 text-center sm:px-8">
        <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/40">
          Customer Portal
        </p>
        <h1 className="mt-3 text-3xl font-normal tracking-[-0.03em] text-white sm:text-5xl">
          Hello,{' '}
          <em className="italic text-[#8978ff]">{session.name.split(' ')[0]}.</em>
        </h1>
        <p className="mt-4 max-w-md text-sm text-white/50">
          Your subscriptions, invoices and payments appear here once the portal
          phase ships. You are signed in as a customer.
        </p>
      </div>
    </main>
  )
}
