import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getDefaultCoachId } from '@/lib/default-coach'
import { logLeadEvent } from '@/lib/log-lead-event'
import { fireTrigger } from '@/lib/automation-engine'
import { inngest } from '@/lib/inngest'
import { sendChallengeWelcomeEmail, sendCoachEnrollmentNotification } from '@/lib/challenge-welcome-email'
import { fireMetaCapiEvent, extractClientContext } from '@/lib/meta-capi'
import { reserveWaveSlot } from '@/lib/challenge-waves'
import { persistSmsOptIn } from '@/lib/speed-to-lead-sms'
import { brand } from "@/config/tenant";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { first_name, last_name, email, phone, gender, sms_opt_in, utm_source, utm_medium, utm_campaign, utm_content } = body as {
    first_name: string
    last_name?: string
    email: string
    phone: string
    gender?: string
    sms_opt_in?: boolean
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
    utm_content?: string
  }

  if (!first_name?.trim() || !last_name?.trim() || !email?.trim() || !phone?.trim()) {
    return NextResponse.json({ error: 'First name, last name, email and mobile number are required.' }, { status: 400 })
  }

  const fullName = `${first_name.trim()} ${last_name.trim()}`.replace(/\s+/g, ' ').trim()

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
    // Update name + phone + gender (overwrite if previously unset or different)
    await admin.from('leads').update({ name: fullName, phone: phone.trim(), gender: validGender }).eq('id', leadId)
  } else {
    const coachId = await getDefaultCoachId(admin)
    const { data: newLead, error: leadError } = await admin
      .from('leads')
      .insert({
        coach_id: coachId,
        name: fullName,
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        gender: validGender,
        source: utm_source === 'meta' ? 'meta' : 'other',
        source_detail: '14-day-body-decode-challenge',
        status: 'new_check_in',
        active: true,
        utm_source: utm_source ?? null,
        utm_medium: utm_medium ?? null,
        utm_campaign: utm_campaign ?? null,
        utm_content: utm_content ?? null,
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
    // Wave-tiered cap: reject new enrolments if the current wave is full.
    // Returning enrolees (above) bypass this — they're already in.
    const slot = await reserveWaveSlot(admin)
    if (!slot.ok) {
      return NextResponse.json({
        error: 'wave_full',
        message: `Wave ${slot.status.current.number} (${slot.status.current.label}) is full. Join the waitlist to be notified when the next wave opens.`,
        wave: slot.status.current.number,
        nextWave: slot.status.nextWave?.number ?? null,
      }, { status: 409 })
    }

    // Create new enrollment with wave assignment
    const { data: enrollment, error: enrollError } = await admin
      .from('challenge_enrollments')
      .insert({
        lead_id: leadId,
        enrolled_at: new Date().toISOString(),
        status: 'active',
        current_day: 1,
        wave: slot.wave,
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

    // Fire dedicated challenge sequence (coach notify + Day 5 session unlock + Day 14 ascension + SMS drip).
    // Welcome email is sent synchronously below — not via Inngest — so signup confirmation never
    // depends on the background pipeline.
    try {
      await inngest.send({
        name: 'challenge/enrolled',
        data: {
          leadId,
          token,
          email: email.toLowerCase().trim(),
          firstName: first_name.trim(),
          phone: phone.trim(),
        },
      })
    } catch (e) {
      console.error('[challenge/enroll] inngest.send failed:', e)
    }

    // Persist SMS opt-in for speed-to-lead pipeline. Silent-fail — enrolment
    // never depends on the SMS pipeline succeeding.
    if (sms_opt_in && phone?.trim()) {
      try {
        await persistSmsOptIn(leadId, phone.trim())
      } catch (smsErr) {
        console.error('[challenge/enroll] SMS opt-in persist failed:', smsErr)
      }
    }
  }

  const firstName = first_name.trim()
  const trimmedEmail = email.toLowerCase().trim()
  const trimmedPhone = phone.trim()
  const portalUrl = `${brand().marketingDomain}/challenge/${token}`

  const [welcome, coachNotify] = await Promise.all([
    sendChallengeWelcomeEmail({
      to: trimmedEmail,
      firstName,
      portalUrl,
      returning: isReturning,
    }),
    sendCoachEnrollmentNotification({
      firstName,
      email: trimmedEmail,
      phone: trimmedPhone,
      portalUrl,
      returning: isReturning,
    }),
  ])

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

  if (!coachNotify.ok) {
    console.error('[challenge/enroll] coach notification failed:', coachNotify.error)
  } else {
    await logLeadEvent({
      leadId,
      type: 'challenge_coach_notified',
      subject: isReturning ? 'Coach notified of re-signup' : 'Coach notified of new enrollment',
      notes: `Resend id: ${coachNotify.id ?? 'unknown'}. Returning: ${isReturning}.`,
    })
  }

  // Fire Meta Conversions API Lead event server-side. The Challenge enrolment
  // is the single highest-value cold-funnel conversion event: a real user has
  // handed over name + email + phone + gender and is now inside a 14-day
  // diagnostic. Once Challenge is live this is what Meta optimises on.
  // Non-blocking try/catch so any CAPI failure cannot break the user response.
  try {
    const { clientIp, clientUserAgent } = extractClientContext(request)
    const [enrollFirstName, ...enrollLastNameParts] = fullName.split(' ')
    const capiUserData = {
      email: trimmedEmail,
      phone: trimmedPhone,
      firstName: enrollFirstName,
      lastName: enrollLastNameParts.join(' ') || undefined,
      country: 'AU',
      clientIp,
      clientUserAgent,
    }
    const capiCustomData = {
      content_name: 'challenge_enrolled',
      content_category: gender || 'unknown',
      source: 'challenge_signup_form',
      returning: isReturning,
    }
    const capiSourceUrl = `${brand().marketingDomain}/challenge`
    // Fire BOTH events on enrolment:
    //   - Lead: the long-term optimisation event (the swap target).
    //   - CompleteRegistration: what the launched BR-FunnelB-Leads-2026Q3 ad
    //     set is actually optimising for. Meta locks an ad set's conversion
    //     event after publish, so instead of rebuilding the ad set (which
    //     resets learning) we fire the event Meta already wants. A Challenge
    //     enrolment IS a completed registration, so this is semantically true.
    // Both are the same enrolment action; firing both keeps the Lead-swap
    // option open without any Meta-side change.
    await fireMetaCapiEvent({
      eventName: 'Lead',
      eventSourceUrl: capiSourceUrl,
      actionSource: 'website',
      userData: capiUserData,
      customData: capiCustomData,
    })
    await fireMetaCapiEvent({
      eventName: 'CompleteRegistration',
      eventSourceUrl: capiSourceUrl,
      actionSource: 'website',
      userData: capiUserData,
      customData: capiCustomData,
    })
  } catch (capiErr) {
    console.error('[challenge/enroll] CAPI fire threw (non-fatal):', capiErr)
  }

  return NextResponse.json({ success: true, token, emailSent: welcome.ok, coachNotified: coachNotify.ok })
}
