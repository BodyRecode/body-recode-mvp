import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildCoachNotificationEmail } from '@/lib/coach-notification-email'
import { appUrl } from '@/lib/app-url'

export const maxDuration = 60

/**
 * Submission endpoint for the supplementary intake form.
 *
 * On a clean submit:
 *   1. Validate the token + invitation (must be kind='supplementary', status='pending').
 *   2. UPDATE the client's most recent intake row with the four dietary fields.
 *      No new intake row inserted - the supplementary intake is a top-up,
 *      not a replacement.
 *   3. UPDATE clients.medications + stamp clients.medications_updated_at (the
 *      medications field is longitudinal status on clients, not per-intake).
 *   4. Mark the invitation complete.
 *   5. Archive the active CFFS for this client and generate a new one against
 *      the updated intake + new medications context. This is the "auto
 *      regenerate CFFS" behaviour requested at design time.
 *   6. Notify Kade by email. The notification includes a deliberate flag that
 *      the Foundational Reading on the old CFFS is now archived - if Kade
 *      wants the FR republished, he needs to regenerate it from the new CFFS.
 *
 * If CFFS generation fails, the dietary + medication writes have already
 * succeeded; coach can manually regenerate the CFFS later. We do NOT roll
 * back the data writes on a CFFS failure.
 */
export async function POST(request: NextRequest) {
  const { token, formData } = await request.json()
  if (!token || !formData) {
    return NextResponse.json({ error: 'Missing token or formData' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 1. Validate invitation
  const { data: invitation, error: invErr } = await admin
    .from('intake_invitations')
    .select('id, client_id, status, kind')
    .eq('token', token)
    .eq('kind', 'supplementary')
    .neq('status', 'complete')
    .maybeSingle()

  if (invErr || !invitation) {
    return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 })
  }

  // 2. Find the most recent intake row to update
  const { data: latestIntake, error: intakeErr } = await admin
    .from('intakes')
    .select('id')
    .eq('client_id', invitation.client_id)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (intakeErr || !latestIntake) {
    return NextResponse.json(
      { error: 'No prior intake found for this client. Supplementary intakes update an existing intake; ask the client to complete the full intake first.' },
      { status: 400 }
    )
  }

  // 3. Update the intake row with the 8 dietary + consumption fields. If the
  // consumption columns (added 2026-06-03) don't exist yet (migration not
  // run), retry with only the original 4 dietary columns and continue —
  // medications + CFFS regen still get to run, which matters more for the
  // coaching flow than losing 4 free-text fields the coach can capture
  // manually. Mirrors the bridge-mode / doctrine-version graceful retry
  // pattern from generate-nutrition. Triggered by Amanda's 2026-06-09 submit
  // failure before the 2026-06-03 migration was run on prod.
  const dietaryFields = {
    dietary_restrictions: (formData.dietary_restrictions as string) || '',
    dietary_preferences: (formData.dietary_preferences as string) || '',
    typical_day_eating: (formData.typical_day_eating as string) || '',
    eating_context: (formData.eating_context as string) || '',
  }
  const consumptionFields = {
    meals_per_day: (formData.meals_per_day as string) || '',
    fluid_intake: (formData.fluid_intake as string) || '',
    caffeine_intake: (formData.caffeine_intake as string) || '',
    alcohol_intake: (formData.alcohol_intake as string) || '',
  }
  let updIntakeErr = (await admin
    .from('intakes')
    .update({ ...dietaryFields, ...consumptionFields })
    .eq('id', latestIntake.id)
  ).error
  let consumptionFieldsLost = false
  if (updIntakeErr && /column .* does not exist|meals_per_day|fluid_intake|caffeine_intake|alcohol_intake/i.test(updIntakeErr.message)) {
    console.warn('[submit-supplementary-intake] consumption columns missing — retrying with dietary fields only. Run sql/2026-06-03_intakes_consumption_detail.sql to enable persistence of meals_per_day / fluid_intake / caffeine_intake / alcohol_intake.')
    consumptionFieldsLost = true
    updIntakeErr = (await admin
      .from('intakes')
      .update(dietaryFields)
      .eq('id', latestIntake.id)
    ).error
  }

  if (updIntakeErr) {
    console.error('Update intake error:', updIntakeErr)
    return NextResponse.json({ error: 'Failed to save dietary answers' }, { status: 500 })
  }

  // 4. Update clients.medications + stamp updated_at (longitudinal field)
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

  // 5. Mark invitation complete
  await admin
    .from('intake_invitations')
    .update({ status: 'complete', completed_at: new Date().toISOString() })
    .eq('id', invitation.id)

  // 6. Notify Kade.
  //
  // 2026-06-21: CFFS is NOT auto-regenerated anymore. Prior behaviour
  // (auto-archive existing CFFS + draft a fresh one) was removed because
  // it surprised Kade — he wanted to see the supplementary first and
  // decide whether to refresh the CFFS. Now mirrors the Medications +
  // Dietary editors: a coach review action.
  //
  // The supplementary write IS still saved (dietary fields on intake +
  // medications on the client row); only the CFFS regen step is gated
  // on coach click. The client profile renders a "supplementary newer
  // than CFFS → Regenerate" banner inside the Foundational Synthesis
  // section, computed from `intake_invitations.completed_at` vs
  // `cffs.generated_at`.
  try {
    const { data: client } = await admin
      .from('clients')
      .select('name')
      .eq('id', invitation.client_id)
      .single()
    const clientName = client?.name ?? 'A client'
    const baseUrl = appUrl()

    const bodyLines: string[] = []
    bodyLines.push(`${clientName} just completed the supplementary intake. The dietary context fields are now on their intake row and any new medications have been written to their profile.`)
    if (consumptionFieldsLost) {
      bodyLines.push(`Heads up: the four consumption fields (meals_per_day, fluid_intake, caffeine_intake, alcohol_intake) were NOT saved because their database columns do not exist yet. Run sql/2026-06-03_intakes_consumption_detail.sql in Supabase to enable these, then ask ${clientName} to retake the supplementary so the consumption data lands. The dietary restrictions / preferences / typical day / eating context DID save.`)
    }
    bodyLines.push(`The CFFS has NOT been auto-regenerated. Open ${clientName}'s profile, review the updated dietary + medication context, then click Regenerate on the Foundational Synthesis panel when you're ready. Until you do, the existing CFFS (and any downstream program / nutrition / weekly synthesis) keeps running off the pre-update context.`)

    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Body Recode <kade@bodyrecode.au>',
      to: 'kade@bodyrecode.au',
      subject: `${clientName} completed the supplementary intake`,
      html: buildCoachNotificationEmail({
        eyebrow: 'Supplementary Intake',
        heading: `${clientName} completed the supplementary intake`,
        body: bodyLines.join('\n\n'),
        ctaLabel: 'Open client profile',
        ctaUrl: `${baseUrl}/dashboard/clients/${invitation.client_id}`,
        footnote: 'CFFS regeneration is a coach action. Trigger from the profile when ready.',
      }),
    })
  } catch (err) {
    console.error('Supplementary coach notification failed:', err)
  }

  return NextResponse.json({
    ok: true,
    cffsRegenerated: false,
    foundationalReadingArchived: false,
  })
}
