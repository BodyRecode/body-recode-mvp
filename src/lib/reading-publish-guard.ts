import type { SupabaseClient } from '@supabase/supabase-js'
import { lintClientReading, blockingFindings, type LintFinding } from './reading-lint'

/**
 * The gate every client-facing reading passes before it reaches a portal.
 *
 * Until 2026-08-01 there was no gate. All three readings published the instant
 * they were generated, so the first person to read a client's Foundational
 * Reading was the client. One of them asserted "everything going on with your
 * family" to a woman who had never mentioned family, and she ended her
 * engagement over it.
 *
 * Two changes together, and neither works alone:
 *   - Generation no longer publishes. A reading is a draft until a coach acts.
 *   - Publishing runs this guard, which refuses on a blocking finding.
 *
 * The lint is mechanical and modest. It catches assertions the source material
 * contradicts or never contained. It cannot tell you whether a reading is any
 * good, and a clean result means nothing was caught, not that it is right. The
 * coach still has to read it.
 */

const READING_SOURCES = {
  cffs: {
    table: 'cffs',
    sections: ['cr_where_you_are', 'cr_what_your_body_is_telling_us', 'cr_what_were_focusing_on_first', 'cr_what_were_not_doing_yet', 'cr_coach_note'],
    guidance: 'cr_coach_guidance',
    label: 'Foundational Reading',
  },
  program: {
    table: 'programs',
    sections: ['pr_why_this_block', 'pr_what_this_program_is_doing', 'pr_how_well_know_its_working', 'pr_what_were_not_doing_yet', 'pr_coach_note'],
    guidance: 'pr_coach_guidance',
    label: 'Program Reading',
  },
  nutrition: {
    table: 'nutrition_plans',
    sections: ['nr_why_this_plan', 'nr_what_this_nutrition_is_doing', 'nr_how_well_know_its_working', 'nr_what_were_not_doing_yet', 'nr_coach_note'],
    guidance: 'nr_coach_guidance',
    label: 'Nutrition Reading',
  },
  trajectory: {
    table: 'programs',
    sections: ['tr_where_this_block_started', 'tr_how_your_signal_moved', 'tr_what_held_steady', 'tr_what_this_sets_up_next', 'tr_coach_note', 'tr_state_rationale', 'tr_pattern_confidence_note'],
    guidance: 'tr_coach_guidance',
    label: 'Block-End / Progress Read',
  },
} as const

export type ReadingKind = keyof typeof READING_SOURCES

export interface PublishCheck {
  ok: boolean
  findings: LintFinding[]
  label: string
}

/**
 * @param rowId the cffs / programs / nutrition_plans row being published
 * @param clientId the client it belongs to
 */
export async function checkReadingBeforePublish(
  admin: SupabaseClient,
  kind: ReadingKind,
  rowId: string,
  clientId: string,
): Promise<PublishCheck> {
  const spec = READING_SOURCES[kind]

  const { data: row } = await admin
    .from(spec.table)
    .select([...spec.sections, spec.guidance].join(', '))
    .eq('id', rowId)
    .maybeSingle()

  if (!row) return { ok: false, label: spec.label, findings: [{ severity: 'block', code: 'NOT_FOUND', message: 'Reading not found.' }] }

  const r = row as unknown as Record<string, string | null>
  const sections: Record<string, string | null> = {}
  for (const f of spec.sections) sections[f] = r[f] ?? null

  // Everything the reading was entitled to know. Assembled from the same places
  // the generator read, so "not in the source" means exactly that.
  const [{ data: intake }, { data: cffs }, { data: nutrition }] = await Promise.all([
    admin.from('intakes').select('*').eq('client_id', clientId).order('submitted_at', { ascending: false }).limit(1).maybeSingle(),
    admin.from('cffs').select('client_context_summary, primary_patterns_and_signals, capacity_constraints_and_guardrails').eq('client_id', clientId).eq('is_archived', false).maybeSingle(),
    admin.from('nutrition_plans').select('energy_tdee_kcal, estimated_calorie_band').eq('client_id', clientId).eq('is_active', true).maybeSingle(),
  ])

  const sourceMaterial = [
    JSON.stringify(intake ?? {}),
    JSON.stringify(cffs ?? {}),
    r[spec.guidance] ?? '',
  ].join('\n')

  // Midpoint of the stated band, for the "you are not restricting" check.
  let planKcal: number | null = null
  const band = nutrition?.estimated_calorie_band ?? ''
  const nums = (String(band).match(/\d{3,4}/g) ?? []).map(Number)
  if (nums.length) planKcal = Math.round(nums.reduce((a, b) => a + b, 0) / nums.length)

  const findings = lintClientReading({
    sections,
    sourceMaterial,
    nutrition: nutrition?.energy_tdee_kcal ? { tdeeKcal: nutrition.energy_tdee_kcal, planKcal } : null,
    // The week check needs a dated event, which only suggest-plan resolves.
    // Left off here rather than half-guessed; the generator already carries the
    // temporal context that prevents most of these.
    event: null,
  })

  return { ok: blockingFindings(findings).length === 0, findings, label: spec.label }
}
