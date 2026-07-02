import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isCoachEmail } from '@/lib/coach-auth'
import { invalidateTenantCache } from '@/lib/tenant-resolver'

/**
 * POST /api/tenant/update
 * Body: { section: 'brand'|'coach'|'products'|'licence'|'modality', patch: object }
 *
 * Updates one section of the current coach's tenant_config row. Coach must
 * be authenticated + on the coach allowlist. Uses the authenticated Supabase
 * client so RLS enforces "coach_id = auth.uid()" — a coach can only update
 * their own row.
 *
 * On success: invalidates the in-memory tenant cache so subsequent
 * getTenant() calls return the fresh values.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isCoachEmail(user.email)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = (await req.json().catch(() => ({}))) as {
    section?: string
    patch?: Record<string, unknown>
  }

  const ALLOWED_SECTIONS = ['brand', 'coach', 'products', 'licence', 'modality'] as const
  type Section = typeof ALLOWED_SECTIONS[number]

  if (!body.section || !ALLOWED_SECTIONS.includes(body.section as Section)) {
    return NextResponse.json({ error: 'invalid section' }, { status: 400 })
  }
  if (!body.patch || typeof body.patch !== 'object') {
    return NextResponse.json({ error: 'patch required' }, { status: 400 })
  }

  // Fetch existing row + merge the patch into the section
  const { data: existing, error: fetchErr } = await supabase
    .from('tenant_config')
    .select('brand, coach, products, licence, modality')
    .eq('coach_id', user.id)
    .maybeSingle()

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }
  if (!existing) {
    return NextResponse.json({ error: 'no tenant config row for this coach' }, { status: 404 })
  }

  const currentSection = (existing as unknown as Record<string, Record<string, unknown>>)[body.section] ?? {}
  const merged = { ...currentSection, ...body.patch }

  const { error: updateErr } = await supabase
    .from('tenant_config')
    .update({ [body.section]: merged })
    .eq('coach_id', user.id)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  // Cache invalidation: clear the tenant_id-keyed cache so next getTenant() reads fresh
  const tenantId = (existing.licence as { tenantId?: string })?.tenantId
  if (tenantId) invalidateTenantCache(tenantId)

  return NextResponse.json({ ok: true, section: body.section, merged })
}
