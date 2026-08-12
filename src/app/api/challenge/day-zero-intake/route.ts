import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logLeadEvent } from '@/lib/log-lead-event'
import { PORTAL_ACCESS_STATUSES } from '@/lib/challenge-access'
import {
  typeFatMapProfile,
  PROFILE_DRIVERS,
  leadDescriptor,
  type BiologicalSex,
  type AgeBand,
  type FatStorage,
  type CycleStatus,
} from '@/lib/fat-map-profile'

// POST /api/challenge/day-zero-intake
// Persists the Day 0 Body Decode Intake answers (scorecard-equivalent
// signals: 5 section scores, 2 qualifiers, sex/age/storage/cycle) to the
// enroller's leads row, types their Fat Map zone via the same logic the
// scorecard uses, then stamps challenge_enrollments.body_decode_intake_completed_at
// so the portal advances past the intake gate.
//
// Closes the state-capture hole for Challenge enrollers who bypassed the
// scorecard (cold-paid Meta ads, gym-floor QR scans, direct /challenge URLs).

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const {
    token,
    section_scores,
    approach_response,
    ascension_intent,
    biological_sex,
    age_band,
    fat_storage,
    cycle_status,
  } = body as {
    token: string
    section_scores: Record<'01' | '02' | '03' | '04' | '05', number>
    approach_response?: 'A' | 'B' | 'C' | 'D'
    ascension_intent?: 'A' | 'B' | 'C' | 'D'
    biological_sex?: BiologicalSex
    age_band?: AgeBand
    fat_storage?: FatStorage
    cycle_status?: CycleStatus
  }

  // ascension_intent replaces the scorecard's investment_readiness for the
  // Day 0 context. Stored on the enrolment, never on leads, so it doesn't
  // pollute scorecard semantics. Whitelist to A|B|C|D.
  const ascensionIntentVal: 'A' | 'B' | 'C' | 'D' | null =
    ascension_intent === 'A' || ascension_intent === 'B' || ascension_intent === 'C' || ascension_intent === 'D'
      ? ascension_intent
      : null

  if (!token) {
    return NextResponse.json({ error: 'Missing token.' }, { status: 400 })
  }

  // Validate the five section scores arrived intact.
  const requiredKeys: ('01' | '02' | '03' | '04' | '05')[] = ['01', '02', '03', '04', '05']
  const missing = requiredKeys.filter(k => typeof section_scores?.[k] !== 'number')
  if (missing.length > 0) {
    return NextResponse.json({ error: `Missing section scores: ${missing.join(', ')}.` }, { status: 400 })
  }

  // Whitelist the Fat Map typing signals so a malformed payload can never
  // write a junk value or violate the leads CHECK constraints. Same pattern
  // as /api/scorecard/submit.
  const sexVal: BiologicalSex | null = biological_sex === 'M' || biological_sex === 'F' ? biological_sex : null
  const ageVal: AgeBand | null = ['under_35', '35_44', '45_54', '55_plus'].includes(age_band as string) ? (age_band as AgeBand) : null
  const storageVal: FatStorage | null = ['midsection', 'posterior', 'hips_thighs', 'all_over', 'low_tone'].includes(fat_storage as string) ? (fat_storage as FatStorage) : null
  const cycleVal: CycleStatus | null = sexVal === 'F' && ['regular', 'irregular', 'perimenopausal', 'postmenopausal'].includes(cycle_status as string) ? (cycle_status as CycleStatus) : null

  // Compute total score + body state from the section scores. Mirrors the
  // scorecard frontend: total /15, ≤8 Depleted, ≤11 Transitioning, else Ready.
  const total = requiredKeys.reduce((sum, k) => sum + (section_scores[k] ?? 0), 0)
  const bodyState: 'Depleted State' | 'Transitioning State' | 'Ready State' =
    total <= 8 ? 'Depleted State' :
    total <= 11 ? 'Transitioning State' :
    'Ready State'

  // Type the lead into one of the four Fat Map zones (sex-gated, storage-led).
  const { profile: fatMapProfile, confidence: profileConfidence } = typeFatMapProfile(
    section_scores,
    bodyState,
    { sex: sexVal, ageBand: ageVal, fatStorage: storageVal, cycleStatus: cycleVal },
  )

  // Lead quality at Day 0 is approach-only (single axis). The scorecard's
  // 2-axis approach+investment scoring doesn't apply here — investment
  // readiness is asked about THE Challenge they just took for free, so
  // it's a meaningless red-flag signal in this context. ascension_intent
  // replaces it but is forward-looking + not red-flagged (all 4 answers
  // including "Not sure yet" are valid intentions). Day 0 enrollers
  // therefore max out at 'yellow' lead quality; only scorecard signups
  // can hit 'red' (both axes flagged).
  const approachIsRed = approach_response === 'C' || approach_response === 'D'
  const leadQuality: 'green' | 'yellow' | 'red' | null =
    !approach_response ? null
    : approachIsRed ? 'yellow'
    : 'green'
  const redFlag = approachIsRed

  const admin = createAdminClient()

  // Resolve enrolment + linked lead from the portal token.
  const { data: enrollment, error: fetchError } = await admin
    .from('challenge_enrollments')
    .select('id, lead_id')
    .eq('token', token)
    .in('status', PORTAL_ACCESS_STATUSES)
    .single()

  if (fetchError || !enrollment) {
    return NextResponse.json({ error: 'Enrollment not found.' }, { status: 404 })
  }

  // Persist scorecard-equivalent data to the lead row.
  const { error: leadUpdateErr } = await admin
    .from('leads')
    .update({
      scorecard_score: total,
      scorecard_body_state: bodyState,
      scorecard_section_scores: section_scores,
      approach_response: approach_response ?? null,
      // investment_readiness deliberately left null at Day 0 — see
      // ascension_intent written to challenge_enrollments below.
      red_flag: redFlag,
      lead_quality: leadQuality,
      biological_sex: sexVal,
      age_band: ageVal,
      fat_storage: storageVal,
      cycle_status: cycleVal,
      scorecard_profile: fatMapProfile,
      scorecard_profile_confidence: profileConfidence,
      updated_at: new Date().toISOString(),
      // Source attribution (Day 0 intake vs scorecard) is derivable from
      // challenge_enrollments.body_decode_intake_completed_at — no separate
      // column needed.
    })
    .eq('id', enrollment.lead_id)

  if (leadUpdateErr) {
    console.error('[challenge/day-zero-intake] lead update error:', leadUpdateErr)
    return NextResponse.json({ error: 'Failed to save intake.' }, { status: 500 })
  }

  // Stamp enrolment + persist the Day 0-specific forward-intent answer.
  const { error: enrollUpdateErr } = await admin
    .from('challenge_enrollments')
    .update({
      body_decode_intake_completed_at: new Date().toISOString(),
      ascension_intent: ascensionIntentVal,
    })
    .eq('id', enrollment.id)

  if (enrollUpdateErr) {
    console.error('[challenge/day-zero-intake] enrolment stamp error:', enrollUpdateErr)
    return NextResponse.json({ error: 'Failed to mark intake complete.' }, { status: 500 })
  }

  // Audit the event on the lead timeline.
  await logLeadEvent({
    leadId: enrollment.lead_id,
    type: 'day_zero_intake_completed',
    subject: 'Day 0 Body Decode Intake completed',
    notes: `Score ${total}/15 · ${bodyState} · Zone: ${fatMapProfile}${profileConfidence === 'low' ? ' (provisional)' : ''}${leadQuality ? ` · Quality ${leadQuality}` : ''}${ascensionIntentVal ? ` · Intent ${ascensionIntentVal}` : ''}.`,
  })

  const namedZone = fatMapProfile !== 'Indeterminate'
  return NextResponse.json({
    success: true,
    score: total,
    body_state: bodyState,
    section_scores,
    profile: namedZone ? fatMapProfile : null,
    profile_confidence: namedZone ? profileConfidence : null,
    profile_driver: namedZone ? PROFILE_DRIVERS[fatMapProfile].replace(/\s*\([^)]*\)\s*$/, '') : null,
    profile_descriptor: leadDescriptor(fatMapProfile, { cycleStatus: cycle_status ?? null, ageBand: age_band ?? null }),
  })
}
