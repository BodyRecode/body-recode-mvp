import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ZoomCompanion from './zoom-companion'

export default async function Zoom1Page({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single()

  if (!lead) notFound()

  // Get scorecard data from lead events
  const { data: events } = await supabase
    .from('lead_events')
    .select('type, notes')
    .eq('lead_id', id)
    .eq('type', 'scorecard_completed')
    .order('sent_at', { ascending: false })
    .limit(1)

  const scorecardEvent = events?.[0] ?? null
  const scorecardScore = scorecardEvent?.notes?.match(/Score: (\d+)\/15/)?.[1]
  const scorecardState = scorecardEvent?.notes?.match(/Body state: (.+?)\./)?.[1]

  // Section scores come from scorecard_reports table if available, or fall back to null
  const { data: report } = await supabase
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
