import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import PortalPageShell from '../portal-page-shell'

export default async function CheckinHistoryPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name')
    .eq('onboarding_token', token)
    .maybeSingle()

  if (!client) return notFound()

  const { data: checkins } = await admin
    .from('weekly_checkins')
    .select('id, week_number, form_type, submitted_at')
    .eq('client_id', client.id)
    .order('submitted_at', { ascending: false })

  const ids = (checkins ?? []).map(c => c.id)
  const { data: feedbackRows } = ids.length > 0
    ? await admin
        .from('weekly_checkin_feedback')
        .select('weekly_checkin_id')
        .in('weekly_checkin_id', ids)
    : { data: [] as Array<{ weekly_checkin_id: string }> }
  const feedbackSet = new Set((feedbackRows ?? []).map(r => r.weekly_checkin_id))

  const grouped = (checkins || []).reduce((acc, c) => {
    const key = `Week ${c.week_number}`
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {} as Record<string, typeof checkins>)

  return (
    <PortalPageShell
      backHref={`/portal/${token}`}
      eyebrow="Check-in History"
      title="Check-in history"
      description="All your weekly check-in submissions."
    >
      {!checkins || checkins.length === 0 ? (
          <div className="rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF] p-6 text-center">
            <p className="text-[#999999] text-sm">No check-ins submitted yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([weekLabel, entries]) => (
              <div key={weekLabel} className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-[#E5E5E5]">
                  <p className="text-xs font-bold text-[#999999] uppercase tracking-widest">{weekLabel}</p>
                </div>
                <div className="divide-y divide-[#E5E5E5]/60">
                  {(entries || []).map((c) => (
                    <Link
                      key={c.id}
                      href={`/portal/${token}/checkin/${c.week_number}/${c.form_type.toLowerCase()}`}
                      className="px-5 py-3 flex items-center justify-between hover:bg-[#E5E5E5]/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                          <svg className="w-3.5 h-3.5 text-[#1B6DFC]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-sm text-[#1A1A1A] font-medium">Form {c.form_type}</p>
                        {feedbackSet.has(c.id) && (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#1B6DFC] bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">Coach response</span>
                        )}
                      </div>
                      <p className="text-xs text-[#999999] ml-3 shrink-0">
                        {new Date(c.submitted_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
          ))}
        </div>
      )}
    </PortalPageShell>
  )
}
