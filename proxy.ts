import { NextResponse, type NextRequest } from 'next/server'
import { AUTH_COOKIE_NAME, verifySession, SessionPayload } from '@/lib/session'

// Role-aware route protection and defense-in-depth perimeter.
// Roles are enforced AGAIN inside every API route handler.

const AUTH_PAGES = ['/auth', '/login', '/sign-in', '/signup', '/forgot-password', '/reset-password']
const ADMIN_PREFIX = '/admin'
const PORTAL_PREFIX = '/portal'

function destination(role: SessionPayload['role']): string {
  if (role === 'ADMIN' || role === 'STAFF') return '/admin'
  if (role === 'CUSTOMER') return '/portal'
  return '/'
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value ?? ''
  const session = await verifySession(token)

  // 1) Admin studio: ADMIN + STAFF only
  if (pathname.startsWith(ADMIN_PREFIX)) {
    if (!session) {
      const url = new URL('/auth', request.url)
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }

    if (session.role === 'CUSTOMER') {
      // Customers cannot access the Admin Studio; redirect to their Portal
      return NextResponse.redirect(new URL('/portal', request.url))
    }

    // Authorized: attach session headers downstream
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', session.userId)
    requestHeaders.set('x-user-email', session.email)
    requestHeaders.set('x-user-role', session.role)
    if (session.customerId) {
      requestHeaders.set('x-customer-id', session.customerId)
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // 2) Customer portal: Authenticated users only
  if (pathname.startsWith(PORTAL_PREFIX)) {
    if (!session) {
      const url = new URL('/auth', request.url)
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }

    // Both CUSTOMER and ADMIN/STAFF can view the Customer Portal
    // (Admins/Staff can preview and manage customer experience)
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', session.userId)
    requestHeaders.set('x-user-email', session.email)
    requestHeaders.set('x-user-role', session.role)
    if (session.customerId) {
      requestHeaders.set('x-customer-id', session.customerId)
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // 3) Auth pages: always allow users to access the sign in / sign up page
  if (AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

// Named export for Next.js 16 Proxy + default export for compatibility
export default proxy

export const config = {
  matcher: [
    // Protect all application pages; skip API routes (which have apiHandler RBAC), static files and assets
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest|css|js|map)$).*)',
  ],
}
