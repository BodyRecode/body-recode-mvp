import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RunDetail from './run-detail'

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

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white mb-1">System Health</h1>
        <p className="text-stone-400 text-sm">Daily automated checks across all platform processes.</p>
      </div>

      {!runs || runs.length === 0 ? (
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-8 text-center">
          <p className="text-stone-400 text-sm">No health check runs recorded yet.</p>
          <p className="text-stone-600 text-xs mt-1">The first run will appear here tomorrow morning.</p>
        </div>
      ) : (
        <div className="flex gap-6">

          {/* Run list */}
          <div className="w-56 flex-shrink-0">
            <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-3">Run history</p>
            <div className="space-y-1.5">
              {(runs ?? []).map(run => {
                const isSelected = selectedRun?.id === run.id
                const statusColor = run.status === 'ok'
                  ? 'text-teal-400'
                  : run.status === 'fixed'
                  ? 'text-amber-400'
                  : 'text-red-400'
                const dot = run.status === 'ok' ? 'bg-teal-400' : run.status === 'fixed' ? 'bg-amber-400' : 'bg-red-400'
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
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-stone-800 border border-stone-700'
                        : 'hover:bg-stone-900 border border-transparent'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-stone-300'}`}>{label}</p>
                      <p className="text-[10px] text-stone-600">{time}</p>
                      {run.status !== 'ok' && (
                        <p className={`text-[10px] font-medium mt-0.5 ${statusColor}`}>
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
              <div className="bg-stone-900 border border-stone-800 rounded-xl p-8 text-center">
                <p className="text-stone-500 text-sm">Select a run to view details.</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
