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
              className="text-[10px] font-bold text-[#999999] uppercase mb-3"
              style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
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
                        ? 'bg-[#E5E5E5] border-[#D4D4D4]'
                        : 'border-transparent hover:bg-[#FFFFFF]'
                    }`}
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: tone.bar }}
                    />
                    <div className="min-w-0">
                      <p className={`text-[12px] font-semibold ${isSelected ? 'text-[#1A1A1A]' : 'text-[#3A3A3A]'}`}>{label}</p>
                      <p className="text-[10px] text-[#999999]" style={{ fontFamily: MONO_FONT }}>{time}</p>
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
                <p className="text-[#999999] text-[13px] text-center py-6">Select a run to view details.</p>
              </Card>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
