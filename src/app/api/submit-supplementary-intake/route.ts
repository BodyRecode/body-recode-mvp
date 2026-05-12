import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildCFFSSystemPrompt, buildCFFSUserPrompt } from '@/lib/cffs-prompt'
import { buildCoachNotificationEmail } from '@/lib/coach-notification-email'

export const maxDuration = 300

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 5 })

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

  // 3. Update the intake row with the four dietary fields
  const { error: updIntakeErr } = await admin
    .from('intakes')
    .update({
      dietary_restrictions: (formData.dietary_restrictions as string) || '',
      dietary_preferences: (formData.dietary_preferences as string) || '',
      typical_day_eating: (formData.typical_day_eating as string) || '',
      eating_context: (formData.eating_context as string) || '',
    })
    .eq('id', latestIntake.id)

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

  // 6. Auto-regenerate CFFS. The intake is now updated with dietary context;
  //    clients.medications is fresh. Pull the full intake row + medications
  //    and pass to the existing CFFS prompt. Archive the active CFFS first.
  let cffsRegeneratedAt: string | null = null
  let foundationalReadingArchived = false
  try {
    const [{ data: fullIntake }, { data: clientRow }] = await Promise.all([
      admin.from('intakes').select('*').eq('id', latestIntake.id).single(),
      admin.from('clients').select('medications').eq('id', invitation.client_id).single(),
    ])

    if (fullIntake) {
      // Detect whether the soon-to-be-archived CFFS had a published Foundational
      // Reading. If so, flag it in the coach notification so Kade knows to
      // regenerate it (otherwise the client portal won't have a reading until
      // he does).
      const { data: existingCffs } = await admin
        .from('cffs')
        .select('client_reading_published_at')
        .eq('client_id', invitation.client_id)
        .eq('is_archived', false)
        .maybeSingle()
      foundationalReadingArchived = !!existingCffs?.client_reading_published_at

      // Archive existing CFFS
      await admin
        .from('cffs')
        .update({ is_archived: true })
        .eq('client_id', invitation.client_id)
        .eq('is_archived', false)

      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 6000,
        system: buildCFFSSystemPrompt(),
        messages: [{
          role: 'user',
          content: buildCFFSUserPrompt(fullIntake, clientRow?.medications ?? null),
        }],
      })

      const content = message.content[0]
      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const cffsData = JSON.parse(jsonMatch[0]) as Record<string, unknown>
          cffsData.reassessment_flagged = false
          // Strip em dashes from every string field (style rule)
          const stripped = stripEmDashes(cffsData)
          await admin.from('cffs').insert({
            client_id: invitation.client_id,
            intake_id: latestIntake.id,
            ...(stripped as Record<string, unknown>),
          })
          cffsRegeneratedAt = new Date().toISOString()
        }
      }
    }
  } catch (err) {
    console.error('Supplementary CFFS regen error:', err)
    // Do not roll back the dietary + medication writes
  }

  // 7. Notify Kade
  try {
    const { data: client } = await admin
      .from('clients')
      .select('name')
      .eq('id', invitation.client_id)
      .single()
    const clientName = client?.name ?? 'A client'
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.bodyrecode.au'

    const bodyLines: string[] = []
    bodyLines.push(`${clientName} just completed the supplementary intake. The dietary context fields are now on their intake row and any new medications have been written to their profile.`)
    if (cffsRegeneratedAt) {
      bodyLines.push(`Their CFFS has been auto-regenerated against the updated intake + medications context, so the next program / nutrition / weekly synthesis will use it.`)
    } else {
      bodyLines.push(`CFFS auto-regeneration did NOT run successfully. The dietary + medication data IS saved. Trigger a manual CFFS regenerate from their client profile when you can.`)
    }
    if (foundationalReadingArchived) {
      bodyLines.push(`Heads up: their previous Foundational Reading was on the now-archived CFFS, so the client portal currently has no published FR. Open the Foundational Reading panel on their profile and click Regenerate to republish it (or leave it as-is if you'd rather the previous reading stays archived).`)
    }

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
        footnote: cffsRegeneratedAt
          ? 'CFFS regenerated. Review on the profile.'
          : 'CFFS regeneration pending. Trigger manually.',
      }),
    })
  } catch (err) {
    console.error('Supplementary coach notification failed:', err)
  }

  return NextResponse.json({
    ok: true,
    cffsRegenerated: !!cffsRegeneratedAt,
    foundationalReadingArchived,
  })
}

function stripEmDashes(obj: unknown): unknown {
  if (typeof obj === 'string') return obj.replace(/\s*—\s*/g, ', ')
  if (Array.isArray(obj)) return obj.map(stripEmDashes)
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, stripEmDashes(v)]))
  }
  return obj
}
