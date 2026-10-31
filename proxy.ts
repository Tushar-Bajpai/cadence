import { NextResponse, type NextRequest } from 'next/server'
import { AUTH_COOKIE_NAME, verifySession, SessionPayload } from '@/lib/session'

// Role-aware route protection (runs before navigation).
// Roles are enforced AGAIN inside every API route — defense in depth.

const AUTH_PAGES = ['/auth', '/sign-in', '/signup', '/forgot-password', '/reset-password']
const ADMIN_PREFIX = '/admin'
const PORTAL_PREFIX = '/portal'

function destination(role: SessionPayload['role']): string {
  // Admin/staff dashboards live under /admin once Phase 3+ ships; the landing
  // magazine at "/" is the safe default for now.
  if (role === 'ADMIN' || role === 'STAFF') return '/admin'
  if (role === 'CUSTOMER') return '/portal'
  return '/'
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = await verifySession(
    request.cookies.get(AUTH_COOKIE_NAME)?.value ?? ''
  )

  // 1) Admin studio: ADMIN + STAFF only
  if (pathname.startsWith(ADMIN_PREFIX)) {
    if (!session) {
      const url = new URL('/auth', request.url)
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
    if (session.role === 'CUSTOMER') return NextResponse.redirect(new URL('/', request.url))
    return NextResponse.next()
  }

  // 2) Customer portal: CUSTOMER only
  if (pathname.startsWith(PORTAL_PREFIX)) {
    if (!session) {
      const url = new URL('/auth', request.url)
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
    if (session.role !== 'CUSTOMER') return NextResponse.redirect(new URL('/admin', request.url))
    return NextResponse.next()
  }

  // 3) Auth pages: signed-in users never see them again
  if (AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    if (session) return NextResponse.redirect(new URL(destination(session.role), request.url))
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip API routes, static assets and other app files
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest|css|js|map)$).*)',
  ],
}
