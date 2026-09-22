import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Activity } from 'lucide-react'
import RunDetail from './run-detail'
import { PageHeader, Card, MONO_FONT, accentColour, EmptyState } from '@/components/dashboard/ui'

export default async function SystemHealthPage({
  searchParams,
}: {
  searchParams: Promise<{ run?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/dashboard/login')

  const { run: selectedRunId } = await searchParams
  const admin = createAdminClient()

  // Email that did not arrive. Resend reports success on acceptance, so until
  // the delivery webhook was built on 16 Sep 2026 a bounce looked exactly like
  // a delivery. Junk is still invisible: no provider reports it.
  const since = new Date(Date.now() - 30 * 86400000).toISOString()
  const [{ data: badEmail }, { count: deliveredCount }] = await Promise.all([
    admin.from('email_delivery_events')
      .select('id, event_type, to_address, subject, detail, occurred_at, client_id, lead_id')
      .in('event_type', ['bounced', 'complained', 'failed', 'delivery_delayed'])
      .gte('occurred_at', since)
      .order('occurred_at', { ascending: false })
      .limit(25),
    admin.from('email_delivery_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'delivered')
      .gte('occurred_at', since),
  ])

  const { data: runs } = await admin
    .from('health_check_runs')
    .select('id, ran_at, status, failures_count, fixes_count')
    .order('ran_at', { ascending: false })
    .limit(60)

  const selectedRun = selectedRunId
    ? await admin
        .from('health_check_runs')
        .select('*')
        .eq('id', selectedRunId)
        .single()
        .then(r => r.data)
    : runs?.[0]
      ? await admin
          .from('health_check_runs')
          .select('*')
          .eq('id', runs[0].id)
          .single()
          .then(r => r.data)
      : null

  const teal = accentColour('teal')
  const amber = accentColour('amber')
  const red = accentColour('red')

  return (
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow="Diagnostics"
        title="System Health"
        subtitle="Daily automated checks across all platform processes."
      />

      {/* Sub-page links — engine-specific dashboards live under here. */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/dashboard/system-health/nutrition-engine"
          className="inline-flex items-center gap-2 px-3 py-1.5 text-[12.5px] font-semibold border border-[#E8EAEE] text-[#141821] rounded-lg hover:border-[#CFD4DC] hover:text-[#141821] transition-colors"
        >
          Nutrition engine telemetry →
        </Link>
        <Link
          href="/dashboard/system-health/banned-terms-audit"
          className="inline-flex items-center gap-2 px-3 py-1.5 text-[12.5px] font-semibold border border-[#E8EAEE] text-[#141821] rounded-lg hover:border-[#CFD4DC] hover:text-[#141821] transition-colors"
        >
          Banned-terms audit →
        </Link>
        <Link
          href="/dashboard/system-health/rrs-suggestions"
          className="inline-flex items-center gap-2 px-3 py-1.5 text-[12.5px] font-semibold border border-[#E8EAEE] text-[#141821] rounded-lg hover:border-[#CFD4DC] hover:text-[#141821] transition-colors"
        >
          RRS suggestion acceptance →
        </Link>
      </div>

      <Card className="mb-6">
        <div className="flex items-center gap-2.5 mb-3">
          <span className="w-6 h-[3px] rounded-full bg-[#1B6DFC]" />
          <h2 className="text-[11px] font-medium text-[#141821]">Email delivery, last 30 days</h2>
        </div>
        {(badEmail?.length ?? 0) === 0 ? (
          <p className="text-[12.5px] text-[#666D7A]">
            {deliveredCount
              ? `${deliveredCount} emails confirmed delivered. None bounced, refused or reported as spam.`
              : 'Nothing recorded yet. This fills once the Resend webhook is connected and the next email goes out.'}
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-[12.5px] text-[#B45309]">
              {badEmail!.length} email{badEmail!.length === 1 ? '' : 's'} did not arrive. {deliveredCount ?? 0} delivered in the same period.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <tbody>
                  {badEmail!.map(e => (
                    <tr key={e.id} className="border-b border-[#EFF1F4] last:border-0">
                      <td className="py-2 pr-3 whitespace-nowrap text-[#141821] font-medium">{e.event_type}</td>
                      <td className="py-2 pr-3 text-[#43474F]">{e.to_address}</td>
                      <td className="py-2 pr-3 text-[#666D7A]">{e.subject}</td>
                      <td className="py-2 pr-3 text-[#666D7A]">{e.detail}</td>
                      <td className="py-2 whitespace-nowrap text-[#98A0AD]">
                        {new Date(e.occurred_at).toLocaleString('en-AU', { timeZone: 'Australia/Brisbane', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <p className="text-[10px] text-[#98A0AD] mt-3 leading-relaxed">
          Bounced, refused and spam complaints are reported and show here. Being filed as junk is never reported by any provider, so a quiet list does not prove everything was read.
        </p>
      </Card>

      {!runs || runs.length === 0 ? (
        <Card>
          <EmptyState
            icon={Activity}
            title="No health check runs recorded yet."
            hint="The first run will appear here tomorrow morning."
          />
        </Card>
      ) : (
        <div className="flex gap-6 flex-col md:flex-row">

          {/* Run list */}
          <div className="md:w-56 md:flex-shrink-0">
            <p
              className="text-[10px] font-medium text-[#98A0AD] mb-3"
            >
              Run history
            </p>
            <div className="space-y-1.5">
              {(runs ?? []).map(run => {
                const isSelected = selectedRun?.id === run.id
                const tone = run.status === 'ok' ? teal : run.status === 'fixed' ? amber : red
                const date = new Date(run.ran_at)
                const label = date.toLocaleDateString('en-AU', {
                  timeZone: 'Australia/Brisbane',
                  weekday: 'short', day: 'numeric', month: 'short',
                })
                const time = date.toLocaleTimeString('en-AU', {
                  timeZone: 'Australia/Brisbane',
                  hour: 'numeric', minute: '2-digit', hour12: true,
                })
                return (
                  <Link
                    key={run.id}
                    href={`/dashboard/system-health?run=${run.id}`}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-colors ${
                      isSelected
                        ? 'bg-[#EFF1F4] border-[#CFD4DC]'
                        : 'border-transparent hover:bg-[#FFFFFF]'
                    }`}
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: tone.bar }}
                    />
                    <div className="min-w-0">
                      <p className={`text-[12.5px] font-semibold ${isSelected ? 'text-[#141821]' : 'text-[#43474F]'}`}>{label}</p>
                      <p className="text-[10px] text-[#98A0AD]" style={{ fontFamily: MONO_FONT }}>{time}</p>
                      {run.status !== 'ok' && (
                        <p className="text-[10px] font-medium mt-0.5" style={{ color: tone.text }}>
                          {run.status === 'fixed'
                            ? `${run.fixes_count} auto-fixed`
                            : `${run.failures_count} failed`}
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Run detail */}
          <div className="flex-1 min-w-0">
            {selectedRun ? (
              <RunDetail run={selectedRun} />
            ) : (
              <Card>
                <p className="text-[#98A0AD] text-[13.5px] text-center py-6">Select a run to view details.</p>
              </Card>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
