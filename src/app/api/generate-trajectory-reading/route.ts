import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

  const { program_id } = await request.json()
  if (!program_id) {
    return NextResponse.json({ error: 'Missing program_id' }, { status: 400 })
  }

  let result
  try {
    result = await generateTrajectoryReadingForProgram(program_id)
  } catch (err) {
    if (err instanceof TrajectoryGenerationError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Trajectory generation failed:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  // Banned-terms audit added 2026-06-09 — see banned-client-terms.ts.
  // Trajectory Reading is client-facing; same enforcement as FR/PR/NR.
  const { auditClientReadingFields } = await import('@/lib/banned-client-terms')
  const requiredKeys = [
    'tr_where_this_block_started',
    'tr_how_your_signal_moved',
    'tr_what_held_steady',
    'tr_what_this_sets_up_next',
    'tr_coach_note',
  ] as const
  const audit = auditClientReadingFields(result.sections as unknown as Record<string, unknown>, requiredKeys as unknown as string[])

  // Partner-specific banned phrase check (Mode A+ overlay). Additive.
  const { findPartnerBannedPhrase, applyPartnerTerminology } = await import('@/lib/doctrine-parameters')
  const partnerLeaks: string[] = []
  for (const key of requiredKeys) {
    const val = (result.sections as unknown as Record<string, unknown>)[key]
    if (typeof val !== 'string') continue
    const hit = findPartnerBannedPhrase(val)
    if (hit && !partnerLeaks.includes(hit)) partnerLeaks.push(hit)
  }

  if (!audit.ok || partnerLeaks.length > 0) {
    const allLeaks = [...audit.leaks, ...partnerLeaks]
    return NextResponse.json(
      { error: `Reading leaked internal terminology (${allLeaks.join(', ')}). Click Regenerate to redraft.` },
      { status: 500 }
    )
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
