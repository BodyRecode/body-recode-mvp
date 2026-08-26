import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Send, Inbox } from 'lucide-react'
import { EMAIL_SEQUENCE } from '@/lib/booking-agent/sequence'
import OutreachTouchCard from './outreach-touch-card'

export const dynamic = 'force-dynamic'

const stepLabel: Record<string, string> = Object.fromEntries(
  EMAIL_SEQUENCE.map(t => [t.key, `Touch ${t.index} · ${t.label}`]),
)

const stateChip: Record<string, string> = {
  'Depleted State': 'bg-[#FDEDED] text-[#C82626] border-[#F5C9C9]',
  'Transitioning State': 'bg-[#FDF6E9] text-[#A96A12] border-[#F1DEB8]',
  'Ready State': 'bg-[rgba(27,109,252,0.08)] text-[#1056D6] border-[#B5CFFC]',
}

interface TouchRow {
  id: string
  lead_id: string
  step_key: string
  step_index: number
  status: string
  subject: string | null
  body_text: string | null
  ai_model: string | null
  edited: boolean
  created_at: string
  leads: { id: string; name: string | null; email: string | null; scorecard_body_state: string | null; fat_storage: string | null } | null
}

export default async function OutreachQueuePage() {
  // Auth gate (dashboard layout already protects, belt-and-braces here).
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return <div className="max-w-3xl p-6 text-[#666D7A]">Please sign in.</div>
  }

  const admin = createAdminClient()
  const { data } = await admin
    .from('outreach_touches')
    .select('id, lead_id, step_key, step_index, status, subject, body_text, ai_model, edited, created_at, leads(id, name, email, scorecard_body_state, fat_storage)')
    .eq('status', 'drafted')
    .order('created_at', { ascending: true })
    .limit(100)

  const touches = (data ?? []) as unknown as TouchRow[]

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between br-page-header sticky top-0 z-20 mb-7 pt-4 pb-3.5 border-b border-[#E8EAEE] bg-white/[0.88] backdrop-blur-md print:static print:bg-transparent">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.025em] mb-1">Booking Agent</h1>
          <p className="text-[#666D7A] text-sm">
            {touches.length} draft{touches.length === 1 ? '' : 's'} waiting for approval
          </p>
        </div>
        <div className="flex items-center gap-2 text-[12.5px] text-[#666D7A] bg-[#FBFCFD] border border-[#E8EAEE] rounded-lg px-3 py-2">
          <Send className="w-3.5 h-3.5" />
          Nothing sends until you approve it
        </div>
      </div>

      {touches.length === 0 ? (
        <div className="br-card p-10 text-center">
          <Inbox className="w-8 h-8 text-[#E8EAEE] mx-auto mb-3" />
          <p className="text-[#666D7A] text-sm font-medium mb-1">The queue is clear</p>
          <p className="text-[#666D7A] text-sm">
            New scorecard leads get their first draft a day after they complete it. Approved and skipped drafts drop off this list.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {touches.map(touch => {
            const lead = touch.leads
            const name = lead?.name || 'Unknown lead'
            const bodyState = lead?.scorecard_body_state
            return (
              <div key={touch.id} className="br-card overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-5 py-3 bg-[#FBFCFD] border-b border-[#E8EAEE]">
                  <div className="flex items-center gap-3 min-w-0">
                    <Link href={`/dashboard/leads/${touch.lead_id}`} className="font-semibold text-[#141821] hover:text-[#1560E0] truncate">
                      {name}
                    </Link>
                    {bodyState && (
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${stateChip[bodyState] ?? 'bg-[#F4F6F9] text-[#666D7A] border-[#E8EAEE]'}`}>
                        {bodyState.replace(' State', '')}
                      </span>
                    )}
                  </div>
                  <span className="text-[12.5px] font-medium text-[#666D7A] whitespace-nowrap">
                    {stepLabel[touch.step_key] ?? touch.step_key}
                  </span>
                </div>
                <OutreachTouchCard
                  id={touch.id}
                  email={lead?.email ?? ''}
                  subject={touch.subject ?? ''}
                  bodyText={touch.body_text ?? ''}
                  aiModel={touch.ai_model ?? ''}
                  edited={touch.edited}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
