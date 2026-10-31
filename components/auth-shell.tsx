import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CadenceLogo } from '@/components/cadence-logo'
import type { ReactNode } from 'react'

// Shared shell for the auth-family pages (auth, forgot-password, reset-password).
// Matches the Cadence editorial system: dark void, violet ambience, mono labels.
export function AuthShell({
  children,
}: {
  children: ReactNode
}) {
  return (
    <main className="relative min-h-[100dvh] w-full overflow-y-auto bg-[#05051a] text-white flex flex-col justify-between p-4 sm:p-8">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none opacity-40 [background-image:radial-gradient(circle_at_50%_15%,rgba(92,75,255,0.4),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(65,45,190,0.25),transparent_50%)]" />

      {/* Top Header */}
      <header className="relative z-20 mx-auto flex w-full max-w-5xl items-center justify-between pb-6 border-b border-white/10">
        <Link
          href="/auth"
          className="group inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-white/50 transition hover:text-white"
        >
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-1" />
          <span>Sign in</span>
        </Link>

        <div className="flex items-center gap-2">
          <CadenceLogo className="size-6" />
          <span className="text-xs font-semibold tracking-[0.24em] text-white/90 uppercase">
            Cadence • CodeLifters
          </span>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 mx-auto my-auto w-full max-w-md py-6 sm:py-10">
        {children}
      </div>

      {/* Clean Minimal Footer */}
      <footer className="relative z-20 mx-auto flex w-full max-w-5xl items-center justify-between pt-6 border-t border-white/10 text-[10px] font-mono uppercase tracking-[0.16em] text-white/40">
        <span>Cadence by CodeLifters</span>
        <span>© 2026</span>
      </footer>
    </main>
  )
}
