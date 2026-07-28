// Coach Co-Pilot — client context builder.
//
// Assembles a compact-but-grounded picture of one client for the doctrine
// tutor: the coach-facing synthesis (CFFS) incl. its "At a glance" summary and
// full interpretive fields, the latest weekly synthesis (CFWS), the active
// program + nutrition plan headlines, medications synthesis, and recent
// check-in direction. This is what the tutor cites from — it must only assert
// what appears here (or general doctrine), never invent.
//
// Reads the CURRENT saved state (including coach edits), never a re-derivation.

import type { SupabaseClient } from '@supabase/supabase-js'
import { computeRosterNextActions } from '@/lib/roster-next-actions'

/* eslint-disable @typescript-eslint/no-explicit-any */

// Coach-style memory (Phase 8) — the coach's saved free-text preferences, read
// as SOFT guidance by both co-pilot prompts. Best-effort; '' if none/unset.
export async function getCoachPreferences(admin: SupabaseClient, coachEmail: string | null | undefined): Promise<string> {
  if (!coachEmail) return ''
  try {
    const { data } = await admin.from('coach_preferences').select('preferences').eq('coach_email', coachEmail).maybeSingle()
    return (data?.preferences as string)?.trim() ?? ''
  } catch {
    return ''
  }
}

// Practice-wide roster snapshot for the GENERAL (no-client) co-pilot (Phase 4).
// Runs the same ranked triage as the Today's Focus board and renders it compact
// so the everywhere-bubble can answer "who needs attention?", "who's due to
// progress?", "state of my roster?" — grounded in real data, not invented.
// Read-only. Priority: 10 = most urgent (awaiting the coach) → 50 = steady.
export async function buildRosterContext(admin: SupabaseClient): Promise<string> {
  const { actions, totalFeedback } = await computeRosterNextActions(admin)
  if (!actions.length) return 'ROSTER: no active clients right now.'

  const awaiting = actions.filter(a => a.priority <= 20)
  const drifting = actions.filter(a => a.priority === 30)
  const steady = actions.filter(a => a.priority >= 40)

  const S: string[] = []
  S.push(`ROSTER SNAPSHOT — ${actions.length} active client${actions.length === 1 ? '' : 's'}. Awaiting you (need an action): ${awaiting.length}. Drifting (watch): ${drifting.length}. Steady: ${steady.length}. Unacknowledged feedback items: ${totalFeedback}.`)
  S.push('')
  S.push('Each client and their single most-relevant next action (p10 = most urgent → p50 = steady). This is the SAME ranking the coach sees on the Today\'s Focus board:')
  for (const a of actions) {
    const badge = a.badge ? ` (${a.badge})` : ''
    const sub = a.sublabel ? ` — ${a.sublabel}` : ''
    S.push(`- ${a.clientName} [p${a.priority} ${a.stage}] ${a.headline}${sub}${badge}`)
  }
  return S.join('\n')
}

function fmtSummary(rs: any): string | null {
  if (!rs || typeof rs !== 'object') return null
  const parts: string[] = []
  if (rs.headline) parts.push(String(rs.headline))
  if (rs.scan && typeof rs.scan === 'object') {
    const pills = Object.entries(rs.scan)
      .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
      .map(([k, v]) => `${k}=${v}`)
      .join(', ')
    if (pills) parts.push(`[${pills}]`)
  }
  if (Array.isArray(rs.operating_rules) && rs.operating_rules.length) {
    parts.push('Operating rules: ' + rs.operating_rules.map((r: string) => `- ${r}`).join('\n'))
  }
  return parts.length ? parts.join('\n') : null
}

// Compact rendering of the ACTUAL prescribed training sessions so the tutor can
// review the plan against doctrine (phase-appropriate loading, restoration =
// easy-only, RPE/volume sanity, no conditioning in a Red-regulation block, etc.)
// rather than only reasoning off headlines. Kept terse: one line per exercise.
function fmtSessions(sessions: any): string | null {
  if (!Array.isArray(sessions) || sessions.length === 0) return null
  const out: string[] = []
  for (const s of sessions) {
    if (!s || typeof s !== 'object') continue
    out.push(`• ${s.day_label ?? 'Session'}${s.skeleton ? ` (${s.skeleton})` : ''}`)
    for (const b of s.blocks ?? []) {
      if (!b || typeof b !== 'object') continue
      out.push(`   ${b.block_label ?? 'Block'}:`)
      for (const ex of b.exercises ?? []) {
        if (!ex || typeof ex !== 'object') continue
        const bits = [
          ex.sets != null ? `${ex.sets}x` : null,
          ex.reps != null ? `${ex.reps}` : null,
          ex.rpe != null ? `@RPE ${ex.rpe}` : null,
          ex.rest ? `rest ${ex.rest}` : null,
        ].filter(Boolean).join(' ')
        out.push(`     - ${ex.exercise_name ?? 'exercise'}${bits ? ` — ${bits}` : ''}${ex.notes ? ` (${ex.notes})` : ''}`)
      }
    }
  }
  return out.length ? out.join('\n') : null
}

// Compact rendering of the ACTUAL prescribed meals + daily macro targets, so the
// tutor can review nutrition against doctrine (protein anchor honoured, calorie
// floor respected, carb demand matches phase, appetite-suppression meal count).
function fmtMeals(meals: any, proteinAnchor: any, calorieBand: any): string | null {
  const out: string[] = []
  if (proteinAnchor != null || calorieBand) {
    out.push(`Daily targets (stated): ${proteinAnchor != null ? `protein anchor ${proteinAnchor}g` : ''}${proteinAnchor != null && calorieBand ? ', ' : ''}${calorieBand ? `calories ~${calorieBand}` : ''}`)
  }
  const num = (v: any) => { const n = typeof v === 'number' ? v : parseFloat(String(v ?? '')); return Number.isFinite(n) ? n : 0 }
  if (Array.isArray(meals) && meals.length) {
    const pSpread: number[] = []
    let tp = 0, tc = 0, tf = 0
    for (const m of meals) {
      if (!m || typeof m !== 'object') continue
      const p = num(m.protein_g), c = num(m.carb_g), f = num(m.fat_g)
      tp += p; tc += c; tf += f; pSpread.push(p)
      const macros = [
        m.protein_g != null ? `P ${m.protein_g}g` : null,
        m.carb_g != null ? `C ${m.carb_g}g` : null,
        m.fat_g != null ? `F ${m.fat_g}g` : null,
      ].filter(Boolean).join(' / ')
      // Include the meal TIME so timing gaps against the client's problem
      // eating-windows (e.g. a 3-5pm snacking window left uncovered) are visible.
      const timing = typeof m.timing === 'string' && m.timing.trim() ? ` @ ${m.timing.trim()}` : ''
      out.push(`• ${m.name ?? m.meal_name ?? 'Meal'}${timing}${macros ? ` — ${macros}` : ''}`)
    }
    // Pre-computed actuals so the tutor COMPARES, never has to sum (LLMs sum
    // unreliably; this is the fix for the missed carb/protein reconciliation).
    const kcal = Math.round(tp * 4 + tc * 4 + tf * 9)
    out.push(`ACTUAL TOTALS (summed for you — compare against the plan's own claims, do not re-add): protein ${tp}g / carbs ${tc}g / fat ${tf}g / ~${kcal} kcal, across ${pSpread.length} meals.`)
    if (proteinAnchor != null) {
      const delta = tp - num(proteinAnchor)
      out.push(`Protein delivered ${tp}g vs anchor ${num(proteinAnchor)}g (${delta >= 0 ? '+' : ''}${delta}g). Per-meal protein spread: ${pSpread.join(' / ')}g.`)
    } else {
      out.push(`Per-meal protein spread: ${pSpread.join(' / ')}g.`)
    }
  }
  return out.length ? out.join('\n') : null
}

export async function buildCopilotContext(
  admin: SupabaseClient,
  clientId: string,
): Promise<{ clientName: string; coachId: string | null; context: string } | null> {
  const { data: client } = await admin
    .from('clients')
    .select('id, name, coach_id, medications, medications_analysis')
    .eq('id', clientId)
    .maybeSingle()
  if (!client) return null

  const [{ data: cffsRows }, { data: cfwsRows }, { data: programRows }, { data: nutritionRows }, { data: checkinRows }, { data: intakeRows }] = await Promise.all([
    admin.from('cffs').select('*').eq('client_id', clientId).eq('is_archived', false).order('generated_at', { ascending: false }).limit(1),
    admin.from('cfws').select('*').eq('client_id', clientId).order('week_number', { ascending: false }).limit(1),
    // Draft-first: a pending draft is exactly what the coach wants reviewed
    // BEFORE approving, so prefer it (newest) over the active plan; fall back to
    // the active plan when no draft is pending. Archived plans are excluded.
    admin.from('programs').select('block_name, progression_phase, training_goal, training_frequency, week_duration, rationale_summary, sessions, is_active, status').eq('client_id', clientId).or('status.eq.draft,is_active.eq.true').order('generated_at', { ascending: false }).limit(1),
    admin.from('nutrition_plans').select('plan_name, entry_state, carb_demand_level, entry_state_summary, meals, protein_anchor_g, estimated_calorie_band, execution_rules, is_active, status').eq('client_id', clientId).in('status', ['draft', 'active']).order('generated_at', { ascending: false }).limit(1),
    admin.from('weekly_checkins').select('week_number, form_type, submitted_at').eq('client_id', clientId).order('week_number', { ascending: false }).limit(4),
    admin.from('intakes').select('primary_goal, secondary_goals, desired_timeline, training_days_available, injury_location_current, injury_primary_concern').eq('client_id', clientId).order('submitted_at', { ascending: false }).limit(1),
  ])

  const cffs = cffsRows?.[0] ?? null
  const cfws = cfwsRows?.[0] ?? null
  const program = programRows?.[0] ?? null
  const nutrition = nutritionRows?.[0] ?? null
  const intake = intakeRows?.[0] ?? null

  const S: string[] = []
  S.push(`CLIENT: ${client.name}`)

  if (intake) {
    const bits: string[] = []
    if (intake.primary_goal) bits.push(`Primary goal: ${intake.primary_goal}`)
    if (intake.secondary_goals) bits.push(`Secondary goals: ${intake.secondary_goals}`)
    if (intake.desired_timeline) bits.push(`Desired timeline: ${intake.desired_timeline}`)
    if (intake.training_days_available) bits.push(`Training days available: ${JSON.stringify(intake.training_days_available)}`)
    if (intake.injury_location_current) bits.push(`Current injuries: ${JSON.stringify(intake.injury_location_current)}`)
    if (intake.injury_primary_concern) bits.push(`Primary injury concern: ${intake.injury_primary_concern}`)
    if (bits.length) S.push(`\nFROM INTAKE:\n${bits.join('\n')}`)
  }

  if (cffs) {
    S.push(`\nFOUNDATIONAL SYNTHESIS (CFFS):`)
    S.push(`Body state: ${cffs.body_state_classification} · Resolution: ${cffs.resolution_state}`)
    S.push(`Readiness — capacity: ${cffs.exposure_readiness_capacity}, schedule: ${cffs.exposure_readiness_schedule}, regulation: ${cffs.exposure_readiness_regulation}, behaviour: ${cffs.exposure_readiness_behaviour}`)
    const sum = fmtSummary(cffs.rationale_summary)
    if (sum) S.push(`At-a-glance summary:\n${sum}`)
    const sections: Array<[string, string | null]> = [
      ['Client context', cffs.client_context_summary],
      ['Primary patterns & signals', cffs.primary_patterns_and_signals],
      ['Capacity constraints & guardrails', cffs.capacity_constraints_and_guardrails],
      ['Risk flags & watch items', cffs.risk_flags_and_watch_items],
      ['Tensions & trade-offs', cffs.tensions_and_tradeoffs],
      ['Explicit non-directives', cffs.explicit_non_directives],
      ['Closing interpretive notes', cffs.closing_interpretive_notes],
    ]
    for (const [label, val] of sections) if (val) S.push(`${label}: ${val}`)
  } else {
    S.push(`\nFOUNDATIONAL SYNTHESIS (CFFS): none yet.`)
  }

  if (cfws) {
    S.push(`\nLATEST WEEKLY SYNTHESIS (CFWS) — week ${cfws.week_number}:`)
    S.push(`Resolution: ${cfws.resolution_state}`)
    const sum = fmtSummary(cfws.rationale_summary)
    if (sum) S.push(`At-a-glance summary:\n${sum}`)
    const sections: Array<[string, string | null]> = [
      ['Context snapshot', cfws.client_context_snapshot],
      ['Dominant weekly patterns', cfws.dominant_weekly_patterns],
      ['Weekly capacity constraints', cfws.weekly_capacity_constraints],
      ['Weekly risk flags', cfws.weekly_risk_flags],
    ]
    for (const [label, val] of sections) if (val) S.push(`${label}: ${val}`)
  }

  if (program) {
    const progLabel = program.status === 'draft'
      ? 'DRAFT TRAINING PROGRAM (pending coach approval — review it before it is published)'
      : 'ACTIVE TRAINING PROGRAM'
    S.push(`\n${progLabel}: ${program.block_name} — ${program.progression_phase}, ${program.training_goal}, ${program.training_frequency}x/week, ${program.week_duration} weeks`)
    const sum = fmtSummary(program.rationale_summary)
    if (sum) S.push(sum)
    const sess = fmtSessions(program.sessions)
    if (sess) S.push(`Prescribed sessions (review against phase + gates):\n${sess}`)
  } else {
    S.push(`\nTRAINING PROGRAM: none (no draft or active program on file).`)
  }

  if (nutrition) {
    const nutLabel = nutrition.status === 'draft'
      ? 'DRAFT NUTRITION PLAN (pending coach approval — review it before it is published)'
      : 'ACTIVE NUTRITION PLAN'
    S.push(`\n${nutLabel}: ${nutrition.plan_name ?? ''} — entry state ${nutrition.entry_state}, carb demand ${nutrition.carb_demand_level}`)
    const es: any = nutrition.entry_state_summary
    if (es && typeof es === 'object' && es.current_focus) S.push(`Current focus: ${es.current_focus}${es.what_this_means ? ` — ${es.what_this_means}` : ''}`)
    const meals = fmtMeals(nutrition.meals, nutrition.protein_anchor_g, nutrition.estimated_calorie_band)
    if (meals) S.push(`Prescribed nutrition (review against anchor + phase):\n${meals}`)
    const rules: any = nutrition.execution_rules
    if (Array.isArray(rules) && rules.length) {
      S.push(`Stated execution rules — RECONCILE every numeric claim here against the ACTUAL TOTALS above and flag any mismatch (e.g. a rule says "carbs fixed at ~100g/day" but the meals total more; a rule says "even ~32g protein per meal" but the spread is uneven):\n${rules.map((r: string) => `• ${r}`).join('\n')}`)
    }
  } else {
    S.push(`\nNUTRITION PLAN: none (no draft or active plan on file).`)
  }

  if (client.medications) {
    S.push(`\nMEDICATIONS: ${client.medications}`)
    const ma: any = client.medications_analysis
    if (ma && typeof ma === 'object' && ma.combined_picture) S.push(`Combined picture: ${ma.combined_picture}`)
  }

  if (checkinRows && checkinRows.length) {
    const weeks = Array.from(new Set(checkinRows.map((c: any) => c.week_number))).slice(0, 3)
    S.push(`\nRECENT CHECK-INS: weeks ${weeks.join(', ')} submitted.`)
  }

  return { clientName: client.name, coachId: client.coach_id ?? null, context: S.join('\n') }
}
