import { NextRequest, NextResponse } from 'next/server'
import { readUnsubscribeToken, suppressEmail } from '@/lib/unsubscribe'
import { appUrlFor } from '@/lib/app-url'

/**
 * RFC 8058 one-click unsubscribe target, referenced by the List-Unsubscribe
 * header on every marketing send.
 *
 * POST — what Gmail/Apple Mail call when someone taps their native
 * unsubscribe button. Must act immediately and must NOT require auth or a
 * confirmation step; that is the whole point of one-click. Always answers 200,
 * even on a bad token, because a provider treating this as a failure is worse
 * for deliverability than a no-op.
 *
 * GET — a human who reached the header URL directly. Send them to the
 * friendly page instead of silently unsubscribing on a link preview: some
 * corporate scanners follow GET links, and a scanner must never be able to
 * unsubscribe someone by accident. That is also why the destructive action
 * lives on POST only.
 */

export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') ?? ''
  const email = readUnsubscribeToken(token)

  if (!email) {
    console.warn('[unsubscribe] one-click POST with invalid token')
    return NextResponse.json({ ok: true })
  }

  try {
    await suppressEmail(email, 'unsubscribe_link', 'one-click header')
    console.log(`[unsubscribe] one-click suppressed ${email}`)
  } catch (e) {
    console.error('[unsubscribe] one-click suppression failed:', e)
  }

  return NextResponse.json({ ok: true })
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') ?? ''
  return NextResponse.redirect(appUrlFor(`/unsubscribe/${token}`))
}
