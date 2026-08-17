/**
 * Console threads — list them, and load one back.
 *
 * The console is deliberately the opposite of the co-pilot bubble here. The
 * bubble forgets on purpose (see sql/2026-08-17_copilot_session_id.sql): it
 * answers a question about the page you are on, and yesterday's chat only gets
 * in the way. The console is where the work IS the conversation — auditing a
 * send, working through a re-engagement — and that work spans sittings. So its
 * threads persist and are resumable.
 */

import { NextRequest, NextResponse } from 'next/server'
import { resolveConsoleScope } from '@/lib/console/scope'

export async function GET(request: NextRequest) {
  const gate = await resolveConsoleScope()
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })
  const { scope } = gate

  const threadId = new URL(request.url).searchParams.get('thread_id')

  // One thread, with its transcript and any approval cards still awaiting a click.
  if (threadId) {
    const { data: thread } = await scope.admin
      .from('console_threads')
      .select('id, title, created_at')
      .eq('id', threadId)
      .eq('coach_id', scope.coachId)
      .maybeSingle()

    if (!thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 })

    const [{ data: messages }, { data: actions }] = await Promise.all([
      scope.admin
        .from('console_messages')
        .select('id, role, content, tool_trace, created_at')
        .eq('thread_id', threadId)
        .eq('coach_id', scope.coachId)
        .order('created_at', { ascending: true })
        .limit(200),
      scope.admin
        .from('console_pending_actions')
        .select('id, action_type, summary, preview, status, expires_at')
        .eq('thread_id', threadId)
        .eq('coach_id', scope.coachId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true }),
    ])

    return NextResponse.json({
      thread,
      messages: messages ?? [],
      pending_actions: actions ?? [],
    })
  }

  const { data } = await scope.admin
    .from('console_threads')
    .select('id, title, updated_at')
    .eq('coach_id', scope.coachId)
    .is('archived_at', null)
    .order('updated_at', { ascending: false })
    .limit(40)

  return NextResponse.json({ threads: data ?? [] })
}

/** Archive a thread. Kept rather than deleted — the audit trail references it. */
export async function DELETE(request: NextRequest) {
  const gate = await resolveConsoleScope()
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })
  const { scope } = gate

  const threadId = new URL(request.url).searchParams.get('thread_id')
  if (!threadId) return NextResponse.json({ error: 'thread_id required' }, { status: 400 })

  const { error } = await scope.admin
    .from('console_threads')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', threadId)
    .eq('coach_id', scope.coachId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
