import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'
import { EQUIPMENT_LABELS, type EquipmentTag } from '@/lib/recovery-protocols-seed'

/**
 * PATCH the client's recovery equipment access list.
 * Body: { access: EquipmentTag[] }
 * Coach-authenticated.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!isCoachEmail((user.email ?? '').toLowerCase())) {
    return NextResponse.json({ error: 'Coach only' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const raw = body.access

  if (!Array.isArray(raw)) {
    return NextResponse.json({ error: 'access must be an array of equipment tags' }, { status: 400 })
  }

  const validTags = new Set<string>(Object.keys(EQUIPMENT_LABELS))
  const clean: EquipmentTag[] = []
  for (const t of raw) {
    if (typeof t !== 'string') continue
    if (!validTags.has(t)) continue
    if (!clean.includes(t as EquipmentTag)) clean.push(t as EquipmentTag)
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('clients')
    .update({ recovery_equipment_access: clean })
    .eq('id', id)

  if (error) {
    console.error('recovery access save error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, access: clean })
}
