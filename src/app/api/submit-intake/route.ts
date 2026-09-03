import { NextRequest, NextResponse } from 'next/server'
import { getTotalQuestions } from '@/lib/intake-questions'
import { Resend } from 'resend'
import { buildCoachNotificationEmail } from '@/lib/coach-notification-email'
import { buildPortalOrientationEmail } from '@/lib/portal-orientation-email'
import { logClientCommunication } from '@/lib/client-communications'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyOnboardingCompleteIfReady } from '@/lib/onboarding-complete-notification'
import { appUrl } from '@/lib/app-url'
import { fromCoach, fromBrand } from '@/lib/email-shell'
import { coach } from '@/config/tenant'

export const maxDuration = 300

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { token, formData } = body

  if (!token || !formData) {
    return NextResponse.json({ error: 'Missing token or form data' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Validate token. Reject if already complete.
  const { data: invitation, error: invErr } = await admin
    .from('intake_invitations')
    .select('*')
    .eq('token', token)
    .neq('status', 'complete')
    .single()

  if (invErr || !invitation) {
    return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 })
  }

  // Extract JSONB scale sections by question ID prefix
  function extractScale(prefix: string): Record<string, number> {
    const result: Record<string, number> = {}
    for (const [key, val] of Object.entries(formData)) {
      if (key.startsWith(prefix) && typeof val === 'number') {
        result[key] = val
      }
    }
    return result
  }

  const intakePayload = {
    client_id: invitation.client_id,
    invitation_id: invitation.id,
    schema_version: 'v2.0',
    // Identity
    full_name: (formData.full_name as string) || '',
    date_of_birth: (formData.date_of_birth as string) || '',
    gender: (formData.gender as string) || '',
    occupation: (formData.occupation as string) || '',
    mobile_number: (formData.mobile_number as string) || '',
    emergency_contact_name: (formData.emergency_contact_name as string) || '',
    emergency_contact_phone: (formData.emergency_contact_phone as string) || '',
    how_did_you_hear: (formData.how_did_you_hear as string) || '',
    // Scale sections as JSONB
    fat_map_responses: extractScale('fm_'),
    injury_responses: extractScale('inj_'),
    training_responses: extractScale('tr_'),
    nutrition_responses: extractScale('nut_'),
    schedule_responses: extractScale('sch_'),
    sleep_responses: extractScale('sl_'),
    stress_responses: extractScale('str_'),
    supplement_responses: extractScale('sup_'),
    // Injury special fields (multiselect + open text)
    injury_location_current: (formData.inj_21 as string[]) || [],
    injury_location_history: (formData.inj_22 as string[]) || [],
    // Schedule structured field (multiselect)
    training_days_available: (formData.sch_days as string[]) || [],
    injury_primary_concern: (formData.inj_23 as string) || '',
    injury_aggravating_movements: (formData.inj_24 as string) || '',
    // Dietary context (free-text answers from Section D - what the client
    // actually eats / cannot eat / will not eat / and their eating environment).
    // The nutrition + CFFS engines read these so the plan is adoptable, not
    // just doctrinally correct under their pattern profile.
    dietary_restrictions: (formData.dietary_restrictions as string) || '',
    dietary_preferences: (formData.dietary_preferences as string) || '',
    typical_day_eating: (formData.typical_day_eating as string) || '',
    meals_per_day: (formData.meals_per_day as string) || '',
    fluid_intake: (formData.fluid_intake as string) || '',
    caffeine_intake: (formData.caffeine_intake as string) || '',
    alcohol_intake: (formData.alcohol_intake as string) || '',
    eating_context: (formData.eating_context as string) || '',
    // Goals
    primary_goal: (formData.goal_primary as string) || '',
    secondary_goals: (formData.goal_secondary as string) || '',
    desired_timeline: (formData.goal_timeline as string) || '',
    subjective_motivator: (formData.goal_motivator as string) || '',
    // Final confirmation
    final_disclosure: (formData.final_disclosure as string) || '',
    final_system_alignment: Boolean(formData.final_system_alignment),
    final_accuracy: Boolean(formData.final_accuracy),
  }

  // Save intake
  const { data: intake, error: intakeError } = await admin
    .from('intakes')
    .insert(intakePayload)
    .select()
    .single()

  if (intakeError || !intake) {
    console.error('Intake insert error:', intakeError)
    return NextResponse.json({ error: 'Failed to save intake' }, { status: 500 })
  }

  // Mark invitation as complete
  await admin
    .from('intake_invitations')
    .update({ status: 'complete', completed_at: new Date().toISOString() })
    .eq('id', invitation.id)

  // Persist the client's medications statement to clients.medications so the
  // coach card on the profile is pre-filled. The field is longitudinal status
  // (lives on clients, not on the intake snapshot), so we write directly to
  // the source of truth. Coach can edit / add to it later as the regimen
  // changes. "None" or similar gets stored verbatim; the prompts ignore
  // strings with no clinically relevant content.
  const medicationsAnswer = typeof formData.medications === 'string'
    ? formData.medications.trim()
    : ''
  if (medicationsAnswer) {
    await admin
      .from('clients')
      .update({
        medications: medicationsAnswer,
        medications_updated_at: new Date().toISOString(),
      })
      .eq('id', invitation.client_id)
  }

  // Persist the client's mobile number to clients.phone so the weekly
  // check-in window SMS reminders (and any future SMS) have a number to send
  // to. The intake collects mobile_number into the intake snapshot, but the
  // crons read clients.phone — without this write the number is captured but
  // never usable, which is why most clients had no phone on file. Only write
  // when a value is present so we never blank out a number the coach already
  // entered manually on the profile.
  // Keep the canonical identity columns on `clients` in sync with whatever the
  // client confirmed/corrected in the intake. These are the single source of
  // truth the Health Declaration first populated; if the client edited a value
  // in the confirmation card, that correction propagates back here so the
  // record stays consistent. Only non-empty values are written so we never
  // blank out a detail the coach entered manually.
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
  const identityUpdate: Record<string, string> = {}
  if (str(formData.mobile_number)) identityUpdate.phone = str(formData.mobile_number)
  if (str(formData.date_of_birth)) identityUpdate.date_of_birth = str(formData.date_of_birth)
  if (str(formData.emergency_contact_name)) identityUpdate.emergency_contact_name = str(formData.emergency_contact_name)
  if (str(formData.emergency_contact_phone)) identityUpdate.emergency_contact_phone = str(formData.emergency_contact_phone)
  if (Object.keys(identityUpdate).length > 0) {
    await admin
      .from('clients')
      .update(identityUpdate)
      .eq('id', invitation.client_id)
  }

  // Branch on invitation.kind. First-time onboarding (kind='foundational')
  // fires the full sequence: coach "baseline is remaining" notification,
  // Portal Orientation to the client, and the onboarding-complete-if-ready
  // check. Re-intake (kind='reintake') is a reassessment for an existing
  // client, so it uses a different coach notification ("regenerate CFFS
  // from your dashboard") and skips Portal Orientation entirely — the
  // client already has portal orientation from months back and doesn't
  // need a duplicate welcome email.
  const isReintake = invitation.kind === 'reintake'

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const clientName = intake.full_name || 'A client'
    const baseUrl = appUrl()

    if (isReintake) {
      // Re-intake coach notification: signal the reassessment is in and the
      // next step is regenerating the CFFS from the newest intake row.
      await resend.emails.send({
        from: fromBrand(),
        to: coach().email,
        subject: `${clientName} submitted their re-intake`,
        html: buildCoachNotificationEmail({
          eyebrow: 'Re-intake · Reassessment',
          heading: `${clientName} submitted their re-intake`,
          body: `${clientName} has completed and submitted a fresh ${getTotalQuestions()}-question intake for reassessment. The intakes table now has a newer row that will be picked up on your next CFFS regenerate — head to the client profile and click Regenerate CFFS to run a fresh interpretation against the updated data. No new baseline or portal orientation was sent (existing client, existing portal).`,
          ctaLabel: 'Open client profile',
          ctaUrl: `${baseUrl}/dashboard/clients/${invitation.client_id}`,
          footnote: 'Next step: regenerate CFFS to inform the next training block.',
        }),
      })
      // Deliberately skip Portal Orientation email + onboarding-complete-if-ready
      // for re-intake — both are first-time-only flows.
    } else {
      // First-time onboarding notification. CFFS auto-generation was removed
      // 2026-05-13; the notifyOnboardingCompleteIfReady call further down
      // handles the "ready to generate" trigger once baseline is also in.
      await resend.emails.send({
        from: fromBrand(),
        to: coach().email,
        subject: `${clientName} submitted their intake`,
        html: buildCoachNotificationEmail({
          eyebrow: 'Foundational Intake',
          heading: `${clientName} submitted their intake`,
          body: `${clientName} has completed and submitted all ${getTotalQuestions()} questions of their foundational intake. Their baseline (measurements and front/side/back photos) is the remaining onboarding step. Once that lands you will receive a second email confirming the CFFS is ready to generate from your dashboard, and the Fat Map will read the photos as part of Spatial Patterning. The Portal Orientation email has been sent to them automatically so they can read through the portal while baseline is still outstanding.`,
          ctaLabel: 'Open client profile',
          ctaUrl: `${baseUrl}/dashboard/clients/${invitation.client_id}`,
          footnote: 'Their next portal task (Baseline Documentation) is now unlocked.',
        }),
      })

      // Send Portal Orientation to the client (first-time only — existing
      // clients doing a re-intake already have portal orientation from
      // months back and don't need a duplicate welcome email).
      const { data: clientRow } = await admin
        .from('clients')
        .select('email, name, onboarding_token')
        .eq('id', invitation.client_id)
        .maybeSingle()

      if (clientRow?.email && clientRow.onboarding_token) {
        const firstName = clientRow.name?.split(' ')[0] ?? 'there'
        const portalUrl = `${baseUrl}/portal/${clientRow.onboarding_token}`
        const { subject, html } = buildPortalOrientationEmail({ firstName, portalUrl })
        try {
          await resend.emails.send({
            from: fromCoach(),
            to: clientRow.email,
            subject,
            html,
          })
          await logClientCommunication(admin, {
            clientId: invitation.client_id,
            kind: 'portal_orientation',
            subject,
            toAddress: clientRow.email,
            meta: { trigger: 'intake_submission' },
          })
        } catch (e) {
          console.error('Portal orientation email failed:', e)
        }
      }
    }
  } catch (e) {
    console.error('Notification email failed:', e)
  }

  // Onboarding-complete-if-ready check only makes sense for first-time
  // intakes. Re-intake clients are already fully onboarded — this helper
  // would be a no-op or (worse) misinterpret the new intake row as a
  // trigger to re-fire onboarding sequencing.
  if (!isReintake) {
    await notifyOnboardingCompleteIfReady(admin, invitation.client_id, { trigger: 'intake' })
  }

  return NextResponse.json({ success: true, mode: isReintake ? 'reintake' : 'first_time' })
}
