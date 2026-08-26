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
                      <p className={`text-[12px] font-semibold ${isSelected ? 'text-[#141821]' : 'text-[#43474F]'}`}>{label}</p>
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
                <p className="text-[#98A0AD] text-[13px] text-center py-6">Select a run to view details.</p>
              </Card>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
