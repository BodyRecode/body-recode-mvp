import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isCoachEmail } from '@/lib/coach-auth'

/**
 * Tenant domains CRUD. Coach can only see/edit their own via RLS.
 *
 *   GET    /api/tenant/domains         — list this coach's domains
 *   POST   /api/tenant/domains         — add {domain, is_primary?, notes?}
 *   DELETE /api/tenant/domains?id=...  — remove a domain by id
 *
 * The DB trigger normalises domains (strip protocol/www/trailing slash +
 * lowercase). Uniqueness is enforced at the SQL level.
 *
 * After a mutation, the response includes an `env_var_line` field with the
 * copy-paste value for NEXT_PUBLIC_TENANT_DOMAIN_MAP — Kade updates Vercel
 * env + redeploys for the change to take effect in edge middleware.
 */

async function envVarLine(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<string> {
  // Build the full env var line from the coach's active domains
  const { data } = await supabase
    .from('tenant_domains')
    .select('tenant_id, domain')
    .eq('coach_id', userId)
    .order('domain')
  const parts = (data ?? []).map((r) => `${r.domain}:${r.tenant_id}`)
  return parts.join(',')
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isCoachEmail(user.email)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('tenant_domains')
    .select('id, tenant_id, domain, is_primary, verified_at, notes, created_at, updated_at')
    .eq('coach_id', user.id)
    .order('is_primary', { ascending: false })
    .order('domain')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    domains: data ?? [],
    env_var_line: await envVarLine(supabase, user.id),
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isCoachEmail(user.email)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = (await req.json().catch(() => ({}))) as {
    domain?: string
    is_primary?: boolean
    notes?: string
  }

  if (!body.domain || typeof body.domain !== 'string') {
    return NextResponse.json({ error: 'domain required' }, { status: 400 })
  }

  // Fetch this coach's tenant_id from their tenant_config row
  const { data: tenant } = await supabase
    .from('tenant_config')
    .select('licence')
    .eq('coach_id', user.id)
    .maybeSingle()

  const tenantId = (tenant?.licence as { tenantId?: string })?.tenantId
  if (!tenantId) {
    return NextResponse.json({ error: 'no tenant_config row — set one up via /signup first' }, { status: 400 })
  }

  const { data: inserted, error } = await supabase
    .from('tenant_domains')
    .insert({
      tenant_id: tenantId,
      coach_id: user.id,
      domain: body.domain,
      is_primary: body.is_primary ?? false,
      notes: body.notes ?? null,
    })
    .select('id, domain, is_primary')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({
    ok: true,
    domain: inserted,
    env_var_line: await envVarLine(supabase, user.id),
  })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isCoachEmail(user.email)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase
    .from('tenant_domains')
    .delete()
    .eq('id', id)
    .eq('coach_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({
    ok: true,
    env_var_line: await envVarLine(supabase, user.id),
  })
}
