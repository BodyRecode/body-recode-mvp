import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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
  let loginBanned = false
  try {
    const { data: client } = await admin.from('clients').select('email').eq('id', id).maybeSingle()
    if (client?.email) {
      const { data: users } = await admin.auth.admin.listUsers()
      const match = users?.users?.find(u => (u.email ?? '').toLowerCase() === client.email!.toLowerCase())
      if (match) {
        await admin.auth.admin.updateUserById(match.id, { ban_duration: '876000h' }) // 100 years
        loginBanned = true
      }
    }
  } catch (err) {
    console.error('[offboard] login ban failed:', err instanceof Error ? err.message : err)
  }
  result.steps.push({ step: 'Portal login banned', done: loginBanned, detail: loginBanned ? undefined : 'no auth account found' })

  return NextResponse.json(result)
}
