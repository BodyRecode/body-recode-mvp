import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateCFWS } from '@/lib/cfws-generate'
import { darkEmailSignature } from '@/lib/email-signature'
import { fromCoach, fromBrand, darkEmailShell, emailUrlFallback } from '@/lib/email-shell'
import { buildCoachNotificationEmail } from '@/lib/coach-notification-email'
import { writeRecoverySignalBlock, evaluateRouterAfterCheckin } from '@/lib/recovery-ingest'
import { syncReassessmentTriggers } from '@/lib/reassessment-triggers'
import { extractTrainingReview, extractNutritionReview, stripReviewKeys } from '@/lib/weekly-checkin-questions'
import { appUrl } from '@/lib/app-url'
import { coach, logoUrl } from '@/config/tenant'

export const maxDuration = 300

export async function POST(request: NextRequest) {
  const { clientId, weekNumber, formType, responses } = await request.json()

  if (!clientId || !weekNumber || !formType || !responses) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify client exists
  const { data: client } = await admin
    .from('clients')
    .select('id, name, email, onboarding_token')
    .eq('id', clientId)
    .maybeSingle()

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  // Check not already submitted
  const { data: existing } = await admin
    .from('weekly_checkins')
    .select('id')
    .eq('client_id', clientId)
    .eq('week_number', weekNumber)
    .eq('form_type', formType)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Already submitted for this week' }, { status: 409 })
  }

  // Save check-in
  const { data: inserted, error: insertError } = await admin
    .from('weekly_checkins')
    .insert({
      client_id: clientId,
      week_number: weekNumber,
      form_type: formType,
      responses,
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('Check-in insert error:', insertError)
    return NextResponse.json({ error: 'Failed to save check-in' }, { status: 500 })
  }

  // Training + Nutrition reviews are now folded into the weekly check-in, so
  // the client has ONE thing to complete. Replicate exactly what the old
  // standalone /api/portal/program-review and /nutrition-review routes did:
  // insert the review row and update the plan's current_direction +
  // last_review_at, so the coach-facing direction signals keep flowing.
  // Guarded so a review write can never fail the parent check-in.
  await writeMergedReviews(admin, clientId, responses).catch(err =>
    console.error('Merged review write error:', err)
  )

  // Send notifications (fire-and-forget)
  sendNotifications(client, weekNumber, formType).catch(err =>
    console.error('Notification error:', err)
  )

  // Fire the auto-coach-response Inngest worker. It will run a 30s settle
  // delay, gate on client.auto_checkin_response_enabled + skip flag +
  // existing-feedback check, generate the draft via the shared
  // generateFeedbackDraft helper, then schedule the send 4h out. The coach
  // can intervene during the window via the feedback form (Edit, Send now,
  // Skip) or by toggling auto-response off on the client profile.
  if (inserted?.id) {
    const { inngest } = await import('@/lib/inngest')
    inngest.send({
      name: 'weekly-checkin/submitted',
      data: { checkin_id: inserted.id },
    }).catch(err => console.error('Inngest send error (weekly-checkin/submitted):', err))
  }

  // Recovery and Regulation — Phase 2 RSIB ingest.
  // The three RSIB questions per 13D_13 are already captured under
  // a_recovery / a_sessions / a_sleep (and b_*) in the existing form,
  // so we just normalise and write to recovery_signal_block here.
  // Wrapped to never fail the parent submission.
  writeRecoverySignalBlock(admin, {
    clientId,
    weekNumber,
    formType: formType as 'A' | 'B',
    responses,
    weeklyCheckinId: inserted?.id ?? null,
  }).catch(err => console.error('[recovery] RSIB ingest error:', err))

  // Generate CFWS using the most recent A and B available (may be from different weeks)
  const otherFormType = formType === 'A' ? 'B' : 'A'
  const { data: otherForm } = await admin
    .from('weekly_checkins')
    .select('responses, week_number')
    .eq('client_id', clientId)
    .eq('form_type', otherFormType)
    .order('week_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (otherForm) {
    // Strip the merged Training/Nutrition keys so the CFWS interpretation
    // engine sees only the original reflective responses (behaviour unchanged).
    const currentResponses = stripReviewKeys(responses)
    const otherResponses = stripReviewKeys(otherForm.responses as Record<string, string>)
    const formAResponses = formType === 'A' ? currentResponses : otherResponses
    const formBResponses = formType === 'B' ? currentResponses : otherResponses
    await generateCFWS(admin, client, weekNumber, formAResponses, formBResponses).catch(
      err => console.error('CFWS generation error:', err)
    )

    // After CFWS lands, evaluate the recovery router with the just-generated
    // CFWS readiness + the RSIB row we just wrote. In observe-only mode this
    // only writes a shadow audit row to recovery_adjustments.
    evaluateRouterAfterCheckin(admin, clientId).catch(err =>
      console.error('[recovery] router evaluation error:', err),
    )

    // Persist any reassessment triggers the new CFWS fires. Until this existed the
    // thresholds were computed and rendered but nothing recorded them, so acting on
    // a regression depended on a coach happening to look at the dashboard.
    // Idempotent: deduped on (client, reason, CFWS).
    syncReassessmentTriggers(admin, clientId).catch(err =>
      console.error('[reassessment-triggers] sync error:', err),
    )
  }

  return NextResponse.json({ success: true })
}

async function sendNotifications(
  client: { id: string; name: string; email?: string; onboarding_token?: string | null },
  weekNumber: number,
  formType: string
) {
  if (!process.env.RESEND_API_KEY) return
  const resend = new Resend(process.env.RESEND_API_KEY)
  const firstName = client.name.split(' ')[0]
  const clientUrl = `${appUrl()}/dashboard/clients/${client.id}`
  const formLabel = formType === 'A' ? 'Form A (Experience-Forward)' : 'Form B (Pattern-Aware)'

  // Notify Kade
  await resend.emails.send({
    from: fromBrand(),
    to: coach().email,
    subject: `${client.name}, Week ${weekNumber} check-in submitted`,
    html: buildCoachNotificationEmail({
      eyebrow: `Week ${weekNumber} Check-In`,
      heading: `${client.name} submitted Week ${weekNumber}`,
      body: `${formLabel} has been submitted. A CFWS will be generated shortly and will surface in their client profile.`,
      ctaLabel: 'View client profile',
      ctaUrl: clientUrl,
    }),
  })

  // Confirm to client
  if (client.email) {
    await resend.emails.send({
      from: fromCoach(),
      to: client.email,
      subject: `Week ${weekNumber} check-in received`,
      html: darkEmailShell(`
      <div style="margin-bottom:40px;">
        <img src="${logoUrl()}" width="130" alt="Body Recode" style="display:block;border:0;" />
      </div>
      <p style="font-size:15px;color:#4A4A4A;line-height:1.9;margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Hi ${firstName},</p>
      <p style="font-size:15px;color:#4A4A4A;line-height:1.9;margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Your Week ${weekNumber} check-in has been received. I'll review it and it'll inform your coaching this week.</p>
      ${client.onboarding_token ? emailUrlFallback(`${appUrl()}/portal/${client.onboarding_token}`, 'Your portal') : ''}
      ${darkEmailSignature()}
`, { previewText: `Week ${weekNumber} check-in received.` }),
    })
  }
}

async function writeMergedReviews(
  admin: ReturnType<typeof createAdminClient>,
  clientId: string,
  responses: Record<string, string>
) {
  const nowIso = new Date().toISOString()

  // --- Training review (mirrors /api/portal/program-review) ---
  const training = extractTrainingReview(responses)
  if (training) {
    const { data: program } = await admin
      .from('programs')
      .select('id')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .maybeSingle()

    if (program) {
      const { error } = await admin.from('program_reviews').insert({
        program_id: program.id,
        client_id: clientId,
        adherence_confirmed: training.adherence_confirmed,
        signal_category: training.signal_category,
        signal_strength: 'moderate',
        days_under_observation: 7,
        signals_noted: training.signals_noted,
        direction: training.direction,
      })
      if (error) console.error('program_reviews insert error:', error)
      else
        await admin
          .from('programs')
          .update({ current_direction: training.direction, last_review_at: nowIso })
          .eq('id', program.id)
    }
  }

  // --- Nutrition review (mirrors /api/portal/nutrition-review) ---
  const nutrition = extractNutritionReview(responses)
  if (nutrition) {
    const { data: plan } = await admin
      .from('nutrition_plans')
      .select('id')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .maybeSingle()

    if (plan) {
      const { error } = await admin.from('nutrition_reviews').insert({
        nutrition_plan_id: plan.id,
        client_id: clientId,
        adherence_confirmed: nutrition.adherence_confirmed,
        signal_category: nutrition.signal_category,
        signal_strength: 'moderate',
        days_under_observation: 7,
        signals_noted: nutrition.signals_noted,
        direction: nutrition.direction,
      })
      if (error) console.error('nutrition_reviews insert error:', error)
      else
        await admin
          .from('nutrition_plans')
          .update({ current_direction: nutrition.direction, last_review_at: nowIso })
          .eq('id', plan.id)
    }
  }
}

