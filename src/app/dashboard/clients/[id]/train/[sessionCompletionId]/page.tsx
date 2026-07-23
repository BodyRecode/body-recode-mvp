/**
 * Coach-side live logging screen — the coach logs a client's session set by
 * set (e.g. training them in person). Mirrors the client portal session page
 * (src/app/portal/[token]/program/log/[sessionCompletionId]/page.tsx),
 * resolving the client by id and pointing LogClient at the coach log routes.
 * Same tables → the logged session appears in the client's portal too.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import LogClient from '@/app/portal/[token]/program/log/[sessionCompletionId]/log-client'
import { estimate1RM } from '@/lib/workout-logging'

export default async function CoachLogSessionPage({
  params,
}: {
  params: Promise<{ id: string; sessionCompletionId: string }>
}) {
  const { id, sessionCompletionId } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name')
    .eq('id', id)
    .maybeSingle()
  if (!client) return notFound()

  const { data: session } = await admin
    .from('session_completions')
    .select('id, client_id, day_label, session_name, week_number_in_block, status, completed_at, session_notes')
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

  // "Last time" + prior personal-best per exercise (same as the client screen).
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
          sets: [...sets].sort((a, b) => a.set_number - b.set_number).map(s => ({ weight: s.weight_kg, reps: s.reps_completed })),
          when: whenIso,
        }
      }
    }
  }

  const completeHref = `/dashboard/clients/${id}/train`

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href={completeHref} className="text-xs font-semibold text-[#1B6DFC] hover:text-[#5390FF]">← Back to sessions</Link>
      <div className="mt-4 mb-5">
        <p className="text-[10px] font-bold tracking-widest text-[#999999] uppercase mb-1">Logging for {client.name} · Week {session.week_number_in_block}</p>
        <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">{session.day_label}{session.session_name ? ` · ${session.session_name}` : ''}</h1>
        {session.status === 'completed' && session.completed_at && (
          <p className="text-xs text-[#1B6DFC] mt-1">Logged {new Date(session.completed_at).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })}</p>
        )}
      </div>

      <LogClient
        token=""
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
        apiBase="/api/coach/log"
        completeHref={completeHref}
      />
    </div>
  )
}
