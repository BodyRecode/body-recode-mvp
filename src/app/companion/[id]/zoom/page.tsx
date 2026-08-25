import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import ZoomCompanion from './zoom-companion'
import { buildLeadBrief } from '@/lib/lead-brief'
import type { Arrival } from '@/lib/companion-content'

export default async function ZoomCompanionPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = createAdminClient()
  const { id } = await params

  const { data: lead } = await admin.from('leads').select('*').eq('id', id).single()
  if (!lead) notFound()

  const [{ data: events }, { data: bookings }, { data: enrollment }] = await Promise.all([
    admin.from('lead_events').select('type, subject, notes, sent_at').eq('lead_id', id).order('sent_at', { ascending: false }),
    admin.from('be_bookings').select('scheduled_at, status').eq('lead_id', id).eq('status', 'scheduled').order('scheduled_at', { ascending: true }).limit(1),
    admin.from('challenge_enrollments').select('id').eq('lead_id', id).maybeSingle(),
  ])

  // Decides which thank-you line opens the call. Someone who ran the Challenge
  // did not "reach out" and should not be greeted as though they did.
  const arrival: Arrival = enrollment ? 'challenge' : lead.scorecard_score != null ? 'scorecard' : 'direct'

  const callDate = bookings?.[0]
    ? new Date(bookings[0].scheduled_at).toLocaleString('en-AU', {
        timeZone: 'Australia/Brisbane', weekday: 'short', day: 'numeric', month: 'short',
        hour: 'numeric', minute: '2-digit', hour12: true,
      })
    : null

  // Same builder the lead page uses, so the companion and the written brief are
  // generated from one source and cannot disagree mid-call.
  const { summary, scopeFlags, prepNotes } = buildLeadBrief(lead, events, callDate)

  return (
    <ZoomCompanion
      leadId={id}
      leadName={lead.name}
      bodyState={(lead.scorecard_body_state as string) ?? 'Transitioning State'}
      totalScore={lead.scorecard_score as number | null}
      summary={summary}
      scopeFlags={scopeFlags}
      prepNotes={prepNotes}
      arrival={arrival}
      biologicalSex={(lead.biological_sex as 'M' | 'F' | null) ?? null}
      initialNotes={lead.notes ?? ''}
    />
  )
}
