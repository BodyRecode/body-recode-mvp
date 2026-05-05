import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ALLOWED_FIELDS = new Set([
  'cr_where_you_are',
  'cr_what_your_body_is_telling_us',
  'cr_what_were_focusing_on_first',
  'cr_what_were_not_doing_yet',
  'cr_coach_note',
  'cr_coach_guidance',
])

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { cffs_id, field, value } = await request.json()
  if (!cffs_id) {
    return NextResponse.json({ error: 'Missing cffs_id' }, { status: 400 })
  }
  if (typeof field !== 'string' || !ALLOWED_FIELDS.has(field)) {
    return NextResponse.json({ error: 'Invalid field' }, { status: 400 })
  }
  if (typeof value !== 'string' && value !== null) {
    return NextResponse.json({ error: 'Value must be a string or null' }, { status: 400 })
  }

  // Strip em dashes from any inline edits to honour the content rule.
  const cleaned = typeof value === 'string' ? value.replace(/—/g, ', ') : value

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('cffs')
    .update({ [field]: cleaned })
    .eq('id', cffs_id)
    .select(`id, ${field}`)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ cffs: data })
}
