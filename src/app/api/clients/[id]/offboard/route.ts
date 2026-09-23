import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { findAuthUserByEmail } from '@/lib/auth-users'
import { offboardClient, type EndReason } from '@/lib/offboard-client'
import { isCoachUser, forbidden } from '@/lib/api-auth'

/**
 * End a coaching engagement. Coach-only, and deliberately not reversible from
 * the UI: rotating the token and suppressing the email are the point, and an
 * "undo" button would invite treating this as a soft toggle. Reinstating a
 * client is a considered act, so it is done in the database.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const { id } = await ctx.params
  const body = await req.json().catch(() => ({}))
  const { reason, notes } = body as { reason?: EndReason; notes?: string }

  if (!reason) {
    return NextResponse.json({ error: 'A reason is required. It is the only part of this a future you will care about.' }, { status: 400 })
  }
  if (reason === 'other' && (!notes || notes.trim().length < 10)) {
    return NextResponse.json({ error: '"Other" needs a note explaining what happened.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const result = await offboardClient(admin, { clientId: id, reason, notes, offboardedBy: user.id })

  if (!result.ok) return NextResponse.json({ error: result.error, steps: result.steps }, { status: 400 })

  // Ban the portal login. Separate from offboardClient because it touches
  // auth.users, which the admin client reaches through a different surface.
  //
  // 23 Sep 2026: this used to ask for ONE page of logins and never check
  // whether the request failed, so when the listing broke it reported "no auth
  // account found" and moved on. That reads like a fact and was a failure, and
  // it meant a client could be offboarded with their login left open.
  //
  // The ban is now a BACKSTOP rather than the gate: the portal checks ended_at
  // in its layout and in middleware for every API route. It stays because
  // every gate checked on 23 September turned out to be partially applied, and
  // a second line costs nothing.
  //
  let loginBanned = false
  let banDetail: string | undefined
  try {
    const { data: client } = await admin.from('clients').select('email').eq('id', id).maybeSingle()
    if (!client?.email) {
      banDetail = 'no email on file'
    } else {
      const match = await findAuthUserByEmail(admin, client.email)
      if (match) {
        await admin.auth.admin.updateUserById(match.id, { ban_duration: '876000h' }) // 100 years
        loginBanned = true
      } else {
        banDetail = 'they never made a portal login'
      }
    }
  } catch (err) {
    banDetail = err instanceof Error ? err.message : String(err)
    console.error('[offboard] login ban failed:', banDetail)
  }
  result.steps.push({ step: 'Portal login banned', done: loginBanned, detail: banDetail })

  return NextResponse.json(result)
}
