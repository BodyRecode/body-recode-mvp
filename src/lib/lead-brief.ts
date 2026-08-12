/**
 * Assemble a Zoom 1 brief for a lead, live, from whatever is currently on file.
 *
 * Why live rather than the stored `leads.pre_call_brief` column: that column is
 * written once at scorecard submit. On 2026-08-12 a lead turned up to a booked
 * call whose stored brief predated her pre-call form, so it knew nothing about
 * her diagnosed condition, her medication or her shift roster — the three things
 * that mattered most. A snapshot taken before the most important input arrives
 * is worse than no snapshot, because it looks authoritative.
 *
 * The stored column is kept as a fallback for leads with no scorecard data.
 */
import {
  generatePreCallBrief,
  generateInPersonSessionSupplement,
  detectScopeFlags,
  buildBriefSummary,
  type LeadBriefInput,
  type ScopeFlag,
  type BriefSummary,
} from '@/lib/pre-call-brief'
import type {
  StateName, SectionScores, BiologicalSex, AgeBand, FatStorage, CycleStatus,
} from '@/lib/fat-map-profile'

type AnswerLetter = 'A' | 'B' | 'C' | 'D'

export interface LeadRowForBrief {
  name: string
  scorecard_score: number | null
  scorecard_body_state: string | null
  scorecard_section_scores: SectionScores | null
  approach_response: string | null
  investment_readiness: string | null
  lead_quality: string | null
  biological_sex: string | null
  age_band: string | null
  fat_storage: string | null
  cycle_status: string | null
  pre_call_brief: string | null
}

export interface EventRowForBrief {
  type: string
  notes: string | null
  sent_at: string
}

export interface LeadBriefBundle {
  /** Null when the lead has no scorecard data to build from. */
  brief: string | null
  /** In-person AF Newstead runsheet. Generated on demand, never stored. */
  supplement: string | null
  /** Their verbatim pre-call form answers, if completed. */
  prepNotes: string | null
  scopeFlags: ScopeFlag[]
  /** Glanceable card data. Null when there is no scorecard to build from. */
  summary: BriefSummary | null
  /** True when the brief came from the stored column rather than being built now. */
  isStoredFallback: boolean
}

const VALID_STATES: StateName[] = ['Depleted State', 'Transitioning State', 'Ready State']

function letter(v: string | null): AnswerLetter | null {
  return v === 'A' || v === 'B' || v === 'C' || v === 'D' ? v : null
}

export function buildLeadBrief(
  lead: LeadRowForBrief,
  events: EventRowForBrief[] | null,
  callDate?: string | null,
): LeadBriefBundle {
  // Most recent prep form submission wins. Events arrive newest-first from the
  // page query, but sort defensively so a caller passing them the other way up
  // does not silently get the oldest answers.
  const prepEvent = (events ?? [])
    .filter(e => e.type === 'prep_form_completed' && e.notes)
    .sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime())[0]
  const prepNotes = prepEvent?.notes ?? null

  const state = lead.scorecard_body_state as StateName | null
  const canBuild = lead.scorecard_score != null && state != null && VALID_STATES.includes(state)

  if (!canBuild) {
    return {
      brief: lead.pre_call_brief ?? null,
      supplement: null,
      prepNotes,
      scopeFlags: detectScopeFlags(prepNotes),
      summary: null,
      isStoredFallback: !!lead.pre_call_brief,
    }
  }

  const input: LeadBriefInput = {
    name: lead.name,
    scorecard_score: lead.scorecard_score as number,
    scorecard_body_state: state as StateName,
    scorecard_section_scores: lead.scorecard_section_scores ?? {},
    approach_response: letter(lead.approach_response),
    investment_readiness: letter(lead.investment_readiness),
    lead_quality: (lead.lead_quality as 'green' | 'yellow' | 'red' | null) ?? null,
    biological_sex: (lead.biological_sex as BiologicalSex | null) ?? null,
    age_band: (lead.age_band as AgeBand | null) ?? null,
    fat_storage: (lead.fat_storage as FatStorage | null) ?? null,
    cycle_status: (lead.cycle_status as CycleStatus | null) ?? null,
    prep_notes: prepNotes,
    call_date: callDate ?? null,
  }

  return {
    brief: generatePreCallBrief(input),
    supplement: generateInPersonSessionSupplement(input),
    prepNotes,
    scopeFlags: detectScopeFlags(prepNotes),
    summary: buildBriefSummary(input),
    isStoredFallback: false,
  }
}
