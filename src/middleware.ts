import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const APEX_HOST = 'bodyrecode.au'
const WWW_HOST = 'www.bodyrecode.au'

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
   * 2. Existing portal auth gate (unchanged)
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

  return NextResponse.next()
}

export const config = {
  // Run on every page request (skip Next internals and static assets).
  // Needed because the www -> apex redirect must be able to fire on any path.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|otf|css|js|map)).*)',
  ],
}
