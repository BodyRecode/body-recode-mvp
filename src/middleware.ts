import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  resolveSurface,
  isConsumerOnly,
  isIpOnly,
  firstSegment,
} from '@/lib/host'

const IP_HOST = 'bodyrecode.au'
const CONSUMER_HOST = 'performance.bodyrecode.au'

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const host = request.headers.get('host') || ''
  const surface = resolveSurface(host)
  const seg = firstSegment(pathname)

  /* ----------------------------------------------------------------
   * 1. www → apex redirect (production only)
   * ---------------------------------------------------------------- */
  if (host.toLowerCase() === `www.${IP_HOST}`) {
    const url = request.nextUrl.clone()
    url.host = IP_HOST
    return NextResponse.redirect(url, 308)
  }

  /* ----------------------------------------------------------------
   * 2. Subdomain routing (only on the two known production hosts).
   *    Localhost and preview deploys see everything.
   * ---------------------------------------------------------------- */

  // performance.bodyrecode.au: consumer arm
  if (surface === 'consumer') {
    // Block operator surfaces from leaking onto the consumer subdomain.
    if (isIpOnly(pathname)) {
      const url = request.nextUrl.clone()
      url.host = IP_HOST
      return NextResponse.redirect(url, 308)
    }

    // performance.bodyrecode.au/ → /performance-coaching (the consumer landing).
    if (pathname === '/' || pathname === '') {
      const url = request.nextUrl.clone()
      url.pathname = '/performance-coaching'
      return NextResponse.rewrite(url)
    }
  }

  // bodyrecode.au: parent IP / operator surface
  if (surface === 'ip') {
    // Send any consumer-only path to performance.bodyrecode.au with the same path.
    if (isConsumerOnly(pathname) && seg !== '') {
      const url = request.nextUrl.clone()
      url.host = CONSUMER_HOST
      // pathname + search preserved by NextURL
      return NextResponse.redirect(url, 308)
    }
  }

  /* ----------------------------------------------------------------
   * 3. Existing portal auth gate (unchanged)
   * ---------------------------------------------------------------- */
  if (
    pathname === '/portal/login' ||
    pathname.startsWith('/portal/auth')
  ) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/portal')) {
    let response = NextResponse.next({ request })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      const loginUrl = new URL('/portal/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    return response
  }

  // Touch search to keep TS happy (reserved for future use / observability hooks).
  void search

  return NextResponse.next()
}

export const config = {
  /**
   * Run on everything EXCEPT static assets and Next internals.
   * Host routing needs to see every page request.
   */
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo-teal.png|logo-black.png|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|otf|css|js|map)).*)',
  ],
}
