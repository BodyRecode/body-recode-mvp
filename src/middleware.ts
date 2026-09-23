import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { isCoachEmail } from '@/lib/coach-auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { resolveTenantIdFromHost } from '@/lib/tenant-resolver'

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
   * 0. Resolve tenant from host. Sets x-tenant-id request header for
   *    downstream getTenant() lookups. Always safe — resolver returns
   *    'body-recode' for BR domains and unknown hosts.
   * ---------------------------------------------------------------- */
  const tenantId = resolveTenantIdFromHost(host)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-tenant-id', tenantId)
  // The dashboard layout enforces the product tier and needs to know which page
  // it is wrapping. A server component cannot read the pathname on its own, so
  // it comes down the same way the tenant id does. See src/lib/product-tier.ts.
  requestHeaders.set('x-pathname', pathname)

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
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  let response = NextResponse.next({ request: { headers: requestHeaders } })

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
  /* ----------------------------------------------------------------
   * 4a. Client ownership gate for /api/clients/<id>/*.
   *
   *     Added 17 September 2026. Forty-nine routes sit under a client id and
   *     each checked only "are you a coach", never "is this your client".
   *     Doing it here means a route added later is covered before anyone
   *     remembers to think about it, and a route that forgets cannot leak.
   *
   *     The owner passes straight through. Anyone else has to own the client.
   *     Answered from the database with the service role, because the clients
   *     policy would hide the very row being checked.
   * ---------------------------------------------------------------- */
  const clientApi = pathname.match(/^\/api\/clients\/([0-9a-fA-F-]{36})(\/|$)/)
  if (clientApi) {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }
    if (!isCoachEmail(user.email)) {
      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } },
      )
      const { data } = await admin
        .from('clients')
        .select('coach_id')
        .eq('id', clientApi[1])
        .maybeSingle()

      if (!data || data.coach_id !== user.id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
    }
  }

  /* ----------------------------------------------------------------
   * 4b. The same gate, for a client id carried in the BODY.
   *
   *     Added 22 September 2026, after a test that actually made the requests
   *     rather than reading the code for them. 4a above covers every operation
   *     that names the client in the ADDRESS, which is most of them and
   *     includes the co-pilot. It cannot fire for the ones that name the client
   *     in the body, because there is nothing in the path to match, and that is
   *     51 operations including GENERATING AND PUBLISHING SOMEBODY'S READ.
   *
   *     Done here rather than in 51 routes for the same reason 4a was: a route
   *     added next month is covered before anyone remembers to think about it,
   *     and a route that forgets cannot leak.
   *
   *     The body is read from a CLONE, so the route still gets its own copy.
   *     No client id in the body means there is nothing to check and the
   *     request passes, which is correct rather than lenient: this gate exists
   *     to answer "is this your client", not to police requests in general.
   * ---------------------------------------------------------------- */
  if (
    pathname.startsWith('/api/') &&
    !clientApi &&
    !pathname.startsWith('/api/portal/') &&
    !pathname.startsWith('/api/cron/') &&
    !pathname.startsWith('/api/webhooks/') &&
    (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') &&
    (request.headers.get('content-type') ?? '').includes('application/json') &&
    user &&
    !isCoachEmail(user.email)
  ) {
    let bodyClientId: string | null = null
    try {
      const body = await request.clone().json()
      const raw = body?.client_id ?? body?.clientId
      if (typeof raw === 'string' && /^[0-9a-fA-F-]{36}$/.test(raw)) bodyClientId = raw
    } catch {
      // Not JSON we can read, so there is nothing to check here. The route
      // will reject a malformed body on its own terms.
    }

    if (bodyClientId) {
      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } },
      )
      const { data } = await admin
        .from('clients')
        .select('coach_id')
        .eq('id', bodyClientId)
        .maybeSingle()

      if (!data || data.coach_id !== user.id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
    }
  }

  /* ----------------------------------------------------------------
   * 4c. The ended-and-frozen gate for /api/portal/*.
   *
   *     Added 23 September 2026. The portal PAGES were gated the same day, in
   *     their layout. The API was not: ZERO of the twenty-nine portal routes
   *     asked whether the engagement had ended, and they are not reading
   *     endpoints. They send a message to the coach, submit feedback, reschedule
   *     a session, submit a programme review, refer a friend, upload a
   *     clearance, accept an agreement. Three of them hand back the PDF of the
   *     read itself.
   *
   *     So a client who cancelled six months ago could still write into their
   *     old coach's system, and the only thing stopping them was the BAN on
   *     their login, which is the blunt instrument this pass exists to retire.
   *
   *     Done here for the same reason 4a and 4b are: a route added next month
   *     is covered before anyone remembers, and a route that forgets cannot
   *     leak. Twenty-two name the client in the body; three carry a portal
   *     token in the path. Both are resolved.
   *
   *     A COACH PASSES. The records are retained and they may need to read them.
   * ---------------------------------------------------------------- */
  if (pathname.startsWith('/api/portal/') && !isCoachEmail(user?.email)) {
    let clientRow: { ended_at: string | null; frozen_at: string | null } | null = null
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )

    // /api/portal/<token>/... — the PDF routes.
    const tokenPath = pathname.match(/^\/api\/portal\/([0-9a-fA-F-]{36})(\/|$)/)
    if (tokenPath) {
      const { data } = await admin
        .from('clients').select('ended_at, frozen_at')
        .eq('onboarding_token', tokenPath[1]).maybeSingle()
      clientRow = data ?? null
    } else if (
      (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') &&
      (request.headers.get('content-type') ?? '').includes('application/json')
    ) {
      try {
        const body = await request.clone().json()
        const raw = body?.client_id ?? body?.clientId
        if (typeof raw === 'string' && /^[0-9a-fA-F-]{36}$/.test(raw)) {
          const { data } = await admin
            .from('clients').select('ended_at, frozen_at').eq('id', raw).maybeSingle()
          clientRow = data ?? null
        }
      } catch {
        // Not JSON we can read. Nothing to check; the route rejects it itself.
      }
    }

    if (clientRow?.ended_at || clientRow?.frozen_at) {
      return NextResponse.json(
        { error: clientRow.ended_at ? 'This engagement has ended.' : 'This engagement is paused.' },
        { status: 403 },
      )
    }
  }

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
