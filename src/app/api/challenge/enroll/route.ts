import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logLeadEvent } from '@/lib/log-lead-event'
import { fireTrigger } from '@/lib/automation-engine'
import { inngest } from '@/lib/inngest'

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { first_name, email } = body as { first_name: string; email: string }

  if (!first_name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Find or create lead
  const { data: existingRows } = await admin
    .from('leads')
    .select('id')
    .eq('email', email.toLowerCase().trim())

  let leadId: string

  if (existingRows && existingRows.length > 0) {
    leadId = existingRows[0].id
  } else {
    const { data: newLead, error: leadError } = await admin
      .from('leads')
      .insert({
        name: first_name.trim(),
        email: email.toLowerCase().trim(),
        source: 'other',
        source_detail: '14-day-body-decode-challenge',
        status: 'new_check_in',
        active: true,
      })
      .select('id')
      .single()

    if (leadError || !newLead) {
      console.error('[challenge/enroll] Lead insert error:', leadError)
      return NextResponse.json({ error: 'Failed to create lead.' }, { status: 500 })
    }

    leadId = newLead.id
    await fireTrigger('lead_created', { leadId })
  }

  // Check if already enrolled in an active challenge
  const { data: existing } = await admin
    .from('challenge_enrollments')
    .select('id, token')
    .eq('lead_id', leadId)
    .eq('status', 'active')
    .maybeSingle()

  let token: string

  if (existing) {
    token = existing.token
  } else {
    // Create new enrollment
    const { data: enrollment, error: enrollError } = await admin
      .from('challenge_enrollments')
      .insert({
        lead_id: leadId,
        enrolled_at: new Date().toISOString(),
        status: 'active',
        current_day: 1,
      })
      .select('token')
      .single()

    if (enrollError || !enrollment) {
      console.error('[challenge/enroll] Enrollment insert error:', enrollError)
      return NextResponse.json({ error: 'Failed to create enrollment.' }, { status: 500 })
    }

    token = enrollment.token

    // Log the enrollment event
    await logLeadEvent({
      leadId,
      type: 'challenge_enrolled',
      subject: '14-Day Body Decode Challenge enrolled',
      notes: `Enrolled in 14-Day Body Decode Challenge. Token: ${token}`,
    })

    // Fire automation trigger for challenge welcome sequence
    await fireTrigger('form_submitted', { leadId }, { form: 'challenge_signup' })

    // Fire dedicated challenge sequence (welcome email + Day 5 Zoom + Day 14 ascension)
    try {
      await inngest.send({
        name: 'challenge/enrolled',
        data: {
          leadId,
          token,
          email: email.toLowerCase().trim(),
          firstName: first_name.trim().split(' ')[0],
        },
      })
    } catch (e) {
      console.error('[challenge/enroll] inngest.send failed:', e)
    }
  }

  return NextResponse.json({ success: true, token })
}
