/**
 * Coach-side log index — the coach opens this from a client's profile to log a
 * session on the client's behalf (e.g. training them in person). Mirrors the
 * client portal log index (src/app/portal/[token]/program/log/page.tsx) but
 * resolves the client by id and posts to the coach log routes. Writes land in
 * the same tables, so anything logged here also shows in the client's portal.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  parsePrescribedSessions,
  currentBlockWeek,
  daysUntilBlockEnd,
  todayBrisbaneDayName,
  computeLoggingMomentum,
} from '@/lib/workout-logging'
import StartSessionButton from '@/app/portal/[token]/program/log/start-session-button'

export default async function CoachTrainIndexPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name, package')
    .eq('id', id)
    .maybeSingle()

  if (!client) return notFound()
  // In-person logging only. An online client is never trained in person, so
  // reaching this page by URL would let a coach record a session that did not
  // happen with them.
  if (client.package === 'online') return notFound()

  const { data: program } = await admin
    .from('programs')
    .select('id, block_name, week_duration, sessions, generated_at')
    .eq('client_id', client.id)
    .eq('is_active', true)
    .maybeSingle()

  const firstName = client.name?.split(' ')[0] ?? 'this client'

  if (!program) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href={`/dashboard/clients/${id}`} className="text-[12.5px] font-semibold text-[#1B6DFC] hover:text-[#5390FF]">← Back to {firstName}</Link>
        <div className="mt-6 rounded-xl border border-[#E8EAEE] bg-white p-6 text-center">
          <p className="text-sm text-[#666D7A]">No active training program for {firstName} yet. Publish a program first, then you can log sessions here.</p>
        </div>
      </div>
    )
  }

  const prescribedSessions = parsePrescribedSessions(program.sessions)
  const blockWeek = currentBlockWeek(program.generated_at)
  const daysLeft = daysUntilBlockEnd(program.generated_at, program.week_duration)
  const today = todayBrisbaneDayName()

  const { data: completions } = await admin
    .from('session_completions')
    .select('id, session_index, status')
    .eq('client_id', client.id)
    .eq('program_id', program.id)
    .eq('week_number_in_block', blockWeek)
    .neq('status', 'abandoned')

  const completionByIndex = new Map((completions ?? []).map(c => [c.session_index, c]))

  const { data: blockCompletions } = await admin
    .from('session_completions')
    .select('week_number_in_block, status')
    .eq('client_id', client.id)
    .eq('program_id', program.id)
    .neq('status', 'abandoned')

  const completedByWeek = new Map<number, number>()
  for (const c of blockCompletions ?? []) {
    if (c.status === 'completed') {
      completedByWeek.set(c.week_number_in_block, (completedByWeek.get(c.week_number_in_block) ?? 0) + 1)
    }
  }
  const momentum = computeLoggingMomentum({
    completedByWeek,
    prescribedPerWeek: prescribedSessions.length,
    currentWeek: blockWeek,
    weekDuration: program.week_duration,
  })
  const momentumPct = momentum.blockTotal > 0 ? Math.round((momentum.loggedThisBlock / momentum.blockTotal) * 100) : 0

  const todaySessionIndex = prescribedSessions.findIndex(s => s.day_label.toLowerCase() === today.toLowerCase())
  const daysLeftLabel = daysLeft < 0 ? 'Block complete' : daysLeft === 0 ? 'Block ends today' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`

  const startEndpoint = '/api/coach/log/start-session'
  const logHrefBase = `/dashboard/clients/${id}/train`

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href={`/dashboard/clients/${id}`} className="text-[12.5px] font-semibold text-[#1B6DFC] hover:text-[#5390FF]">← Back to {firstName}</Link>

      <div className="mt-4 br-page-header sticky top-0 z-20 mb-7 pt-4 pb-3.5 border-b border-[#E8EAEE] bg-white/[0.88] backdrop-blur-md print:static print:bg-transparent">
        <p className="text-[10px] font-medium text-[#98A0AD] mb-1">Log a session · {client.name}</p>
        <h1 className="text-[22px] font-semibold text-[#141821] tracking-[-0.025em] tracking-tight">{program.block_name ?? 'Training'}</h1>
        <div className="flex flex-wrap items-center gap-2 mt-2 text-[12.5px]">
          <span className="bg-white border border-[#E8EAEE] rounded-full px-2.5 py-0.5">Week <span className="text-[#141821] font-semibold">{blockWeek}</span> of {program.week_duration}</span>
          <span className="bg-white border border-[#E8EAEE] rounded-full px-2.5 py-0.5 text-[#666D7A]">{daysLeftLabel}</span>
        </div>
      </div>

      {/* Momentum */}
      {momentum.blockTotal > 0 && (
        <div className="mb-6 rounded-xl border border-[#E8EAEE] bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-medium text-[#666D7A]">This block</p>
            {momentum.streakWeeks >= 2 && (
              <span className="text-[11.5px] font-medium text-[#1B6DFC] bg-[rgba(27,109,252,0.08)] border border-[#1B6DFC]/30 rounded-full px-2 py-0.5">{momentum.streakWeeks} weeks fully logged</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-[#EFF1F4] overflow-hidden">
              <div className="h-full bg-[#1B6DFC]" style={{ width: `${momentumPct}%` }} />
            </div>
            <p className="text-[12.5px] font-semibold text-[#141821] tabular-nums whitespace-nowrap">{momentum.loggedThisBlock} / {momentum.blockTotal} logged</p>
          </div>
        </div>
      )}

      {/* Today */}
      {todaySessionIndex >= 0 && (
        <div className="mb-6 rounded-xl border border-[#1B6DFC] bg-[rgba(27,109,252,0.08)] p-5">
          <p className="text-[10px] font-medium text-[#1B6DFC] mb-2">Today · {today}</p>
          <h2 className="text-xl font-bold text-[#141821] mb-1">{prescribedSessions[todaySessionIndex].day_label}{prescribedSessions[todaySessionIndex].skeleton ? ` · ${prescribedSessions[todaySessionIndex].skeleton}` : ''}</h2>
          <p className="text-sm text-[#666D7A] mb-4">{prescribedSessions[todaySessionIndex].flatExercises.length} exercise{prescribedSessions[todaySessionIndex].flatExercises.length === 1 ? '' : 's'}</p>
          <StartSessionButton
            token=""
            clientId={client.id}
            sessionIndex={todaySessionIndex}
            weekNumberInBlock={blockWeek}
            existingCompletionId={completionByIndex.get(todaySessionIndex)?.id ?? null}
            status={completionByIndex.get(todaySessionIndex)?.status ?? null}
            variant="primary"
            startEndpoint={startEndpoint}
            logHrefBase={logHrefBase}
          />
        </div>
      )}

      <p className="text-[10px] text-[#666D7A] font-semibold mb-3">All sessions, week {blockWeek}</p>
      <div className="space-y-2">
        {prescribedSessions.map((s, idx) => {
          const completion = completionByIndex.get(idx)
          return (
            <div
              key={idx}
              className={`bg-white border rounded-xl p-4 ${
                completion?.status === 'completed'
                  ? 'border-[#1B6DFC]/60'
                  : completion?.status === 'in_progress'
                    ? 'border-[#E5C98F]'
                    : 'border-[#E8EAEE]'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-1">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#141821]">{s.day_label}{s.skeleton ? ` · ${s.skeleton}` : ''}</p>
                  <p className="text-[12.5px] text-[#666D7A]">{s.flatExercises.length} exercise{s.flatExercises.length === 1 ? '' : 's'}</p>
                </div>
                {completion?.status === 'completed' && <span className="text-[10px] text-[#1B6DFC] shrink-0">Completed</span>}
                {completion?.status === 'in_progress' && <span className="text-[10px] text-[#A96A12] shrink-0">In progress</span>}
              </div>
              <StartSessionButton
                token=""
                clientId={client.id}
                sessionIndex={idx}
                weekNumberInBlock={blockWeek}
                existingCompletionId={completion?.id ?? null}
                status={completion?.status ?? null}
                variant="secondary"
                startEndpoint={startEndpoint}
                logHrefBase={logHrefBase}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
