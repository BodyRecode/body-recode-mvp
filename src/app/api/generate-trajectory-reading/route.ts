import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachUser, forbidden } from '@/lib/api-auth'
import {
  generateTrajectoryReadingForProgram,
  TrajectoryGenerationError,
} from '@/lib/trajectory-generator'

export const maxDuration = 300

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  if (!(await isCoachUser(user))) return forbidden()

  const body = await request.json()
  return runTrajectoryReadingGenerationInternal(body)
}

/**
 * Internal generation entrypoint. Skips the coach auth check so server-side
 * admin scripts can generate a Progress Read for one client without a browser
 * session. Mirrors `runNutritionGenerationInternal` and
 * `runProgramGenerationInternal`, which exist for the same reason.
 *
 * Everything it produces is still a DRAFT: publishing, and the client email,
 * stay separate deliberate coach actions via /api/publish-trajectory-reading.
 *
 * Extracted 2026-09-01. Do NOT call this from anything reachable without auth.
 * The retry loop, the banned-terms audit and the re-score audit all live BELOW
 * this line, so calling `generateTrajectoryReadingForProgram` directly would
 * skip every one of them on client-facing text.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runTrajectoryReadingGenerationInternal(body: any): Promise<NextResponse> {
  const { program_id } = body ?? {}
  if (!program_id) {
    return NextResponse.json({ error: 'Missing program_id' }, { status: 400 })
  }

  // Banned-terms audit added 2026-06-09 — see banned-client-terms.ts.
  // Trajectory Reading is client-facing; same enforcement as FR/PR/NR.
  const { auditClientReadingFields } = await import('@/lib/banned-client-terms')
  const { findPartnerBannedPhrase, applyPartnerTerminology } = await import('@/lib/doctrine-parameters')
  const requiredKeys = [
    'tr_where_this_block_started',
    'tr_how_your_signal_moved',
    'tr_what_held_steady',
    'tr_what_this_sets_up_next',
    'tr_coach_note',
  ] as const

  // Retry on leak (2026-08-30), matching generate-cffs and the weekly check-in
  // generator. This route previously drafted ONCE and, on any leak, told the
  // coach to "Click Regenerate" with no reason given — so a phrase the model
  // kept reaching for became an unexplained dead end you could click forever.
  // That is exactly what happened: the Progress Check asked "I feel wired but
  // tired" verbatim, the prompt rendered it, and every attempt quoted it back.
  // That specific cause is fixed at source via Question.promptText; this loop
  // is the backstop so the next one degrades instead of deadlocking.
  const MAX_ATTEMPTS = 3
  let result: Awaited<ReturnType<typeof generateTrajectoryReadingForProgram>> | null = null
  let audit: ReturnType<typeof auditClientReadingFields> | null = null
  let lastLeaks: string[] = []

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let candidate
    try {
      candidate = await generateTrajectoryReadingForProgram(program_id)
    } catch (err) {
      if (err instanceof TrajectoryGenerationError) {
        return NextResponse.json({ error: err.message }, { status: err.status })
      }
      const msg = err instanceof Error ? err.message : String(err)
      console.error('Trajectory generation failed:', msg)
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    const candidateAudit = auditClientReadingFields(candidate.sections as unknown as Record<string, unknown>, requiredKeys as unknown as string[])
    const partnerLeaks: string[] = []
    for (const key of requiredKeys) {
      const val = (candidate.sections as unknown as Record<string, unknown>)[key]
      if (typeof val !== 'string') continue
      const hit = findPartnerBannedPhrase(val)
      if (hit && !partnerLeaks.includes(hit)) partnerLeaks.push(hit)
    }

    if (candidateAudit.ok && partnerLeaks.length === 0) {
      result = candidate
      audit = candidateAudit
      break
    }
    lastLeaks = [...candidateAudit.leaks, ...partnerLeaks]
    console.warn(`[trajectory] attempt ${attempt}/${MAX_ATTEMPTS} leaked: ${lastLeaks.join(', ')}`)
  }

  if (!result || !audit) {
    // Name the phrase and say it is repeating, so a structural collision reads
    // as structural rather than as bad luck.
    return NextResponse.json(
      { error: `Reading leaked internal terminology on all ${MAX_ATTEMPTS} attempts (${lastLeaks.join(', ')}). This is likely a source collision rather than a bad draft: check whether a question or the doctrine feeds that phrase into the prompt.` },
      { status: 500 }
    )
  }

  // The state re-score text is client-facing too; audit it (nullable fields).
  if (result.reScore.rationale || result.reScore.patternConfidenceNote) {
    const rescoreText: Record<string, unknown> = {}
    if (result.reScore.rationale) rescoreText.tr_state_rationale = result.reScore.rationale
    if (result.reScore.patternConfidenceNote) rescoreText.tr_pattern_confidence_note = result.reScore.patternConfidenceNote
    const rsAudit = auditClientReadingFields(rescoreText, Object.keys(rescoreText))
    if (!rsAudit.ok) {
      return NextResponse.json(
        { error: `Re-score leaked internal terminology (${rsAudit.leaks.join(', ')}). Click Regenerate to redraft.` },
        { status: 500 },
      )
    }
  }

  // Apply partner terminology substitutions post-audit. No-op for BR.
  const auditCleaned = audit.cleaned as Record<string, string>
  const rewritten: Record<string, string> = {}
  for (const [k, v] of Object.entries(auditCleaned)) {
    rewritten[k] = applyPartnerTerminology(v)
  }
  const cleanedSections = rewritten as typeof result.sections

  const { DOCTRINE_VERSIONS } = await import('@/lib/doctrine-versions')

  // Coach-gated: generate ONLY drafts. Publishing (and the client email) is a
  // separate, deliberate step via /api/publish-trajectory-reading.
  const admin = createAdminClient()
  const { data: updated, error: updateErr } = await admin
    .from('programs')
    .update({
      tr_where_this_block_started: cleanedSections.tr_where_this_block_started,
      tr_how_your_signal_moved: cleanedSections.tr_how_your_signal_moved,
      tr_what_held_steady: cleanedSections.tr_what_held_steady,
      tr_what_this_sets_up_next: cleanedSections.tr_what_this_sets_up_next,
      tr_coach_note: cleanedSections.tr_coach_note,
      // Progress Read state re-score (null when no Progress Check drove the read).
      tr_new_body_state: result.reScore.newState,
      tr_previous_body_state: result.reScore.previousState,
      tr_state_direction: result.reScore.direction,
      tr_state_rationale: result.reScore.rationale,
      tr_pattern_confidence_note: result.reScore.patternConfidenceNote,
      tr_progress_check_id: result.reScore.progressCheckId,
      tr_doctrine_version: DOCTRINE_VERSIONS.trajectory_reading,
      trajectory_reading_generated_at: new Date().toISOString(),
    })
    .eq('id', program_id)
    .select()
    .single()

  if (updateErr) {
    console.error('Failed to save trajectory reading:', updateErr)
    return NextResponse.json({ error: 'Failed to save reading' }, { status: 500 })
  }

  return NextResponse.json({
    program: updated,
    weeksRead: result.weeksRead,
    blockStartWeek: result.blockStartWeek,
    blockEndWeek: result.blockEndWeek,
  })
}
