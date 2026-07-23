/**
 * Portal log index — lists every prescribed session for the CURRENT week of
 * the active block, with completion status per session. Mobile-first.
 *
 * If today is a training day, the matching session is highlighted at the top
 * with a "Start" CTA. Other sessions in the week are listed below.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import PortalPageShell from '../../portal-page-shell'
import {
  parsePrescribedSessions,
  currentBlockWeek,
  daysUntilBlockEnd,
  todayBrisbaneDayName,
  computeLoggingMomentum,
} from '@/lib/workout-logging'
import StartSessionButton from './start-session-button'

export default async function PortalProgramLogPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name')
    .eq('onboarding_token', token)
    .maybeSingle()

  if (!client) return notFound()

  const { data: program } = await admin
    .from('programs')
    .select('id, block_name, week_duration, sessions, generated_at, current_direction')
    .eq('client_id', client.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!program) {
    return (
      <PortalPageShell
        backHref={`/portal/${token}`}
        eyebrow="Training Log"
        title="No active program"
        description="Your training program isn't set up yet. Once Kade publishes it, you'll be able to log sessions from here."
      >
        <div />
      </PortalPageShell>
    )
  }

  const prescribedSessions = parsePrescribedSessions(program.sessions)
  const blockWeek = currentBlockWeek(program.generated_at)
  const daysLeft = daysUntilBlockEnd(program.generated_at, program.week_duration)
  const today = todayBrisbaneDayName()

  // Load all session_completions for THIS WEEK of the block
  const { data: completions } = await admin
    .from('session_completions')
    .select('id, session_index, status, started_at, completed_at')
    .eq('client_id', client.id)
    .eq('program_id', program.id)
    .eq('week_number_in_block', blockWeek)
    .neq('status', 'abandoned')

  const completionByIndex = new Map(
    (completions ?? []).map(c => [c.session_index, c]),
  )

  // Momentum (carrot): block-completion arc + trailing fully-logged-week
  // streak. Pulls completed counts across every week of the block.
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
  const momentumPct = momentum.blockTotal > 0
    ? Math.round((momentum.loggedThisBlock / momentum.blockTotal) * 100)
    : 0

  // Highlight today's session if it matches one of the prescribed day_labels
  const todaySessionIndex = prescribedSessions.findIndex(
    s => s.day_label.toLowerCase() === today.toLowerCase(),
  )

  const blockEndingSoon = daysLeft <= 7 && daysLeft >= 0
  const blockEnded = daysLeft < 0

  return (
    <PortalPageShell
      backHref={`/portal/${token}`}
      eyebrow="Training Log"
      title="Log this week"
      description={
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-full px-2.5 py-0.5">
            Week <span className="text-[#1A1A1A] font-semibold">{blockWeek}</span> of {program.week_duration}
          </span>
          {blockEndingSoon && (
            <span className="bg-amber-50 border border-amber-200 text-amber-700 rounded-full px-2.5 py-0.5">
              Block ending in {daysLeft === 0 ? 'today' : `${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
            </span>
          )}
          {blockEnded && (
            <span className="bg-amber-50 border border-amber-200 text-amber-700 rounded-full px-2.5 py-0.5">
              Block complete · awaiting reassessment
            </span>
          )}
        </div>
      }
    >
      {/* Momentum: block-completion arc + fully-logged-week streak */}
      {momentum.blockTotal > 0 && (
        <div className="mb-6 rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF] p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-widest">This block</p>
            {momentum.streakWeeks >= 2 && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#1B6DFC] bg-blue-50 border border-[#1B6DFC]/30 rounded-full px-2 py-0.5">
                {momentum.streakWeeks} weeks fully logged
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-[#E5E5E5] overflow-hidden">
              <div className="h-full bg-[#1B6DFC] transition-[width] duration-500" style={{ width: `${momentumPct}%` }} />
            </div>
            <p className="text-xs font-semibold text-[#1A1A1A] tabular-nums whitespace-nowrap">
              {momentum.loggedThisBlock} / {momentum.blockTotal} logged
            </p>
          </div>
        </div>
      )}

      {/* Today's session callout - canonical card, Signal Blue accent, no gradient */}
      {todaySessionIndex >= 0 && (
        <div className="mb-6 rounded-2xl border border-[#1B6DFC] bg-blue-50 p-5">
          <p className="text-[10px] font-bold text-[#1B6DFC] uppercase tracking-widest mb-2">Today · {today}</p>
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-1">{prescribedSessions[todaySessionIndex].day_label} · {prescribedSessions[todaySessionIndex].skeleton ?? 'Session'}</h2>
          <p className="text-sm text-[#6B6B6B] mb-4">
            {prescribedSessions[todaySessionIndex].flatExercises.length} exercise{prescribedSessions[todaySessionIndex].flatExercises.length === 1 ? '' : 's'}
          </p>
          <StartSessionButton
            token={token}
            clientId={client.id}
            sessionIndex={todaySessionIndex}
            weekNumberInBlock={blockWeek}
            existingCompletionId={completionByIndex.get(todaySessionIndex)?.id ?? null}
            status={completionByIndex.get(todaySessionIndex)?.status ?? null}
            variant="primary"
          />
        </div>
      )}

        {/* All sessions for this week */}
        <p className="text-[10px] text-[#6B6B6B] uppercase tracking-widest font-semibold mb-3">All sessions, week {blockWeek}</p>
        <div className="space-y-2">
          {prescribedSessions.map((s, idx) => {
            const completion = completionByIndex.get(idx)
            const isToday = idx === todaySessionIndex
            return (
              <div
                key={idx}
                className={`bg-[#FFFFFF] border rounded-2xl p-4 ${
                  completion?.status === 'completed'
                    ? 'border-[#1B6DFC]/60'
                    : completion?.status === 'in_progress'
                      ? 'border-amber-300'
                      : isToday
                        ? 'border-[#1B6DFC]/40'
                        : 'border-[#E5E5E5]'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#1A1A1A] truncate">{s.day_label}{s.skeleton ? ` · ${s.skeleton}` : ''}</p>
                    <p className="text-xs text-[#6B6B6B]">{s.flatExercises.length} exercise{s.flatExercises.length === 1 ? '' : 's'}</p>
                  </div>
                  {completion?.status === 'completed' && (
                    <span className="text-[10px] uppercase tracking-widest text-[#1B6DFC] shrink-0">Completed</span>
                  )}
                  {completion?.status === 'in_progress' && (
                    <span className="text-[10px] uppercase tracking-widest text-amber-700 shrink-0">In progress</span>
                  )}
                </div>
                <StartSessionButton
                  token={token}
                  clientId={client.id}
                  sessionIndex={idx}
                  weekNumberInBlock={blockWeek}
                  existingCompletionId={completion?.id ?? null}
                  status={completion?.status ?? null}
                  variant="secondary"
                />
              </div>
            )
          })}
      </div>
    </PortalPageShell>
  )
}
