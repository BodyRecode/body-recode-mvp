import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const APEX_HOST = 'bodyrecode.au'
const WWW_HOST = 'www.bodyrecode.au'

// API prefixes that authenticate via their own mechanism (cron secret, webhook
// signature, Inngest signing key) and must not run the Supabase cookie refresh.
const SKIP_AUTH_REFRESH_API = [
  '/api/auth',
  '/api/webhooks',
  '/api/cron',
  '/api/inngest',
  '/api/inbox/inbound',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = (request.headers.get('host') || '').toLowerCase().split(':')[0]

  /* ----------------------------------------------------------------
   * 1. www.bodyrecode.au → apex (production only)
   * ---------------------------------------------------------------- */
  if (host === WWW_HOST) {
    const url = request.nextUrl.clone()
    url.host = APEX_HOST
    return NextResponse.redirect(url, 308)
  }

  /* ----------------------------------------------------------------
   * 2. Public portal auth pages — no refresh needed
   * ---------------------------------------------------------------- */
  if (
    pathname === '/portal/login' ||
    pathname.startsWith('/portal/auth')
  ) {
    return NextResponse.next()
  }

  /* ----------------------------------------------------------------
   * 3. Decide whether this request needs a Supabase cookie refresh.
   *    The refresh keeps the short-lived access token alive so that
   *    client-side `fetch()` calls from coach + portal UIs don't hit
   *    401 after the token TTL elapses while the page is open.
   * ---------------------------------------------------------------- */
  const isApi = pathname.startsWith('/api')
  const isSkippedApi =
    isApi && SKIP_AUTH_REFRESH_API.some((p) => pathname.startsWith(p))

  const needsAuthRefresh =
    pathname.startsWith('/portal') ||
    pathname.startsWith('/dashboard') ||
    (isApi && !isSkippedApi)

  if (!needsAuthRefresh) {
    return NextResponse.next()
  }

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

  // Calling getUser() server-side is what triggers @supabase/ssr to mint a
  // fresh access token from the refresh token and write it back to cookies.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  /* ----------------------------------------------------------------
   * 4. Portal auth gate (unchanged behaviour: redirect anon → login).
   *    /dashboard is gated by its layout server component, and /api is
   *    gated per-route, so middleware only needs to refresh the cookie
   *    for those — not redirect.
   * ---------------------------------------------------------------- */
  if (pathname.startsWith('/portal') && !user) {
    const loginUrl = new URL('/portal/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  // Run on every page request (skip Next internals and static assets).
  // Needed because the www -> apex redirect must be able to fire on any path.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|otf|css|js|map)).*)',
  ],
}
