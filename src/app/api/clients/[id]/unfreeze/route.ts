import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { unfreezeClient } from '@/lib/freeze-client'
import { isCoachUser, forbidden } from '@/lib/api-auth'

/**
 * Reverse a freeze. Coach-only. Restores portal access, removes the email
 * suppression, sets clients.active back to true. Does NOT touch Stripe: the
 * subscription was cancelled on freeze, and restarting billing is a considered
 * act (new payment link, fresh billing anchor) that the coach does in the
 * Stripe dashboard or via the subscription link flow.
 */
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const { id } = await ctx.params
  const admin = createAdminClient()
  const result = await unfreezeClient(admin, { clientId: id })

  if (!result.ok) return NextResponse.json({ error: result.error, steps: result.steps }, { status: 400 })
  return NextResponse.json(result)
}
