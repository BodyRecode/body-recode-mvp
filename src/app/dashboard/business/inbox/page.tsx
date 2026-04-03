import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Mail, Clock } from 'lucide-react'

const EVENT_LABELS: Record<string, string> = {
  email_sent: 'Email sent',
  zoom_booked: 'Zoom booked',
  check_in_submitted: 'Check-in submitted',
  followup_scheduled: 'Follow-up scheduled',
  followup_cancelled: 'Follow-up cancelled',
  reengagement_sent: 'Re-engagement sent',
  orientation_sent: 'Orientation sent',
  noshow_sequence_scheduled: 'No-show sequence started',
  report_scheduled: 'Report scheduled',
}

export default async function InboxPage() {
  const supabase = await createClient()

  // Leads with their most recent event
  const { data: leads } = await supabase
    .from('leads')
    .select('id, name, email, status, lead_events(type, subject, notes, sent_at)')
    .order('created_at', { ascending: false })

  // Sort by most recent event (or created_at as fallback)
  const sorted = (leads ?? []).map(lead => {
    const events = (lead.lead_events as Array<{ type: string; subject: string | null; notes: string | null; sent_at: string }>) ?? []
    const lastEvent = events.sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime())[0]
    return { ...lead, lastEvent, eventCount: events.length }
  }).sort((a, b) => {
    const aDate = a.lastEvent?.sent_at ?? '0'
    const bDate = b.lastEvent?.sent_at ?? '0'
    return bDate.localeCompare(aDate)
  })

  if (sorted.length === 0) {
    return (
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-1">Inbox</h1>
          <p className="text-stone-400 text-sm">One thread per contact — email history and outreach in one place</p>
        </div>
        <div className="bg-stone-900 border border-dashed border-stone-800 rounded-xl p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-stone-800 rounded-xl">
              <Mail size={24} className="text-stone-500" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-stone-400 text-sm font-medium mb-1">No contacts yet</p>
          <p className="text-stone-600 text-xs">Leads appear here as they come through your booking page or funnels</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">Inbox</h1>
        <p className="text-stone-400 text-sm">{sorted.length} contacts</p>
      </div>

      <div className="space-y-px">
        {sorted.map(lead => {
          const lastEvent = lead.lastEvent
          const preview = lastEvent?.subject || lastEvent?.notes?.slice(0, 60) || EVENT_LABELS[lastEvent?.type ?? ''] || 'No activity yet'
          const timeAgo = lastEvent ? formatRelative(new Date(lastEvent.sent_at)) : ''

          return (
            <Link
              key={lead.id}
              href={`/dashboard/business/inbox/${lead.id}`}
              className="flex items-center gap-4 bg-stone-900 border border-stone-800 first:rounded-t-xl last:rounded-b-xl -mb-px px-4 py-3.5 hover:bg-stone-800/50 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center shrink-0 text-xs font-medium text-stone-400 group-hover:border-teal-500/30 transition-colors">
                {lead.name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium text-white truncate">{lead.name}</p>
                  <p className="text-xs text-stone-600 truncate">{lead.email}</p>
                </div>
                <p className="text-xs text-stone-500 truncate">{preview}</p>
              </div>

              <div className="shrink-0 text-right">
                {timeAgo && (
                  <p className="text-xs text-stone-600">{timeAgo}</p>
                )}
                {lead.eventCount > 0 && (
                  <p className="text-xs text-stone-700 mt-0.5">{lead.eventCount} events</p>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function formatRelative(date: Date): string {
  const now = Date.now()
  const diff = now - date.getTime()
  const mins = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)

  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}
