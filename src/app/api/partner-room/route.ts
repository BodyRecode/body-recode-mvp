import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { partnerRoomUrl } from '@/lib/app-url'
import { isCoachUser, forbidden } from '@/lib/api-auth'

/**
 * Mint a new Partner Room guest link. Coach-only (must be logged in).
 * The DB mints the token on insert, so we just insert name/company/note and
 * read the row back to build the shareable link.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  if (!(await isCoachUser(user))) return forbidden()

  const body = await request.json().catch(() => ({}))
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const company = typeof body.company === 'string' ? body.company.trim() : ''
  const note = typeof body.note === 'string' ? body.note.trim() : ''

  if (!name) {
    return NextResponse.json({ error: 'A name is required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('partner_rooms')
    .insert({
      name,
      company: company || null,
      note: note || null,
    })
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Failed to create room' }, { status: 500 })
  }

  return NextResponse.json({ ...data, url: partnerRoomUrl(data.token) })
}
