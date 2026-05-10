/**
 * Per-session live logging page. Loads the session_completion + all its
 * exercise rows + any existing set logs, and hands them to the client
 * component for live editing.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ClientHeader from '@/components/client-header'
import LogClient from './log-client'

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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-32">
      <ClientHeader />
      <div className="max-w-lg mx-auto px-5 py-6">
        <Link href={`/portal/${token}/program/log`} className="text-[#57534e] hover:text-[#d4cfc9] text-sm transition-colors">
          ← Back to log
        </Link>

        <div className="mt-5 mb-1">
          <p className="text-[10px] text-teal-400 uppercase tracking-widest">Week {session.week_number_in_block}</p>
          <h1 className="text-2xl font-bold text-white">{session.day_label}{session.session_name ? ` · ${session.session_name}` : ''}</h1>
        </div>
        {session.status === 'completed' && (
          <p className="text-xs text-teal-400 mb-4">Logged {session.completed_at ? new Date(session.completed_at).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' }) : ''}</p>
        )}

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
        />
      </div>
    </div>
  )
}
