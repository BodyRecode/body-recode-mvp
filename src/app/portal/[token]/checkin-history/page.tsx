import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import ClientHeader from '@/components/client-header'
import Link from 'next/link'

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

  const grouped = (checkins || []).reduce((acc, c) => {
    const key = `Week ${c.week_number}`
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {} as Record<string, typeof checkins>)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <ClientHeader />
      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-8">
          <Link href={`/portal/${token}`} className="text-[#57534e] hover:text-[#d4cfc9] text-sm transition-colors">← Back</Link>
          <h1 className="text-2xl font-bold text-white mt-4 mb-1">Check-in History</h1>
          <p className="text-[#a8a29e] text-sm">All your weekly check-in submissions.</p>
        </div>

        {!checkins || checkins.length === 0 ? (
          <div className="rounded-2xl border border-[#1c1917] bg-[#111110] p-6 text-center">
            <p className="text-[#57534e] text-sm">No check-ins submitted yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([weekLabel, entries]) => (
              <div key={weekLabel} className="bg-[#111110] border border-[#1c1917] rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-[#1c1917]">
                  <p className="text-xs font-bold text-[#57534e] uppercase tracking-widest">{weekLabel}</p>
                </div>
                <div className="divide-y divide-[#1c1917]/60">
                  {(entries || []).map((c) => (
                    <div key={c.id} className="px-5 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-[#14b8a6]/10 border border-[#14b8a6]/20 flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-[#14b8a6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-sm text-white font-medium">Form {c.form_type}</p>
                      </div>
                      <p className="text-xs text-[#57534e]">
                        {new Date(c.submitted_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="h-10" />
      </div>
    </div>
  )
}
