/**
 * Shared per-artefact audit logic.
 *
 * Given a client + artefact type, run every check that applies to it:
 *   - Banned-jargon scan via findLeakedTerms
 *   - Doctrine-version freshness via isDoctrineStale
 *   - Substitution-equivalence + macro arithmetic (nutrition only, via the
 *     existing validateNutritionPlan)
 *
 * Returns a structured ArtefactAuditResult that the dashboard panel
 * (system-health/banned-terms-audit) AND the per-client pill render from.
 * Single source of truth so the two views can't drift.
 *
 * Added 2026-06-09 (item H — pre-publish dry-run preview UI).
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { findLeakedTerms } from './banned-client-terms'
import { DOCTRINE_VERSIONS, isDoctrineStale, type DoctrineKey } from './doctrine-versions'

export type AuditStatus = 'green' | 'amber' | 'red'

export interface AuditIssue {
  code: string
  severity: 'error' | 'warning'
  message: string
}

export interface ArtefactAuditResult {
  artefactType: 'fr' | 'pr' | 'nr' | 'tr' | 'mr'
  artefactLabel: string
  artefactId: string | null
  status: AuditStatus
  storedDoctrineVersion: string | null
  currentDoctrineVersion: string
  isStale: boolean
  leakedTerms: string[]
  issues: AuditIssue[]
  publishedAt: string | null
}

export async function auditFoundationalReading(
  admin: SupabaseClient,
  clientId: string,
): Promise<ArtefactAuditResult | null> {
  const { data: rows } = await admin
    .from('cffs')
    .select('id, cr_where_you_are, cr_what_your_body_is_telling_us, cr_what_were_focusing_on_first, cr_what_were_not_doing_yet, cr_coach_note, client_reading_published_at, fr_doctrine_version')
    .eq('client_id', clientId)
    .eq('is_archived', false)
    .not('client_reading_published_at', 'is', null)
    .order('client_reading_published_at', { ascending: false })
    .limit(1)
  const r = rows?.[0]
  if (!r) return null

  const leakedTerms = uniqueLower([
    ...findLeakedTerms(r.cr_where_you_are ?? ''),
    ...findLeakedTerms(r.cr_what_your_body_is_telling_us ?? ''),
    ...findLeakedTerms(r.cr_what_were_focusing_on_first ?? ''),
    ...findLeakedTerms(r.cr_what_were_not_doing_yet ?? ''),
    ...findLeakedTerms(r.cr_coach_note ?? ''),
  ])
  const isStale = isDoctrineStale(r.fr_doctrine_version, 'foundational_reading')
  return finalise({
    artefactType: 'fr',
    artefactLabel: 'Foundational Reading',
    artefactId: r.id,
    leakedTerms,
    storedDoctrineVersion: r.fr_doctrine_version ?? null,
    currentDoctrineVersion: DOCTRINE_VERSIONS.foundational_reading,
    isStale,
    issues: [],
    publishedAt: r.client_reading_published_at,
  })
}

export async function auditProgramReading(
  admin: SupabaseClient,
  clientId: string,
): Promise<ArtefactAuditResult | null> {
  const { data: prog } = await admin
    .from('programs')
    .select('id, block_name, pr_why_this_block, pr_what_this_program_is_doing, pr_how_well_know_its_working, pr_what_were_not_doing_yet, pr_coach_note, program_reading_published_at, pr_doctrine_version')
    .eq('client_id', clientId)
    .eq('is_active', true)
    .not('program_reading_published_at', 'is', null)
    .maybeSingle()
  if (!prog) return null

  const leakedTerms = uniqueLower([
    ...findLeakedTerms(prog.pr_why_this_block ?? ''),
    ...findLeakedTerms(prog.pr_what_this_program_is_doing ?? ''),
    ...findLeakedTerms(prog.pr_how_well_know_its_working ?? ''),
    ...findLeakedTerms(prog.pr_what_were_not_doing_yet ?? ''),
    ...findLeakedTerms(prog.pr_coach_note ?? ''),
  ])
  const isStale = isDoctrineStale(prog.pr_doctrine_version, 'program_reading')
  return finalise({
    artefactType: 'pr',
    artefactLabel: prog.block_name ? `Program Reading (${prog.block_name})` : 'Program Reading',
    artefactId: prog.id,
    leakedTerms,
    storedDoctrineVersion: prog.pr_doctrine_version ?? null,
    currentDoctrineVersion: DOCTRINE_VERSIONS.program_reading,
    isStale,
    issues: [],
    publishedAt: prog.program_reading_published_at,
  })
}

export async function auditNutritionPlan(
  admin: SupabaseClient,
  clientId: string,
): Promise<ArtefactAuditResult | null> {
  const { data: np } = await admin
    .from('nutrition_plans')
    .select('id, plan_name, nr_why_this_plan, nr_what_this_nutrition_is_doing, nr_how_well_know_its_working, nr_what_were_not_doing_yet, nr_coach_note, nutrition_reading_published_at, doctrine_version, meals, estimated_calorie_band, protein_anchor_g, carb_demand_level, entry_state, substitution_options')
    .eq('client_id', clientId)
    .eq('is_active', true)
    .maybeSingle()
  if (!np) return null

  const leakedTerms = uniqueLower([
    ...findLeakedTerms(np.nr_why_this_plan ?? ''),
    ...findLeakedTerms(np.nr_what_this_nutrition_is_doing ?? ''),
    ...findLeakedTerms(np.nr_how_well_know_its_working ?? ''),
    ...findLeakedTerms(np.nr_what_were_not_doing_yet ?? ''),
    ...findLeakedTerms(np.nr_coach_note ?? ''),
  ])
  const isStale = isDoctrineStale(np.doctrine_version, 'nutrition_reading')

  const issues: AuditIssue[] = []
  try {
    const { validateNutritionPlan } = await import('./nutrition-validation')
    const { data: client } = await admin.from('clients').select('medications').eq('id', clientId).maybeSingle()
    const { data: baseline } = await admin
      .from('baselines')
      .select('bodyweight_kg')
      .eq('client_id', clientId)
      .order('captured_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    const result = validateNutritionPlan({
      meals: np.meals ?? [],
      estimated_calorie_band: np.estimated_calorie_band ?? null,
      protein_anchor_g: Number(np.protein_anchor_g) || 0,
      bodyweight_kg: baseline?.bodyweight_kg ?? null,
      entry_state: String(np.entry_state ?? ''),
      medications: client?.medications ?? null,
      carb_demand_level: (np.carb_demand_level as 'low' | 'moderate' | 'high' | null) ?? null,
      substitution_options: np.substitution_options ?? null,
    })
    for (const v of result.issues) {
      issues.push({
        code: v.code,
        severity: (v.severity ?? 'error') as 'error' | 'warning',
        message: v.message,
      })
    }
  } catch (err) {
    issues.push({
      code: 'AUDIT_RUN_ERROR',
      severity: 'warning',
      message: `Nutrition audit threw: ${(err as Error).message}`,
    })
  }

  return finalise({
    artefactType: 'nr',
    artefactLabel: np.plan_name ? `Nutrition Plan (${np.plan_name})` : 'Nutrition Plan',
    artefactId: np.id,
    leakedTerms,
    storedDoctrineVersion: np.doctrine_version ?? null,
    currentDoctrineVersion: DOCTRINE_VERSIONS.nutrition_reading,
    isStale,
    issues,
    publishedAt: np.nutrition_reading_published_at,
  })
}

function finalise(args: Omit<ArtefactAuditResult, 'status'>): ArtefactAuditResult {
  const status = computeStatus(args.leakedTerms, args.isStale, args.issues)
  return { ...args, status }
}

function computeStatus(
  leaks: string[],
  isStale: boolean,
  issues: AuditIssue[],
): AuditStatus {
  const hasError = issues.some(i => i.severity === 'error')
  if (leaks.length > 0 || hasError) return 'red'
  const hasWarning = issues.some(i => i.severity === 'warning')
  if (isStale || hasWarning) return 'amber'
  return 'green'
}

function uniqueLower(arr: string[]): string[] {
  return Array.from(new Set(arr.map(t => t.toLowerCase())))
}

export function doctrineKeyLabel(key: DoctrineKey): string {
  switch (key) {
    case 'foundational_reading': return 'Foundational Reading'
    case 'program_reading': return 'Program Reading'
    case 'nutrition_reading': return 'Nutrition Reading'
    case 'trajectory_reading': return 'Trajectory Reading'
    case 'weekly_checkin_feedback': return 'Weekly Check-In Feedback'
    case 'medications_analysis': return 'Medications Analysis'
    case 'medications_reading': return 'Medications Reading'
    case 'blood_panel_reading': return 'Blood Panel Reading'
    case 'blood_panel_analysis': return 'Blood Panel Analysis'
    case 'cffs': return 'Foundational Synthesis'
    case 'program': return 'Training Program'
    case 'nutrition_plan': return 'Nutrition Plan'
  }
}
