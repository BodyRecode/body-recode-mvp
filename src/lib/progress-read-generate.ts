/**
 * Gathers everything a Progress Read needs from the database, runs it, and
 * stores the result as a draft. The read itself (progress-read.ts) knows none of
 * this; everything client-record-specific lives here.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { compareAnswers, formatComparisonForPrompt, type Answers, type Dispute } from '@/lib/answer-comparison'
import { mergeProgressCheckIntoIntake, runProgressRead, type PreviousRead, type ProgressReadInput } from '@/lib/progress-read'
import { signedBaselinePhotoUrl } from '@/lib/baseline-photos'
import { fetchImageAsBase64 } from '@/lib/read-photo-fetch'
import { resolveHeightCm } from '@/lib/client-height'
import { lintClientReading } from '@/lib/reading-lint'
import { CFFS_MODEL } from '@/lib/ai-models'
import type { BloodMarker } from '@/lib/blood-panel-prompt'
import type { ReadPhoto } from '@/lib/cffs-read'
import type { Intake } from '@/types'

export class ProgressReadError extends Error {
  constructor(message: string, public status: number) { super(message) }
}

const READ_FIELDS = 'id, generated_at, body_state_classification, pattern_classification, pattern_confidence, exposure_readiness_capacity, exposure_readiness_schedule, exposure_readiness_regulation, exposure_readiness_behaviour, primary_patterns_and_signals, capacity_constraints_and_guardrails, risk_flags_and_watch_items, visual_signal_summary'

export interface ProgressCheckRow {
  id: string
  client_id: string
  responses: Answers | null
  previous_answers: Answers | null
  what_changed: string | null
  submitted_at: string | null
}

/**
 * The read this one follows: the latest published Progress Read if there is one
 * newer than the Foundational Read, otherwise the live Foundational Read.
 */
async function loadPreviousRead(admin: SupabaseClient, clientId: string): Promise<PreviousRead | null> {
  const [{ data: cffs }, { data: pr }] = await Promise.all([
    admin.from('cffs').select(READ_FIELDS).eq('client_id', clientId).eq('is_archived', false).order('generated_at', { ascending: false }).limit(1).maybeSingle(),
    admin.from('progress_reads').select('id, generated_at, published_at, body_state_classification, pattern_classification, pattern_confidence, exposure_readiness_capacity, exposure_readiness_schedule, exposure_readiness_regulation, exposure_readiness_behaviour, content')
      .eq('client_id', clientId).eq('status', 'published').eq('is_archived', false).order('published_at', { ascending: false }).limit(1).maybeSingle(),
  ])
  if (pr && (!cffs || new Date(pr.generated_at).getTime() > new Date(cffs.generated_at).getTime())) {
    const c = (pr.content ?? {}) as Record<string, string | null>
    return {
      kind: 'progress', id: pr.id, generatedAt: pr.generated_at,
      body_state_classification: pr.body_state_classification, pattern_classification: pr.pattern_classification, pattern_confidence: pr.pattern_confidence,
      exposure_readiness_capacity: pr.exposure_readiness_capacity, exposure_readiness_schedule: pr.exposure_readiness_schedule,
      exposure_readiness_regulation: pr.exposure_readiness_regulation, exposure_readiness_behaviour: pr.exposure_readiness_behaviour,
      primary_patterns_and_signals: c.primary_patterns_and_signals ?? null, capacity_constraints_and_guardrails: c.capacity_constraints_and_guardrails ?? null,
      risk_flags_and_watch_items: c.risk_flags_and_watch_items ?? null, visual_signal_summary: c.visual_signal_summary ?? null,
    }
  }
  if (!cffs) return null
  return { kind: 'foundational', generatedAt: cffs.generated_at, ...cffs } as PreviousRead
}

export async function gatherProgressReadInput(admin: SupabaseClient, pc: ProgressCheckRow): Promise<{ input: ProgressReadInput; comparisonText: string }> {
  const clientId = pc.client_id
  const previousRead = await loadPreviousRead(admin, clientId)
  if (!previousRead) throw new ProgressReadError('This client has no Foundational Read yet, so there is nothing to progress from.', 400)

  const [{ data: intake }, { data: clientRow }, { data: baselines }, { data: bloodPanel }, { data: disputeRows }] = await Promise.all([
    admin.from('intakes').select('*').eq('client_id', clientId).order('submitted_at', { ascending: false }).limit(1).maybeSingle(),
    admin.from('clients').select('medications, height_cm, height_recorded_at, height_source').eq('id', clientId).maybeSingle(),
    admin.from('baselines').select('bodyweight_kg, height_cm, waist_cm, hips_cm, chest_cm, captured_at, photo_front_url, photo_side_url, photo_back_url')
      .eq('client_id', clientId).order('captured_at', { ascending: false, nullsFirst: false }).limit(2),
    admin.from('blood_panels').select('panel_summary, collected_on, markers, analysis, cycle_day, cycle_note')
      .eq('client_id', clientId).eq('approved_for_plan', true).order('approved_at', { ascending: false, nullsFirst: false }).limit(1).maybeSingle(),
    admin.from('progress_check_disputes').select('question_id, should_have_been, note, created_at').eq('progress_check_id', pc.id),
  ])
  if (!intake) throw new ProgressReadError('No intake on file for this client.', 400)

  const answers = (pc.responses ?? {}) as Answers
  const currentIntake = mergeProgressCheckIntoIntake(intake, answers) as Partial<Intake>

  const disputes: Dispute[] = (disputeRows ?? []).map(d => ({ questionId: d.question_id, shouldHaveBeen: d.should_have_been, note: d.note, at: d.created_at }))
  const comparisonText = formatComparisonForPrompt(compareAnswers((pc.previous_answers ?? {}) as Answers, answers, disputes))

  const [latest, earlier] = baselines ?? []
  const photoEntries: Array<{ label: ReadPhoto['label']; url: string | null }> = [
    { label: 'front', url: latest?.photo_front_url ?? null },
    { label: 'side', url: latest?.photo_side_url ?? null },
    { label: 'back', url: latest?.photo_back_url ?? null },
  ]
  const photos = (await Promise.all(photoEntries.map(async ({ label, url }) => {
    if (!url) return null
    const signed = await signedBaselinePhotoUrl(admin, url, 5 * 60)
    const image = signed ? await fetchImageAsBase64(signed) : null
    return image ? { label, base64: image.base64, media_type: image.media_type } : null
  }))).filter(Boolean) as ReadPhoto[]

  const height = resolveHeightCm({
    clientHeightCm: clientRow?.height_cm,
    clientHeightRecordedAt: clientRow?.height_recorded_at ?? null,
    clientHeightSource: clientRow?.height_source ?? null,
    baselineHeightCm: latest?.height_cm,
    baselineCapturedAt: latest?.captured_at ?? null,
  })

  const { data: weekly } = await admin.from('cfws')
    .select('week_number, generated_at, exposure_readiness_capacity, exposure_readiness_schedule, exposure_readiness_regulation, exposure_readiness_behaviour')
    .eq('client_id', clientId).eq('is_archived', false)
    .gte('generated_at', previousRead.generatedAt ?? '1970-01-01')
    .order('week_number', { ascending: false }).limit(12)

  // The Progress Check's medications answer is what she says now; the profile is
  // never overwritten from the check, so the read sees both when they differ.
  const medsNow = typeof answers.medications === 'string' && answers.medications.trim() ? answers.medications.trim() : null
  const medsOnFile = clientRow?.medications ?? null
  const medications = medsNow && medsOnFile && medsNow !== medsOnFile
    ? `On file: ${medsOnFile}\nHer Progress Check answer: ${medsNow}`
    : medsNow ?? medsOnFile

  return {
    comparisonText,
    input: {
      currentIntake,
      medications,
      baseline: latest ? {
        bodyweight_kg: latest.bodyweight_kg ?? null, height_cm: height.heightCm, waist_cm: latest.waist_cm ?? null,
        hips_cm: latest.hips_cm ?? null, chest_cm: latest.chest_cm ?? null, captured_at: latest.captured_at ?? null,
      } : null,
      previousMeasurements: earlier ? {
        bodyweight_kg: earlier.bodyweight_kg ?? null, waist_cm: earlier.waist_cm ?? null, hips_cm: earlier.hips_cm ?? null,
        chest_cm: earlier.chest_cm ?? null, captured_at: earlier.captured_at ?? null,
      } : null,
      photos,
      bloodPanel: bloodPanel ? {
        panel_summary: bloodPanel.panel_summary ?? null, collected_on: bloodPanel.collected_on ?? null,
        markers: (bloodPanel.markers ?? []) as BloodMarker[],
        combined_picture: (bloodPanel.analysis as { combined_picture?: string } | null)?.combined_picture ?? null,
        cycleDay: bloodPanel.cycle_day ?? null, cycleNote: bloodPanel.cycle_note ?? null,
      } : null,
      weeklyReadiness: weekly ?? [],
      previousRead,
      comparisonText,
      whatChanged: pc.what_changed,
      label: clientId.slice(0, 8),
    },
  }
}

/** Generate a Progress Read for a submitted near-full Progress Check and store it as a draft. */
export async function generateAndStoreProgressRead(admin: SupabaseClient, progressCheckId: string, timeBudgetMs?: number) {
  const { data: pc } = await admin.from('progress_checks')
    .select('id, client_id, status, form_version, responses, previous_answers, what_changed, submitted_at')
    .eq('id', progressCheckId).maybeSingle()
  if (!pc) throw new ProgressReadError('Progress Check not found.', 404)
  if (pc.form_version !== 'v2') throw new ProgressReadError('This Progress Check is the older 24-question form. Use the Progress Read panel on the Training page for it.', 400)
  if (pc.status !== 'complete') throw new ProgressReadError('This Progress Check has not been submitted yet.', 400)

  const { input, comparisonText } = await gatherProgressReadInput(admin, pc as ProgressCheckRow)
  const result = await runProgressRead({ ...input, timeBudgetMs })
  if (!result.ok) throw new ProgressReadError(result.error, 502)
  const r = result.read

  // The pre-publish check every client document gets, run on her sections now
  // so the coach sees any finding before deciding to publish.
  const her = (r.for_her ?? {}) as Record<string, string>
  const lintFindings = lintClientReading({ sections: her, sourceMaterial: JSON.stringify(input.currentIntake) + '\n' + (input.whatChanged ?? '') + '\n' + comparisonText })

  const { data: row, error } = await admin.from('progress_reads').insert({
    client_id: pc.client_id,
    progress_check_id: pc.id,
    previous_read_kind: input.previousRead.kind,
    previous_read_id: input.previousRead.id,
    previous_body_state: input.previousRead.body_state_classification,
    body_state_classification: r.body_state_classification,
    state_direction: r.state_direction ?? null,
    state_clamped: result.stateClamped,
    pattern_classification: r.pattern_classification ?? null,
    pattern_confidence: r.pattern_confidence ?? null,
    pattern_changed: (r.pattern_change as { changed?: boolean } | undefined)?.changed === true,
    exposure_readiness_capacity: r.exposure_readiness_capacity ?? null,
    exposure_readiness_schedule: r.exposure_readiness_schedule ?? null,
    exposure_readiness_regulation: r.exposure_readiness_regulation ?? null,
    exposure_readiness_behaviour: r.exposure_readiness_behaviour ?? null,
    content: r,
    comparison_text: comparisonText,
    photos_used: result.photosUsed,
    lint_findings: lintFindings,
    model: CFFS_MODEL,
  }).select('id').single()
  if (error || !row) throw new ProgressReadError(`The read was generated but could not be saved: ${error?.message ?? 'unknown error'}`, 500)

  // Earlier drafts for the same check are superseded, never deleted.
  await admin.from('progress_reads').update({ is_archived: true })
    .eq('progress_check_id', pc.id).eq('status', 'draft').neq('id', row.id)

  return { id: row.id as string, clientId: pc.client_id as string }
}
