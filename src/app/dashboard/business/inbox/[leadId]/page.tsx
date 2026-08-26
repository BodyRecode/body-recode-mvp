import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Calendar, FileText, Send, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'
import InboxCompose from './inbox-compose'

const EVENT_CONFIG: Record<string, { label: string; icon: typeof Mail; colour: string }> = {
  email_sent: { label: 'You', icon: Mail, colour: 'text-[#1B6DFC]' },
  email_received: { label: 'Reply received', icon: Mail, colour: 'text-[#1056D6]' },
  zoom_booked: { label: 'Zoom booked', icon: Calendar, colour: 'text-[#1B6DFC]' },
  check_in_submitted: { label: 'Check-in submitted', icon: FileText, colour: 'text-[#666D7A]' },
  followup_scheduled: { label: 'Follow-up scheduled', icon: Send, colour: 'text-[#A96A12]' },
  followup_cancelled: { label: 'Follow-up cancelled', icon: AlertCircle, colour: 'text-[#666D7A]' },
  reengagement_sent: { label: 'Re-engagement sent', icon: Mail, colour: 'text-[#1B6DFC]' },
  orientation_sent: { label: 'Orientation sent', icon: Mail, colour: 'text-[#1B6DFC]' },
  noshow_sequence_scheduled: { label: 'No-show sequence started', icon: RefreshCw, colour: 'text-[#A96A12]' },
  report_scheduled: { label: 'Report scheduled', icon: FileText, colour: 'text-[#666D7A]' },
}

export default async function InboxThreadPage({
  params,
}: {
  params: Promise<{ leadId: string }>
}) {
  const { leadId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = createAdminClient()

  const [{ data: lead }, { data: events }] = await Promise.all([
    supabase
      .from('leads')
      .select('id, name, email, phone, status')
      .eq('id', leadId)
      .or(`coach_id.eq.${user!.id},coach_id.is.null`)
      .single(),
    admin
      .from('lead_events')
      .select('*')
      .eq('lead_id', leadId)
      .order('sent_at', { ascending: true }),
  ])

  if (!lead) notFound()

  return (
    <div className="max-w-2xl flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 br-page-header sticky top-0 z-20 mb-7 pt-4 pb-3.5 border-b border-[#E8EAEE] bg-white/[0.88] backdrop-blur-md print:static print:bg-transparent">
        <Link
          href="/dashboard/business/inbox"
          className="p-1.5 text-[#666D7A] hover:text-[#141821] transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-[#141821]">{lead.name}</h1>
          <div className="flex items-center gap-3 text-[12.5px] text-[#666D7A]">
            {lead.email && <span>{lead.email}</span>}
            {lead.phone && <span>{lead.phone}</span>}
            <Link
              href={`/dashboard/business/crm/${lead.id}`}
              className="text-[#1B6DFC] hover:text-[#1B6DFC] transition-colors"
            >
              View in CRM →
            </Link>
          </div>
        </div>
      </div>

      {/* Thread */}
      <div className="flex-1 space-y-3 mb-6">
        {events && events.length > 0 ? (
          events.map((event: any) => {
            const cfg = EVENT_CONFIG[event.type] ?? { label: event.type, icon: Mail, colour: 'text-[#666D7A]' }
            const Icon = cfg.icon

            return (
              <div key={event.id} className={`border rounded-xl p-4 ${event.type === 'email_received' ? 'bg-[#EFF1F4]/60 border-[#1B6DFC]/20' : 'bg-[#F4F6F9] border-[#E8EAEE]'}`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    <Icon size={13} className={cfg.colour} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-xs font-medium ${cfg.colour}`}>{cfg.label}</p>
                      <p className="text-[12.5px] text-[#98A0AD]">
                        {new Date(event.sent_at).toLocaleString('en-AU', {
                          day: 'numeric', month: 'short',
                          hour: 'numeric', minute: '2-digit', hour12: true,
                          timeZone: 'Australia/Brisbane',
                        })}
                      </p>
                    </div>
                    {event.subject && (
                      <p className="text-sm font-medium text-[#141821] mb-1">{event.subject}</p>
                    )}
                    {event.notes && (
                      <p className="text-sm text-[#666D7A] leading-relaxed whitespace-pre-line">{event.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center py-12 text-[#98A0AD] text-sm">
            No activity yet - send an email to start the conversation.
          </div>
        )}
      </div>

      {/* Compose */}
      {lead.email && (
        <InboxCompose leadId={lead.id} leadName={lead.name} leadEmail={lead.email} />
      )}
      {!lead.email && (
        <div className="bg-[#F4F6F9] br-card p-4 text-[#666D7A] text-sm text-center">
          No email address on file - can't send from here.
        </div>
      )}
    </div>
  )
}
