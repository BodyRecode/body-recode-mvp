import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import ZoomCompanion from './zoom-companion'

export default async function ZoomCompanionPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = createAdminClient()
  const { id } = await params

  const { data: lead } = await admin
    .from('leads')
    .select('*')
    .eq('id', id)
    .single()

  if (!lead) notFound()

  const { data: events } = await admin
    .from('lead_events')
    .select('type, notes')
    .eq('lead_id', id)
    .eq('type', 'scorecard_completed')
    .order('sent_at', { ascending: false })
    .limit(1)

  const scorecardEvent = events?.[0] ?? null
  const scorecardScore = scorecardEvent?.notes?.match(/Score: (\d+)\/15/)?.[1]
  const scorecardState = scorecardEvent?.notes?.match(/Body state: (.+?)\./)?.[1]

  const { data: report } = await admin
    .from('scorecard_reports')
    .select('section_scores, score, body_state')
    .eq('email', lead.email ?? '')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const bodyState = (report?.body_state ?? scorecardState ?? 'Transitioning State') as string
  const totalScore = report?.score ?? (scorecardScore ? parseInt(scorecardScore) : null)
  const sectionScores = (report?.section_scores as Record<string, number> | null) ?? null

  return (
    <ZoomCompanion
      leadName={lead.name}
      bodyState={bodyState}
      totalScore={totalScore}
      sectionScores={sectionScores}
      leadId={id}
      initialNotes={lead.notes ?? ''}
    />
  )
}
