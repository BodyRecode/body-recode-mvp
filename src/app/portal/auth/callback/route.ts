import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const redirect = searchParams.get('redirect')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

    if (sessionError || !session) {
      return NextResponse.redirect(new URL('/portal/login?error=session_failed', request.url))
    }

    // If a specific redirect was passed (e.g. a token URL), use it
    if (redirect && redirect.startsWith('/portal/')) {
      return NextResponse.redirect(new URL(redirect, request.url))
    }

    // Otherwise look up their portal token and redirect
    const userEmail = session.user.email ?? ''
    const admin = createAdminClient()
    const { data: client } = await admin
      .from('clients')
      .select('onboarding_token')
      .ilike('email', userEmail)
      .maybeSingle()

    if (client?.onboarding_token) {
      return NextResponse.redirect(new URL(`/portal/${client.onboarding_token}`, request.url))
    }

    return NextResponse.redirect(new URL(`/portal/login?error=no_client&email=${encodeURIComponent(userEmail)}`, request.url))
  }

  return NextResponse.redirect(new URL('/portal/login?error=no_code', request.url))
}
