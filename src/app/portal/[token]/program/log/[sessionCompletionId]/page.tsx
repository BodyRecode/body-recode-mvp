/**
 * Per-session live logging page. Loads the session_completion + all its
 * exercise rows + any existing set logs, and hands them to the client
 * component for live editing.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import PortalPageShell from '../../../portal-page-shell'
import LogClient from './log-client'
import { estimate1RM } from '@/lib/workout-logging'

export default async function PortalLogSessionPage({
  params,
}: {
  params: Promise<{ token: string; sessionCompletionId: string }>
}) {
  const { token, sessionCompletionId } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name')
    .eq('onboarding_token', token)
    .maybeSingle()
  if (!client) return notFound()

  const { data: session } = await admin
    .from('session_completions')
    .select('id, client_id, day_label, session_name, week_number_in_block, status, started_at, completed_at, session_notes, prescription_snapshot')
    .eq('id', sessionCompletionId)
    .maybeSingle()

  if (!session || session.client_id !== client.id) return notFound()

  const { data: exercises } = await admin
    .from('session_exercise_completions')
    .select('id, block_label, sort_order, prescribed_exercise_name, prescribed_sets, prescribed_reps, prescribed_rpe, prescribed_rest, prescribed_notes, substituted, substituted_exercise_name, substitution_reason, exercise_notes')
    .eq('session_completion_id', sessionCompletionId)
    .order('sort_order', { ascending: true })

  const exerciseIds = (exercises ?? []).map(e => e.id)
  const { data: setLogs } = exerciseIds.length > 0
    ? await admin
        .from('exercise_set_logs')
        .select('id, session_exercise_completion_id, set_number, weight_kg, reps_completed, rpe, logged_at')
        .in('session_exercise_completion_id', exerciseIds)
        .order('set_number', { ascending: true })
    : { data: [] }

  // "Last time" reference + prior personal-best per exercise — the carrot
  // mechanics. One query pulls every prior logged instance of these exercises
  // for this client, with its set logs nested, excluding the current session.
  const exerciseNames = Array.from(new Set((exercises ?? []).map(e => e.prescribed_exercise_name)))
  const lastTime: Record<string, { sets: Array<{ weight: number | null; reps: number | null }>; when: string | null }> = {}
  const priorBest: Record<string, number> = {}

  if (exerciseNames.length > 0) {
    const { data: priorRows } = await admin
      .from('session_exercise_completions')
      .select('prescribed_exercise_name, session_completion_id, session_completions!inner(client_id, status, completed_at, started_at), exercise_set_logs(set_number, weight_kg, reps_completed)')
      .eq('session_completions.client_id', client.id)
      .neq('session_completion_id', sessionCompletionId)
      .in('prescribed_exercise_name', exerciseNames)

    type PriorRow = {
      prescribed_exercise_name: string
      session_completions: { completed_at: string | null; started_at: string | null } | null
      exercise_set_logs: Array<{ set_number: number; weight_kg: number | null; reps_completed: number | null }> | null
    }
    const rows = (priorRows ?? []) as unknown as PriorRow[]
    const latestWhen: Record<string, number> = {}
    for (const row of rows) {
      const name = row.prescribed_exercise_name
      const sets = (row.exercise_set_logs ?? []).filter(s => s.weight_kg != null || s.reps_completed != null)
      for (const s of sets) {
        const e = estimate1RM(s.weight_kg, s.reps_completed)
        if (e > (priorBest[name] ?? 0)) priorBest[name] = e
      }
      if (sets.length === 0) continue
      const whenIso = row.session_completions?.completed_at ?? row.session_completions?.started_at ?? null
      const whenMs = whenIso ? new Date(whenIso).getTime() : 0
      if (whenMs >= (latestWhen[name] ?? -1)) {
        latestWhen[name] = whenMs
        lastTime[name] = {
          sets: [...sets]
            .sort((a, b) => a.set_number - b.set_number)
            .map(s => ({ weight: s.weight_kg, reps: s.reps_completed })),
          when: whenIso,
        }
      }
    }
  }

  return (
    <PortalPageShell
      backHref={`/portal/${token}/program/log`}
      backLabel="← Back to log"
      eyebrow={`Week ${session.week_number_in_block}`}
      title={`${session.day_label}${session.session_name ? ` · ${session.session_name}` : ''}`}
      description={session.status === 'completed' && session.completed_at
        ? <span className="text-[#1B6DFC]">Logged {new Date(session.completed_at).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })}</span>
        : undefined}
    >
      <LogClient
          token={token}
          clientId={client.id}
          sessionCompletionId={session.id}
          sessionStatus={session.status}
          initialSessionNotes={session.session_notes ?? ''}
          exercises={(exercises ?? []).map(e => ({
            id: e.id,
            block_label: e.block_label,
            prescribed_exercise_name: e.prescribed_exercise_name,
            prescribed_sets: e.prescribed_sets,
            prescribed_reps: e.prescribed_reps,
            prescribed_rpe: e.prescribed_rpe,
            prescribed_rest: e.prescribed_rest,
            prescribed_notes: e.prescribed_notes,
            substituted: e.substituted,
            substituted_exercise_name: e.substituted_exercise_name,
            substitution_reason: e.substitution_reason,
            exercise_notes: e.exercise_notes,
          }))}
        initialSetLogs={(setLogs ?? []).map(s => ({
          id: s.id,
          session_exercise_completion_id: s.session_exercise_completion_id,
          set_number: s.set_number,
          weight_kg: s.weight_kg,
          reps_completed: s.reps_completed,
          rpe: s.rpe,
        }))}
        lastTime={lastTime}
        priorBest={priorBest}
      />
    </PortalPageShell>
  )
}
