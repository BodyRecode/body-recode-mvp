import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import ZoomCompanion from './zoom-companion'
import { buildLeadBrief } from '@/lib/lead-brief'
import { buildCallFlow, type CallStage } from '@/lib/pre-call-brief'
import type { StateName, SectionScores, BiologicalSex, AgeBand, FatStorage, CycleStatus } from '@/lib/fat-map-profile'

const VALID_STATES: StateName[] = ['Depleted State', 'Transitioning State', 'Ready State']

export default async function ZoomCompanionPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = createAdminClient()
  const { id } = await params

  const { data: lead } = await admin.from('leads').select('*').eq('id', id).single()
  if (!lead) notFound()

  const [{ data: events }, { data: bookings }] = await Promise.all([
    admin.from('lead_events').select('type, subject, notes, sent_at').eq('lead_id', id).order('sent_at', { ascending: false }),
    admin.from('be_bookings').select('scheduled_at, status').eq('lead_id', id).eq('status', 'scheduled').order('scheduled_at', { ascending: true }).limit(1),
  ])

  const callDate = bookings?.[0]
    ? new Date(bookings[0].scheduled_at).toLocaleString('en-AU', {
        timeZone: 'Australia/Brisbane', weekday: 'short', day: 'numeric', month: 'short',
        hour: 'numeric', minute: '2-digit', hour12: true,
      })
    : null

  // Same builder the lead page uses, so the companion and the written brief are
  // generated from one source and cannot disagree mid-call.
  const { summary, scopeFlags, prepNotes } = buildLeadBrief(lead, events, callDate)

  const state = lead.scorecard_body_state as StateName | null
  const stages: CallStage[] = (lead.scorecard_score != null && state && VALID_STATES.includes(state))
    ? buildCallFlow({
        name: lead.name,
        scorecard_score: lead.scorecard_score,
        scorecard_body_state: state,
        scorecard_section_scores: (lead.scorecard_section_scores ?? {}) as SectionScores,
        approach_response: lead.approach_response,
        investment_readiness: lead.investment_readiness,
        lead_quality: lead.lead_quality,
        biological_sex: lead.biological_sex as BiologicalSex | null,
        age_band: lead.age_band as AgeBand | null,
        fat_storage: lead.fat_storage as FatStorage | null,
        cycle_status: lead.cycle_status as CycleStatus | null,
        prep_notes: prepNotes,
        call_date: callDate,
      })
    : []

  return (
    <ZoomCompanion
      leadId={id}
      leadName={lead.name}
      stages={stages}
      summary={summary}
      scopeFlags={scopeFlags}
      initialNotes={lead.notes ?? ''}
      initialStatus={lead.status ?? ''}
    />
  )
}
