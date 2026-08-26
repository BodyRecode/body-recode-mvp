'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * The console UI. Full-height conversation, thread list on the left, composer
 * pinned at the bottom — the shape Kade asked for ("it needs to look like
 * claude page or chatgpt page").
 *
 * Three things it renders that a plain chat does not:
 *   - a tool trace under each answer, so you can see WHAT it looked at before
 *     it said something;
 *   - approval cards for staged actions, which are the only route to sending;
 *   - threads, because this work spans sittings.
 */

const MONO = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace"

type TraceEntry = { tool: string; ok: boolean; count: number | null; error?: string }
type Msg = { id?: string; role: 'user' | 'assistant'; content: string; tool_trace?: TraceEntry[] }
type ThreadRow = { id: string; title: string; updated_at?: string }
type PendingAction = {
  id: string
  action_type: string
  summary: string
  preview: Record<string, unknown>
  status: string
  expires_at: string
}

const STARTERS = [
  'How many of my leads never moved?',
  'Who needs my attention today?',
  'What has actually been sent in the last 7 days?',
  'Which automations are active, and are they firing?',
]

/** Turn a tool name into something a coach reads without translating. */
function toolLabel(name: string): string {
  const map: Record<string, string> = {
    count_leads: 'Counted leads',
    find_leads: 'Looked up leads',
    get_lead: 'Read a lead file',
    find_clients: 'Listed clients',
    roster_attention: 'Checked who needs attention',
    recent_sends: 'Audited recent sends',
    list_workflows: 'Checked the automations',
    stage_dormant_reactivation: 'Staged a re-engagement',
    stage_lead_follow_up: 'Staged a follow-up',
  }
  return map[name] ?? name.replace(/_/g, ' ')
}

export default function ConsoleClient({
  brandName,
  coachFirstName,
}: {
  brandName: string
  coachFirstName: string
}) {
  const [threads, setThreads] = useState<ThreadRow[]>([])
  const [threadId, setThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [pending, setPending] = useState<PendingAction[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const loadThreads = useCallback(async () => {
    try {
      const res = await fetch('/api/console/threads')
      const data = await res.json()
      if (res.ok) setThreads(data.threads ?? [])
    } catch { /* the list is a convenience; a failure here shouldn't block chat */ }
  }, [])

  useEffect(() => { void loadThreads() }, [loadThreads])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy, pending])

  async function openThread(id: string) {
    setError('')
    setBusy(true)
    try {
      const res = await fetch(`/api/console/threads?thread_id=${id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not open that conversation')
      setThreadId(id)
      setMessages(data.messages ?? [])
      setPending(data.pending_actions ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  function newThread() {
    setThreadId(null)
    setMessages([])
    setPending([])
    setError('')
    setInput('')
  }

  async function send(text: string) {
    const q = text.trim()
    if (!q || busy) return
    setError('')
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setBusy(true)
    try {
      const res = await fetch('/api/console', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, thread_id: threadId ?? undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)

      setThreadId(data.thread_id)
      setMessages(prev => [...prev, {
        id: data.assistant?.id ?? undefined,
        role: 'assistant',
        content: data.assistant?.content ?? '',
        tool_trace: data.assistant?.tool_trace ?? [],
      }])
      if (Array.isArray(data.pending_actions) && data.pending_actions.length) {
        setPending(prev => [...prev, ...data.pending_actions])
      }
      void loadThreads()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  async function decide(action: PendingAction, approve: boolean) {
    setConfirming(action.id)
    setError('')
    try {
      const res = await fetch(`/api/console/actions/${action.id}/confirm`, {
        method: approve ? 'POST' : 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'That did not go through')

      setPending(prev => prev.filter(p => p.id !== action.id))
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: approve
          ? `Done — ${action.summary.charAt(0).toLowerCase()}${action.summary.slice(1)}.\n\n${formatResult(data.result)}`
          : `Cancelled. Nothing was sent or changed.`,
      }])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setConfirming(null)
    }
  }

  const empty = messages.length === 0

  return (
    <div className="flex gap-5 h-[calc(100vh-9rem)] -mt-2">
      {/* ── Threads ─────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-[248px] shrink-0 flex-col rounded-xl border border-[#E8EAEE] bg-[#FAFAFA] overflow-hidden">
        <div className="p-3 border-b border-[#E8EAEE]">
          <button
            onClick={newThread}
            className="w-full text-[13px] font-semibold px-3 py-2 rounded-lg bg-[#1B6DFC] text-white hover:bg-[#1558d6] transition-colors"
          >
            ＋ New conversation
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {threads.length === 0 && (
            <p className="text-[12px] text-[#98A0AD] px-2 py-3 leading-relaxed">
              Your conversations show up here and stay put, so you can pick a piece of work back up.
            </p>
          )}
          {threads.map(t => (
            <button
              key={t.id}
              onClick={() => openThread(t.id)}
              className={`w-full text-left text-[12.5px] px-2.5 py-2 rounded-lg mb-0.5 truncate transition-colors ${
                t.id === threadId
                  ? 'bg-[#E8F0FE] text-[#1B6DFC] font-medium'
                  : 'text-[#4A4A4A] hover:bg-[#EFF1F4]'
              }`}
              title={t.title}
            >
              {t.title}
            </button>
          ))}
        </div>
      </aside>

      {/* ── Conversation ────────────────────────────────────────── */}
      <section className="flex-1 min-w-0 flex flex-col rounded-xl border border-[#E8EAEE] bg-white overflow-hidden">
        <header className="px-5 py-3 border-b border-[#E8EAEE] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[15px] font-semibold text-[#141821] truncate">Operator Console</h1>
            <p className="text-[11.5px] text-[#8A8A8E] truncate">
              Reads your live data · you approve anything that sends
            </p>
          </div>
          <span
            className="hidden sm:inline-flex items-center gap-1.5 text-[10.5px] text-[#666D7A] px-2 py-1 rounded-full border border-[#E8EAEE] bg-[#FAFBFC] shrink-0"
            style={{ fontFamily: MONO }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#1B6DFC]" />
            {brandName}
          </span>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5">
          {empty && (
            <div className="max-w-[620px] mx-auto pt-8">
              <h2 className="text-[19px] font-semibold text-[#141821] mb-2">
                What do you want to look at, {coachFirstName}?
              </h2>
              <p className="text-[13.5px] text-[#666D7A] leading-relaxed mb-6">
                Ask about your leads, your clients, what has been sent, or what is firing. I read the
                real data rather than guessing. If something needs sending, I will show you exactly
                who would get it and wait for you to say yes.
              </p>
              <div className="grid gap-2">
                {STARTERS.map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-left text-[13px] text-[#141821] px-3.5 py-2.5 rounded-xl border border-[#E8EAEE] hover:border-[#1B6DFC] hover:bg-[#F8FAFF] transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="max-w-[720px] mx-auto space-y-5">
            {messages.map((m, i) => (
              <div key={m.id ?? i}>
                {m.role === 'user' ? (
                  <div className="flex justify-end">
                    <div className="max-w-[85%] bg-[#F0F4FF] text-[#141821] text-[13.5px] leading-relaxed px-4 py-2.5 rounded-xl rounded-br-md whitespace-pre-wrap">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div>
                    {!!m.tool_trace?.length && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {m.tool_trace.map((t, j) => (
                          <span
                            key={j}
                            title={t.error ?? undefined}
                            className={`text-[10.5px] px-2 py-0.5 rounded-full border ${
                              t.ok
                                ? 'border-[#E8EAEE] bg-[#FAFBFC] text-[#666D7A]'
                                : 'border-[#F5C2C2] bg-[#FDF2F2] text-[#B42318]'
                            }`}
                            style={{ fontFamily: MONO }}
                          >
                            {toolLabel(t.tool)}
                            {t.ok && t.count !== null ? ` · ${t.count}` : ''}
                            {!t.ok ? ' · failed' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="text-[13.5px] text-[#141821] leading-[1.65] whitespace-pre-wrap">
                      {m.content}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {pending.map(a => (
              <ApprovalCard
                key={a.id}
                action={a}
                busy={confirming === a.id}
                onDecide={decide}
              />
            ))}

            {busy && (
              <div className="flex items-center gap-2 text-[12.5px] text-[#8A8A8E]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1B6DFC] animate-pulse" />
                Looking at your data…
              </div>
            )}

            {error && (
              <div className="text-[12.5px] text-[#B42318] bg-[#FDF2F2] border border-[#F5C2C2] rounded-xl px-3.5 py-2.5">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-[#E8EAEE] p-3.5">
          <div className="max-w-[720px] mx-auto flex items-end gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void send(input)
                }
              }}
              rows={1}
              placeholder="Ask about your leads, clients, sends or automations…"
              disabled={busy}
              className="flex-1 resize-none text-[13.5px] leading-relaxed px-3.5 py-2.5 rounded-xl border border-[#E8EAEE] focus:border-[#1B6DFC] focus:outline-none disabled:bg-[#FAFAFA] max-h-[140px]"
            />
            <button
              onClick={() => void send(input)}
              disabled={busy || !input.trim()}
              className="shrink-0 text-[13px] font-semibold px-4 py-2.5 rounded-xl bg-[#1B6DFC] text-white hover:bg-[#1558d6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

/**
 * The approval card. This is the gate — everything that sends, charges or
 * deletes stops here until it is clicked. It leads with the numbers, and shows
 * exclusions as prominently as recipients, because "who is NOT getting this"
 * is the half people skip and the half that catches a test record.
 */
function ApprovalCard({
  action,
  busy,
  onDecide,
}: {
  action: PendingAction
  busy: boolean
  onDecide: (a: PendingAction, approve: boolean) => void
}) {
  const p = action.preview ?? {}
  const recipients = Array.isArray(p.recipients) ? (p.recipients as Record<string, unknown>[]) : []
  const excludedByReason = (p.excluded_by_reason ?? {}) as Record<string, number>
  const [showList, setShowList] = useState(false)

  return (
    <div className="rounded-xl border-2 border-[#F0A73F] bg-[#FFFBF3] p-4">
      <div className="flex items-start gap-2.5 mb-3">
        <span className="text-[15px] leading-none mt-0.5">⏸</span>
        <div className="min-w-0">
          <p className="text-[13.5px] font-semibold text-[#141821]">{action.summary}</p>
          <p className="text-[11.5px] text-[#8A6D3B] mt-0.5">
            Nothing has happened yet. This waits for you.
          </p>
        </div>
      </div>

      <div className="space-y-1.5 text-[12.5px] text-[#4A4A4A] mb-3">
        {typeof p.would_send_to === 'number' && (
          <p><strong className="text-[#141821]">{p.would_send_to}</strong> would receive this</p>
        )}
        {typeof p.excluded_count === 'number' && p.excluded_count > 0 && (
          <div>
            <p><strong className="text-[#141821]">{p.excluded_count}</strong> excluded:</p>
            <ul className="mt-1 ml-4 space-y-0.5 text-[12px] text-[#666D7A]">
              {Object.entries(excludedByReason).map(([reason, n]) => (
                <li key={reason}>{n} · {reason}</li>
              ))}
            </ul>
          </div>
        )}
        {typeof p.sequence === 'string' && (
          <p className="text-[12px] text-[#666D7A] pt-1">{p.sequence}</p>
        )}
        {typeof p.lead === 'string' && <p>Lead: <strong className="text-[#141821]">{p.lead}</strong></p>}
        {typeof p.date === 'string' && <p>Date: <strong className="text-[#141821]">{p.date}</strong></p>}
        {typeof p.note === 'string' && <p>Note: {p.note}</p>}
      </div>

      {recipients.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setShowList(v => !v)}
            className="text-[12px] text-[#1B6DFC] hover:underline"
          >
            {showList ? 'Hide the list' : `Show me exactly who (${recipients.length})`}
          </button>
          {showList && (
            <div className="mt-2 max-h-[220px] overflow-y-auto rounded-lg border border-[#E5D5B8] bg-white">
              {recipients.map((r, i) => (
                <div
                  key={i}
                  className="text-[11.5px] px-2.5 py-1.5 border-b border-[#F0F0F0] last:border-0 flex justify-between gap-2"
                >
                  <span className="text-[#141821] truncate">{String(r.name ?? r.email ?? '—')}</span>
                  <span className="text-[#8A8A8E] shrink-0" style={{ fontFamily: MONO }}>
                    {String(r.state ?? '')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => onDecide(action, true)}
          disabled={busy}
          className="text-[13px] font-semibold px-4 py-2 rounded-lg bg-[#1A1A1A] text-white hover:bg-black disabled:opacity-50 transition-colors"
        >
          {busy ? 'Working…' : 'Confirm and send'}
        </button>
        <button
          onClick={() => onDecide(action, false)}
          disabled={busy}
          className="text-[13px] px-4 py-2 rounded-lg border border-[#E8EAEE] bg-white text-[#4A4A4A] hover:bg-[#FAFBFC] disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

/** Render an executor's result dict as a couple of readable lines. */
function formatResult(result: unknown): string {
  if (!result || typeof result !== 'object') return ''
  const r = result as Record<string, unknown>
  const parts: string[] = []
  if (typeof r.enqueued === 'number') parts.push(`${r.enqueued} queued to send.`)
  if (typeof r.failed === 'number' && r.failed > 0) parts.push(`${r.failed} failed to queue.`)
  if (typeof r.follow_up_date === 'string') parts.push(`Follow-up set for ${r.follow_up_date}.`)
  if (typeof r.note === 'string' && r.note) parts.push(r.note)
  return parts.join(' ')
}
