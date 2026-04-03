import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fireTrigger } from '@/lib/automation-engine'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { name, email, phone } = body

  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Load funnel to get coach_id and redirect
  const { data: funnel } = await admin
    .from('be_funnels')
    .select('id, coach_id, be_funnel_pages(content)')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (!funnel) {
    return NextResponse.json({ error: 'Funnel not found' }, { status: 404 })
  }

  const pages = funnel.be_funnel_pages as Array<{ content: Record<string, string> }>
  const redirectTo = pages?.[0]?.content?.redirect_to ?? 'book'

  // Find or create lead
  const { data: existing } = await admin
    .from('leads')
    .select('id')
    .ilike('email', email.trim())
    .eq('coach_id', funnel.coach_id)
    .maybeSingle()

  let leadId: string

  if (existing) {
    leadId = existing.id
  } else {
    const { data: newLead, error } = await admin
      .from('leads')
      .insert({
        coach_id: funnel.coach_id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        source: 'funnel',
        status: 'new',
      })
      .select('id')
      .single()

    if (error || !newLead) {
      return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
    }

    leadId = newLead.id

    fireTrigger('lead_created', { leadId })
      .catch(err => console.error('Automation trigger failed:', err))
  }

  fireTrigger('form_submitted', { leadId, formId: id })
    .catch(err => console.error('Automation trigger failed:', err))

  const redirectUrl =
    redirectTo === 'book' ? '/book' :
    redirectTo === 'thank_you' ? null :
    redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`

  return NextResponse.json({ success: true, redirect: redirectUrl, leadId })
}
