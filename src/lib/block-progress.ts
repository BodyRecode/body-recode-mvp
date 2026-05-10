/**
 * Coach-facing block progress loader.
 *
 * Reads the active program + session_completions for a client and produces
 * a snapshot for the BlockProgressPanel.
 */

import type { createAdminClient } from '@/lib/supabase/admin'
import { parsePrescribedSessions, currentBlockWeek, daysUntilBlockEnd } from '@/lib/workout-logging'
import type { BlockProgressData } from '@/app/dashboard/clients/[id]/block-progress-panel'

type Admin = ReturnType<typeof createAdminClient>

export async function loadBlockProgress(admin: Admin, clientId: string): Promise<BlockProgressData | null> {
  const { data: program } = await admin
    .from('programs')
    .select('id, block_name, week_duration, sessions, generated_at')
    .eq('client_id', clientId)
    .eq('is_active', true)
    .maybeSingle()

  if (!program) return null

  const prescribedSessions = parsePrescribedSessions(program.sessions)
  const blockWeek = currentBlockWeek(program.generated_at)
  const days = daysUntilBlockEnd(program.generated_at, program.week_duration)

  const { data: completions } = await admin
    .from('session_completions')
    .select('id, session_index, status, completed_at')
    .eq('client_id', clientId)
    .eq('program_id', program.id)

  const all = completions ?? []
  const thisWeek = all.filter(c => {
    // We don't have week_number_in_block in this select, so re-derive via
    // the loaded set of completions. Actually re-query with the field:
    return true // placeholder; replaced below
  })

  // Re-query with the week column for accurate per-week filtering.
  const { data: thisWeekRows } = await admin
    .from('session_completions')
    .select('id, session_index, status, completed_at')
    .eq('client_id', clientId)
    .eq('program_id', program.id)
    .eq('week_number_in_block', blockWeek)

  void thisWeek
  const thisWeekCompletions = thisWeekRows ?? []
  const sessionsCompletedThisWeek = thisWeekCompletions.filter(c => c.status === 'completed').length
  const sessionsInProgressThisWeek = thisWeekCompletions.filter(c => c.status === 'in_progress').length

  const totalSessionsLoggedThisBlock = all.filter(c => c.status === 'completed').length

  const latestLoggedAt = all
    .filter(c => c.completed_at)
    .map(c => c.completed_at as string)
    .sort()
    .reverse()[0] ?? null

  return {
    programId: program.id,
    blockName: program.block_name ?? null,
    blockWeek,
    weekDuration: program.week_duration,
    daysUntilBlockEnd: days,
    sessionsPrescribedThisWeek: prescribedSessions.length,
    sessionsCompletedThisWeek,
    sessionsInProgressThisWeek,
    totalSessionsLoggedThisBlock,
    latestLoggedAt,
  }
}
