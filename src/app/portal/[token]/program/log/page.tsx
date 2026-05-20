/**
 * Portal log index — lists every prescribed session for the CURRENT week of
 * the active block, with completion status per session. Mobile-first.
 *
 * If today is a training day, the matching session is highlighted at the top
 * with a "Start" CTA. Other sessions in the week are listed below.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ClientHeader from '@/components/client-header'
import {
  parsePrescribedSessions,
  currentBlockWeek,
  daysUntilBlockEnd,
  todayBrisbaneDayName,
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
      <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1A]">
        <ClientHeader />
        <div className="max-w-lg mx-auto px-6 py-10">
          <h1 className="text-2xl font-bold mb-3">No active program</h1>
          <p className="text-[#6B6B6B] text-sm">Your training program isn&apos;t set up yet. Once Kade publishes it, you&apos;ll be able to log sessions from here.</p>
        </div>
      </div>
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

  // Highlight today's session if it matches one of the prescribed day_labels
  const todaySessionIndex = prescribedSessions.findIndex(
    s => s.day_label.toLowerCase() === today.toLowerCase(),
  )

  const blockEndingSoon = daysLeft <= 7 && daysLeft >= 0
  const blockEnded = daysLeft < 0

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1A] pb-24">
      <ClientHeader />
      <div className="max-w-lg mx-auto px-5 py-8">
        <Link href={`/portal/${token}`} className="text-[#999999] hover:text-[#3A3A3A] text-sm transition-colors">
          ← Back
        </Link>

        <div className="mt-6 mb-2">
          <p className="text-[10px] text-blue-500 uppercase tracking-widest mb-2">Training Log</p>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Log this week</h1>
        </div>

        {/* Block status pill */}
        <div className="flex items-center gap-2 text-xs text-[#6B6B6B] mb-6">
          <span className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-full px-2.5 py-0.5">
            Week <span className="text-[#1A1A1A]">{blockWeek}</span> of {program.week_duration}
          </span>
          {blockEndingSoon && (
            <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full px-2.5 py-0.5">
              Block ending in {daysLeft === 0 ? 'today' : `${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
            </span>
          )}
          {blockEnded && (
            <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full px-2.5 py-0.5">
              Block complete · awaiting reassessment
            </span>
          )}
        </div>

        {/* Today's session callout */}
        {todaySessionIndex >= 0 && (
          <div className="mb-6 bg-gradient-to-br from-blue-500/15 to-blue-500/5 border border-blue-500/30 rounded-2xl p-5">
            <p className="text-[10px] text-blue-500 uppercase tracking-widest font-semibold mb-2">Today · {today}</p>
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
                    ? 'border-blue-500/40'
                    : completion?.status === 'in_progress'
                      ? 'border-amber-500/40'
                      : isToday
                        ? 'border-blue-500/20'
                        : 'border-[#E5E5E5]'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#1A1A1A] truncate">{s.day_label}{s.skeleton ? ` · ${s.skeleton}` : ''}</p>
                    <p className="text-xs text-[#6B6B6B]">{s.flatExercises.length} exercise{s.flatExercises.length === 1 ? '' : 's'}</p>
                  </div>
                  {completion?.status === 'completed' && (
                    <span className="text-[10px] uppercase tracking-widest text-blue-500 shrink-0">Completed</span>
                  )}
                  {completion?.status === 'in_progress' && (
                    <span className="text-[10px] uppercase tracking-widest text-amber-400 shrink-0">In progress</span>
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
      </div>
    </div>
  )
}
