import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logLeadEvent } from '@/lib/log-lead-event'
import { fireTrigger } from '@/lib/automation-engine'
import { inngest } from '@/lib/inngest'
import { sendChallengeWelcomeEmail } from '@/lib/challenge-welcome-email'

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { first_name, email, phone, gender } = body as {
    first_name: string
    email: string
    phone: string
    gender?: string
  }

  if (!first_name?.trim() || !email?.trim() || !phone?.trim()) {
    return NextResponse.json({ error: 'Name, email and mobile number are required.' }, { status: 400 })
  }

  const validGender = gender && ['male', 'female', 'prefer_not_to_say'].includes(gender)
    ? gender
    : null

  if (!validGender) {
    return NextResponse.json({ error: 'Biological sex is required for accurate pattern assignment.' }, { status: 400 })
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
    // Update phone + gender (overwrite if previously unset or different)
    await admin.from('leads').update({ phone: phone.trim(), gender: validGender }).eq('id', leadId)
  } else {
    const { data: newLead, error: leadError } = await admin
      .from('leads')
      .insert({
        name: first_name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        gender: validGender,
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
  let isReturning = false

  if (existing) {
    token = existing.token
    isReturning = true
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

    // Fire dedicated challenge sequence (coach notify + Day 5 Zoom + Day 14 ascension + SMS drip).
    // Welcome email is sent synchronously below — not via Inngest — so signup confirmation never
    // depends on the background pipeline.
    try {
      await inngest.send({
        name: 'challenge/enrolled',
        data: {
          leadId,
          token,
          email: email.toLowerCase().trim(),
          firstName: first_name.trim().split(' ')[0],
          phone: phone.trim(),
        },
      })
    } catch (e) {
      console.error('[challenge/enroll] inngest.send failed:', e)
    }
  }

  const firstName = first_name.trim().split(' ')[0]
  const portalUrl = `https://bodyrecode.au/challenge/${token}`
  const welcome = await sendChallengeWelcomeEmail({
    to: email.toLowerCase().trim(),
    firstName,
    portalUrl,
    returning: isReturning,
  })
  if (!welcome.ok) {
    console.error('[challenge/enroll] welcome email failed:', welcome.error)
  } else {
    await logLeadEvent({
      leadId,
      type: 'challenge_welcome_sent',
      subject: isReturning ? 'Challenge portal link re-sent' : 'Challenge welcome email sent',
      notes: `Resend id: ${welcome.id ?? 'unknown'}. Returning: ${isReturning}.`,
    })
  }

  return NextResponse.json({ success: true, token, emailSent: welcome.ok })
}
