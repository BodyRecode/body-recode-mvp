import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const { token, consent_tier, signature_name } = await request.json()

  if (!token || !consent_tier || !signature_name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Fetch agreement by token
  const { data: agreement } = await admin
    .from('founding_client_agreements')
    .select('id, lead_id, client_id, status')
    .eq('token', token)
    .maybeSingle()

  if (!agreement) return NextResponse.json({ error: 'Agreement not found' }, { status: 404 })
  if (agreement.status === 'signed') return NextResponse.json({ error: 'Already signed' }, { status: 400 })

  const now = new Date().toISOString()

  // Sign the agreement
  await admin
    .from('founding_client_agreements')
    .update({
      consent_tier,
      signature_name,
      signed_at: now,
      status: 'signed',
    })
    .eq('id', agreement.id)

  // Direct entry path — client_id is set, no lead involved
  if (agreement.client_id) {
    await admin
      .from('clients')
      .update({
        consent_tier,
      })
      .eq('id', agreement.client_id)

    return NextResponse.json({ signed: true })
  }

  // Standard path — lead_id is set
  if (agreement.lead_id) {
    const { data: convertedLead } = await admin
      .from('leads')
      .select('converted_to_client_id, zoom2_trigger_type')
      .eq('id', agreement.lead_id)
      .maybeSingle()

    if (convertedLead?.converted_to_client_id) {
      await admin
        .from('clients')
        .update({
          is_founding_client: true,
          founding_client_trigger_type: convertedLead.zoom2_trigger_type,
          founding_client_start_date: now,
          consent_tier,
          founding_client_status: 'active',
        })
        .eq('id', convertedLead.converted_to_client_id)
    }
  }

  return NextResponse.json({ signed: true })
}
