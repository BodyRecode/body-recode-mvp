import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { PROGRESS_CHECK_QUESTION_IDS } from '@/lib/progress-check-questions'
import { fromCoach } from '@/lib/email-shell'
import { coach } from '@/config/tenant'
import { appUrl } from '@/lib/app-url'
import { getWeekNumber } from '@/lib/weekly-checkin-questions'
import { buildCoachNotificationEmail } from '@/lib/coach-notification-email'
import { hormonalSafetyAlerts } from '@/lib/hormonal-safety-alerts'
import { compareAnswers, type Answers } from '@/lib/answer-comparison'
import {
  cleanV2Answers, cleanDisputes, loadPreviousAnswers, missingRequiredV2,
  PROGRESS_CHECK_V2_QUESTION_IDS, WHAT_CHANGED_ID,
} from '@/lib/progress-check-v2'

// Stores a completed Progress Check. Token-authorised (the client reaches it via
// their unique link), service-role write. On completion it notifies the coach so
// they can generate the Progress Read (which re-scores body state from these
// answers). No client-facing publish happens here - the coach stays the gate.
export const maxDuration = 300

export async function POST(request: NextRequest) {
  // Multipart: the answers and the milestone capture arrive together, so a
  // client can never end up with answers on file and no photos.
  const form = await request.formData().catch(() => null)
  if (!form) return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  const token = form.get('token') as string | null
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  let responses: Record<string, unknown> = {}
  try {
    responses = JSON.parse((form.get('responses') as string) ?? '{}')
  } catch {
    responses = {}
  }
  const body = { responses }

  const admin = createAdminClient()
  const { data: pc } = await admin
    .from('progress_checks')
    .select('id, status, client_id, program_id, form_version')
    .eq('token', token)
    .maybeSingle()
  if (!pc) return NextResponse.json({ error: 'Progress Check not found' }, { status: 404 })
  if (pc.status === 'complete') return NextResponse.json({ ok: true, already: true })

  const isV2 = pc.form_version === 'v2'
  // Filled for version 2 only, for the coach email.
  let v2Summary: { lines: string[]; alerts: ReturnType<typeof hormonalSafetyAlerts>; disputes: number; whatChanged: string | null; medicationsDiffer: string | null } | null = null

  if (isV2) {
    // ── Version 2: the near-full re-ask ─────────────────────────────────
    const answers = cleanV2Answers(body.responses)
    const whatChanged = typeof body.responses?.[WHAT_CHANGED_ID] === 'string' && body.responses[WHAT_CHANGED_ID].trim()
      ? String(body.responses[WHAT_CHANGED_ID]).slice(0, 5000)
      : null
    const previous = await loadPreviousAnswers(admin, pc.client_id, pc.id)

    // The form enforces this; the server does too, so a stale tab cannot submit half a check.
    const missing = missingRequiredV2(answers, previous.answers, previous.gender)
    if (missing.length) {
      return NextResponse.json({ error: `${missing.length} question${missing.length === 1 ? '' : 's'} still need an answer. Your answers are saved.` }, { status: 400 })
    }

    let disputesRaw: unknown = []
    try { disputesRaw = JSON.parse((form.get('disputes') as string) ?? '[]') } catch { disputesRaw = [] }
    const disputes = cleanDisputes(disputesRaw, previous.answers)

    // What she was compared against, frozen, so the Progress Read can always
    // reproduce the comparison exactly even after a later check changes "last time".
    const snapshot: Answers = {}
    for (const id of [...PROGRESS_CHECK_V2_QUESTION_IDS, 'sex_at_birth']) if (previous.answers[id] != null) snapshot[id] = previous.answers[id]

    await admin.from('progress_check_disputes').delete().eq('progress_check_id', pc.id)
    if (disputes.length) {
      const { error: dErr } = await admin.from('progress_check_disputes').insert(disputes.map(d => ({
        progress_check_id: pc.id,
        client_id: pc.client_id,
        question_id: d.questionId,
        original_value: snapshot[d.questionId] ?? null,
        should_have_been: d.shouldHaveBeen,
        note: d.note ?? null,
      })))
      if (dErr) {
        console.error('submit-progress-check disputes error:', dErr)
        return NextResponse.json({ error: 'Failed to save your corrections. Your answers are saved, please try again.' }, { status: 500 })
      }
    }

    const { error } = await admin
      .from('progress_checks')
      .update({
        responses: answers,
        what_changed: whatChanged,
        previous_answers: snapshot,
        previous_source: previous.source,
        status: 'complete',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', pc.id)
    if (error) {
      console.error('submit-progress-check update error:', error)
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }

    // Medications live on the client record and are NOT overwritten from here.
    // Tested 14 Sep 2026: the first version replaced them, and a client answering
    // "same as before" would have wiped her real list. The coach is told instead.
    const meds = typeof answers.medications === 'string' ? answers.medications.trim() : ''
    const medsOnFile = typeof previous.answers.medications === 'string' ? previous.answers.medications.trim() : ''
    const medicationsDiffer = meds !== '' && meds !== medsOnFile ? meds : null

    const comparison = compareAnswers(snapshot, answers, disputes)
    const words: Record<string, string> = {
      moved_toward_capacity: 'moved toward capacity',
      moved_toward_strain: 'moved toward strain',
      mixed: 'mixed',
      held: 'held',
      not_enough_overlap: 'not enough to compare',
    }
    const lines = comparison.clusters.map(c => `${c.title}: ${words[c.verdict]}${c.strength ? ` (${c.strength})` : ''}`)
    const watch = comparison.clusters.flatMap(c => c.sectionId === 'injury' ? c.largeMoves.filter(i => (i.towardCapacity ?? 0) < 0) : [])
    if (watch.length) lines.push(`Injury items to watch: ${watch.map(i => `"${i.text}" ${i.baseline} to ${i.current}`).join('; ')}`)
    v2Summary = { lines, alerts: hormonalSafetyAlerts(answers as { pregnant_or_postpartum?: string; androgen_use?: string }), disputes: disputes.length, whatChanged, medicationsDiffer }
  } else {
    // ── Version 1: the original 24 questions ────────────────────────────
    // Persist only known question ids, as strings. Ignore anything unexpected.
    const clean: Record<string, string> = {}
    for (const id of PROGRESS_CHECK_QUESTION_IDS) {
      const v = body?.responses?.[id]
      if (v != null && String(v).trim() !== '') clean[id] = String(v)
    }

    const { error } = await admin
      .from('progress_checks')
      .update({ responses: clean, status: 'complete', submitted_at: new Date().toISOString() })
      .eq('id', pc.id)

    if (error) {
      console.error('submit-progress-check update error:', error)
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }
  }

  // ── Milestone capture ────────────────────────────────────────────────
  // Every baseline on file was captured in week one, because the capture only
  // ever existed as a one-off onboarding task. Writing a fresh `baselines` row
  // here is what finally produces a before-and-after: the table has always been
  // multi-row and the portal already renders "Week N re-capture".
  //
  // Best-effort by design. The answers are already saved above; a storage
  // failure must never cost the client her whole submission.
  const num = (k: string) => {
    const v = parseFloat((form.get(k) as string) ?? '')
    return Number.isFinite(v) ? v : null
  }
  const bodyweight = num('bodyweight')
  let captureSaved = false
  let photosSaved = 0

  if (bodyweight != null) {
    try {
      const { data: client } = await admin
        .from('clients')
        .select('coaching_started_at')
        .eq('id', pc.client_id)
        .maybeSingle()
      const week = client?.coaching_started_at ? getWeekNumber(client.coaching_started_at) : null

      async function uploadPhoto(file: File | null, position: string): Promise<string | null> {
        if (!file || file.size === 0) return null
        const ext = file.name.split('.').pop() ?? 'jpg'
        const path = `${pc!.client_id}/${Date.now()}_${position}.${ext}`
        const buffer = Buffer.from(await file.arrayBuffer())
        const { error: upErr } = await admin.storage
          .from('baseline-photos')
          .upload(path, buffer, { contentType: file.type, upsert: true })
        if (upErr) { console.error('Progress Check photo upload error:', upErr); return null }
        // Object path, not a public URL - the bucket is private and these are
        // served over short-lived signed URLs (src/lib/baseline-photos.ts).
        return path
      }

      const [frontUrl, sideUrl, backUrl] = await Promise.all([
        uploadPhoto(form.get('photoFront') as File | null, 'front'),
        uploadPhoto(form.get('photoSide') as File | null, 'side'),
        uploadPhoto(form.get('photoBack') as File | null, 'back'),
      ])
      photosSaved = [frontUrl, sideUrl, backUrl].filter(Boolean).length

      const { error: capErr } = await admin.from('baselines').insert({
        client_id: pc.client_id,
        bodyweight_kg: bodyweight,
        waist_cm: num('waist'),
        hips_cm: num('hips'),
        chest_cm: num('chest'),
        photo_front_url: frontUrl,
        photo_side_url: sideUrl,
        photo_back_url: backUrl,
        re_capture_week: week,
      })
      if (capErr) console.error('Progress Check capture insert error:', capErr)
      else captureSaved = true
    } catch (e) {
      console.error('Progress Check capture failed (non-fatal):', e)
    }
  }

  // Notify the coach so they can generate + review the Progress Read. Best-effort;
  // a failed notification must not fail the client's submission.
  try {
    const { data: client } = await admin
      .from('clients')
      .select('name')
      .eq('id', pc.client_id)
      .maybeSingle()
    const clientName = client?.name || 'A client'
    const programUrl = `${appUrl()}/dashboard/clients/${pc.client_id}/program`
    const resend = new Resend(process.env.RESEND_API_KEY)
    const captureLine = captureSaved
      ? `Fresh capture saved: measurements and ${photosSaved} photo${photosSaved === 1 ? '' : 's'}.${photosSaved < 3 ? ' Fewer than three photos landed, worth checking the file.' : ''}`
      : 'No capture was saved with this one, which should not happen now that measurements and photos are required. Worth checking the logs.'

    if (v2Summary) {
      const alertSubject = v2Summary.alerts.length ? `Needs attention: ${v2Summary.alerts.map(a => a.headline.toLowerCase()).join(', ')}. ` : ''
      await resend.emails.send({
        from: fromCoach(),
        to: coach().adminEmail,
        subject: `${alertSubject}Progress Check submitted: ${clientName}`,
        html: buildCoachNotificationEmail({
          eyebrow: 'Progress Check',
          heading: `${clientName} submitted their Progress Check`,
          accent: v2Summary.alerts.length ? 'red' : undefined,
          body: [
            ...v2Summary.alerts.map(a => `NEEDS ATTENTION: ${a.headline}. ${a.detail}`),
            `What changed, in ${clientName.split(' ')[0]}'s words: ${v2Summary.whatChanged ?? 'nothing written.'}`,
            `Section by section, compared with last time (a section only counts as moved when enough of its questions moved the same way): ${v2Summary.lines.join(' · ')}.`,
            v2Summary.disputes ? `${v2Summary.disputes} previous answer${v2Summary.disputes === 1 ? ' was' : 's were'} marked as never right. The originals are kept beside the corrections.` : 'No previous answers were disputed.',
            ...(v2Summary.medicationsDiffer ? [`Her medications answer differs from the profile, which has not been changed: "${v2Summary.medicationsDiffer}". Update the profile if her medications have actually changed.`] : []),
            captureLine,
            'Open their Progress Read page and click Generate. It takes a few minutes and saves as a draft for you to review; nothing reaches her.',
          ],
          ctaLabel: 'Open their Progress Read',
          ctaUrl: `${appUrl()}/dashboard/clients/${pc.client_id}/progress-read`,
        }),
      })
      return NextResponse.json({ ok: true })
    }

    await resend.emails.send({
      from: fromCoach(),
      to: coach().adminEmail,
      subject: `Progress Check submitted: ${clientName}`,
      html: `<p>${clientName} has completed their Progress Check.</p>
<p>${
        captureSaved
          ? `Fresh capture saved: measurements and ${photosSaved} photo${photosSaved === 1 ? '' : 's'}.${
              photosSaved < 3 ? ' Fewer than three photos landed - worth checking the file.' : ''
            }`
          : 'No capture was saved with this one, which should not happen now that measurements and photos are required. Worth checking the logs.'
      }</p>
<p>Open their program, then use <b>Generate</b> on the Progress Read panel to draft the reading. It will re-score their body state from these answers. Review it, then publish.</p>
<p><a href="${programUrl}">${programUrl}</a></p>`,
    })
  } catch (e) {
    console.error('Progress Check coach notification failed (non-fatal):', e)
  }

  return NextResponse.json({ ok: true })
}
