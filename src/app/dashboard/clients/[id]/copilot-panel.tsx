'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { CopilotStarters } from '@/components/copilot-starters'
import { clientStarterCategories } from '@/lib/copilot-starter-questions'

// A proposed training-program generation spec (Phase 2 "draft with me"). The
// co-pilot derives it from the read-only suggest-prescription engine (the vetted
// doctrine input-deriver), the coach reviews it, and only an explicit "Generate"
// click fires the real generator. Nothing is ever auto-published to a client.
type DraftSpec = {
  block_name: string
  progression_phase: string
  training_goal: string
  training_frequency: number
  training_age: string
  movement_competency: string
  week_duration: number
  equipment_access: string[]
  reasons: Record<string, string>
}

// A proposed surgical edit to the draft (Phase 3). `operations` is an opaque
// list of validated patch ops the server applies deterministically; `summary`
// is the plain-English description the coach approves.
type EditProposal = { operations: unknown[]; summary: string }

type Msg = {
  id: string | null
  role: 'user' | 'assistant'
  content: string
  flagged: boolean
  followups?: string[]
  /** Special assistant cards for the draft + refine flows. Absent = text bubble. */
  kind?: 'draft-proposal' | 'draft-done' | 'edit-proposal' | 'edit-done'
  draft?: DraftSpec
  edit?: EditProposal
}

const MONO = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace"

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

// What the co-pilot can help with — shown in the persistent "What I can help
// with" panel. Client-scoped variant.
const CAPABILITIES: { title: string; body: string }[] = [
  { title: 'Explain this client’s read', body: 'Why they landed in this state or phase, and what’s driving it.' },
  { title: 'Review a generated plan', body: 'Check the program or nutrition against doctrine and flag what’s off.' },
  { title: 'Pressure-test your decision', body: '“Talk me out of progressing them.” “Should this be Restoration?”' },
  { title: 'Draft a training program', body: 'Propose a full generation spec you review and approve before it runs.' },
]

export default function CopilotPanel({
  clientId,
  clientFirstName,
  initialMessages,
  onClose,
  className,
}: {
  clientId: string
  clientFirstName: string
  initialMessages: Msg[]
  /** When provided (bubble mode), a ✕ shows in the header. */
  onClose?: () => void
  /** Extra classes for the outer card (bubble mode makes it fill its popover). */
  className?: string
}) {
  const pathname = usePathname() ?? ''
  const [messages, setMessages] = useState<Msg[]>(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showHelp, setShowHelp] = useState(false)
  // Draft flow: `proposing` = fetching the spec; `generatingIdx` = which
  // proposal card is currently running the real generator.
  const [proposing, setProposing] = useState(false)
  const [generatingIdx, setGeneratingIdx] = useState<number | null>(null)
  // Refine flow (Phase 3): `editMode` routes the composer to draft edits;
  // `proposingEdit` = working out the patch; `applyingIdx` = card being saved.
  const [editMode, setEditMode] = useState(false)
  const [proposingEdit, setProposingEdit] = useState(false)
  const [applyingIdx, setApplyingIdx] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const busy = loading || proposing || generatingIdx !== null || proposingEdit || applyingIdx !== null

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading, proposing, generatingIdx, proposingEdit, applyingIdx])

  async function send(text: string) {
    const q = text.trim()
    if (!q || busy) return
    setError('')
    setInput('')
    setMessages(prev => [...prev, { id: null, role: 'user', content: q, flagged: false }])
    setLoading(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/copilot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setMessages(prev => [...prev, {
        id: data.assistant?.id ?? null,
        role: 'assistant',
        content: data.assistant?.content ?? '',
        flagged: !!data.assistant?.flagged,
        followups: Array.isArray(data.assistant?.followups) ? data.assistant.followups : [],
      }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // Step 1 (read-only): ask the vetted suggest-prescription engine for the
  // doctrine-correct inputs, then show them as an editable proposal card.
  async function proposeDraft() {
    if (busy) return
    setError('')
    setMessages(prev => [...prev, { id: null, role: 'user', content: 'Draft a training program', flagged: false }])
    setProposing(true)
    try {
      const res = await fetch('/api/suggest-prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      const s = data.suggestion || {}
      const spec: DraftSpec = {
        block_name: `${cap(s.progression_phase ?? '')} · ${cap(s.training_goal ?? '')}`.trim(),
        progression_phase: s.progression_phase ?? 'accumulation',
        training_goal: s.training_goal ?? 'strength',
        training_frequency: Number(s.training_frequency) || 3,
        training_age: s.training_age ?? 'intermediate',
        movement_competency: s.movement_competency ?? 'developing',
        week_duration: Number(s.week_duration) || 4,
        equipment_access: ['barbell', 'dumbbell', 'bodyweight'],
        reasons: {
          progression_phase: s.progression_phase_reason ?? '',
          training_goal: s.training_goal_reason ?? '',
          training_frequency: s.training_frequency_reason ?? '',
          training_age: s.training_age_reason ?? '',
          movement_competency: s.movement_competency_reason ?? '',
          week_duration: s.week_duration_reason ?? '',
        },
      }
      setMessages(prev => [...prev, { id: null, role: 'assistant', content: '', flagged: false, kind: 'draft-proposal', draft: spec }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not build a proposal')
    } finally {
      setProposing(false)
    }
  }

  function updateDraft(idx: number, patch: Partial<DraftSpec>) {
    setMessages(prev => prev.map((m, i) => (i === idx && m.draft ? { ...m, draft: { ...m.draft, ...patch } } : m)))
  }

  // Step 2 (mutation, explicit coach action): fire the real generator. Output is
  // a DRAFT (status=draft, is_active=false) — it never reaches the client until
  // the coach publishes it on the program page. All engine clamps still fire.
  async function generateDraft(idx: number) {
    const spec = messages[idx]?.draft
    if (!spec || busy) return
    if (!spec.block_name.trim()) { setError('Give the block a name first.'); return }
    setError('')
    setGeneratingIdx(idx)
    try {
      const res = await fetch('/api/generate-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          plan_block_id: null,
          preferred_training_days: [],
          block_name: spec.block_name,
          progression_phase: spec.progression_phase,
          training_goal: spec.training_goal,
          training_frequency: spec.training_frequency,
          training_age: spec.training_age,
          movement_competency: spec.movement_competency,
          week_duration: spec.week_duration,
          equipment_access: spec.equipment_access,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setMessages(prev => prev.map((m, i) => (i === idx ? { ...m, kind: 'draft-done' } : m)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGeneratingIdx(null)
    }
  }

  function dismissProposal(idx: number) {
    setMessages(prev => prev.filter((_, i) => i !== idx))
  }

  // Phase 3 step 1 (read-only): ask the model for a minimal patch for one change.
  async function proposeEdit(text: string) {
    const instruction = text.trim()
    if (!instruction || busy) return
    setError('')
    setInput('')
    setMessages(prev => [...prev, { id: null, role: 'user', content: instruction, flagged: false }])
    setProposingEdit(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/copilot/edit-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'propose', instruction }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      const operations: unknown[] = Array.isArray(data.operations) ? data.operations : []
      const summary: string = typeof data.summary === 'string' ? data.summary : ''
      if (operations.length === 0) {
        // Ambiguous, unsupported, or refused on doctrine — show the reason, no Apply.
        setMessages(prev => [...prev, { id: null, role: 'assistant', content: summary || 'I could not make that change. Try naming the exact exercise and what to change.', flagged: false }])
      } else {
        setMessages(prev => [...prev, { id: null, role: 'assistant', content: '', flagged: false, kind: 'edit-proposal', edit: { operations, summary } }])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not work out the edit')
    } finally {
      setProposingEdit(false)
    }
  }

  // Phase 3 step 2 (mutation, explicit coach action): apply the patch to the draft.
  async function applyEdit(idx: number) {
    const proposal = messages[idx]?.edit
    if (!proposal || busy) return
    setError('')
    setApplyingIdx(idx)
    try {
      const res = await fetch(`/api/clients/${clientId}/copilot/edit-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply', operations: proposal.operations }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not apply the change')
      const applied: string[] = Array.isArray(data.applied) ? data.applied : []
      setMessages(prev => prev.map((m, i) => (i === idx ? { ...m, kind: 'edit-done', content: applied.join(' ') } : m)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not apply the change')
    } finally {
      setApplyingIdx(null)
    }
  }

  async function toggleFlag(idx: number) {
    const m = messages[idx]
    if (!m.id) return
    const next = !m.flagged
    setMessages(prev => prev.map((x, i) => (i === idx ? { ...x, flagged: next } : x)))
    try {
      const res = await fetch(`/api/clients/${clientId}/copilot/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: m.id, flagged: next }),
      })
      if (!res.ok) throw new Error()
    } catch {
      // revert on failure
      setMessages(prev => prev.map((x, i) => (i === idx ? { ...x, flagged: !next } : x)))
    }
  }

  return (
    <div className={`border border-[#E5E5E5] bg-[#FFFFFF] rounded-2xl overflow-hidden flex flex-col ${className ?? ''}`}>
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[#E5E5E5] bg-[#FAFAF7] shrink-0">
        <p className="text-[10px] font-bold text-[#1B6DFC] uppercase tracking-widest" style={{ fontFamily: MONO, letterSpacing: '0.14em' }}>
          Co-Pilot · Doctrine tutor
        </p>
        <span className="ml-auto text-[10px] text-[#999999]" style={{ fontFamily: MONO }}>coach only · you approve every change</span>
        {onClose && (
          <button onClick={onClose} aria-label="Close co-pilot" className="text-[#999999] hover:text-[#1A1A1A] text-lg leading-none -my-1">✕</button>
        )}
      </div>

      {/* Persistent "What I can help with" bar — available any time. */}
      <button
        onClick={() => setShowHelp(s => !s)}
        aria-expanded={showHelp}
        className="flex items-center gap-2 px-5 py-2 border-b border-[#EDEDED] bg-white text-[#1B6DFC] hover:bg-[rgba(27,109,252,0.04)] transition-colors shrink-0"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="#1B6DFC" strokeWidth="1.6" />
          <path d="M9.5 9.2a2.5 2.5 0 1 1 3.2 2.4c-.7.25-1.2.9-1.2 1.65v.35" stroke="#1B6DFC" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="12" cy="16.4" r="1" fill="#1B6DFC" />
        </svg>
        <span className="text-[13px] font-semibold">What I can help with</span>
        <span className="ml-auto text-[#9AA3AF] text-xs">{showHelp ? '▲' : '▼'}</span>
      </button>

      <div ref={scrollRef} className="px-5 py-4 space-y-4 flex-1 min-h-0 overflow-y-auto">
        {showHelp && (
          <div className="text-sm text-[#3A3A3A]">
            <p className="mb-3 text-[#1A1A1A] font-semibold">Here for {clientFirstName}. What I can help with:</p>
            <div className="space-y-2.5 mb-3">
              {CAPABILITIES.map(c => (
                <div key={c.title} className="border border-[#EDEDED] rounded-xl px-3.5 py-2.5">
                  <p className="text-[13px] font-bold text-[#1A1A1A] mb-0.5">{c.title}</p>
                  <p className="text-[12.5px] text-[#6B6B6B] leading-relaxed">{c.body}</p>
                </div>
              ))}
            </div>
            <p className="text-[12.5px] text-[#8A8A8E] leading-relaxed">I read {clientFirstName}’s file to answer. I never publish anything to the client, and any plan I draft is a draft you review and approve.</p>
          </div>
        )}
        {!showHelp && messages.length === 0 && (
          <div className="text-sm text-[#6B6B6B]">
            <p className="mb-3">Ask about {clientFirstName} and the doctrine behind their read. It explains, pressure-tests, and reviews plans, grounded in their file. It can also draft a program for you to approve. Pick a category to see the questions worth asking here.</p>
            <CopilotStarters categories={clientStarterCategories(pathname, clientFirstName)} onPick={send} />
          </div>
        )}

        {messages.map((m, i) => {
          // Draft proposal card — the coach reviews the spec and approves.
          if (m.role === 'assistant' && m.kind === 'draft-proposal' && m.draft) {
            const d = m.draft
            const gen = generatingIdx === i
            const rows: [string, string, string][] = [
              ['Phase', cap(d.progression_phase), d.reasons.progression_phase],
              ['Goal', cap(d.training_goal), d.reasons.training_goal],
              ['Frequency', `${d.training_frequency}x/week`, d.reasons.training_frequency],
              ['Duration', `${d.week_duration} weeks`, d.reasons.week_duration],
              ['Training age', cap(d.training_age), d.reasons.training_age],
              ['Movement competency', cap(d.movement_competency), d.reasons.movement_competency],
            ]
            return (
              <div key={i} className="border border-[#B5CFFC] bg-[rgba(27,109,252,0.04)] rounded-2xl px-4 py-3.5">
                <p className="text-[10px] font-bold text-[#1B6DFC] uppercase tracking-widest mb-2.5" style={{ fontFamily: MONO }}>Proposed program draft</p>
                <label className="block text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider mb-1">Block name</label>
                <input
                  value={d.block_name}
                  onChange={e => updateDraft(i, { block_name: e.target.value })}
                  disabled={gen}
                  className="w-full text-sm border border-[#CBD9F2] rounded-lg px-2.5 py-1.5 mb-3 bg-white focus:outline-none focus:border-[#1B6DFC] disabled:opacity-60"
                />
                <div className="space-y-2 mb-3">
                  {rows.map(([label, val, reason]) => (
                    <div key={label}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[12px] text-[#6B6B6B]">{label}</span>
                        <span className="text-[13px] font-semibold text-[#1A1A1A] text-right">{val}</span>
                      </div>
                      {reason && <p className="text-[11.5px] text-[#8A8A8E] leading-snug mt-0.5">{reason}</p>}
                    </div>
                  ))}
                </div>
                <p className="text-[11.5px] text-[#8A8A8E] leading-snug mb-3">Equipment defaults to barbell, dumbbell, bodyweight. Change it on the full generator if this client differs. Generating creates a <strong>draft</strong> only. Nothing reaches {clientFirstName} until you publish it.</p>
                {gen ? (
                  <div className="flex items-center gap-2 text-[13px] text-[#1B6DFC]">
                    <span className="w-2 h-2 rounded-full bg-[#1B6DFC] animate-bounce motion-reduce:animate-none" />
                    Generating the draft. This takes 1 to 2 minutes, keep the panel open.
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => generateDraft(i)}
                      disabled={busy}
                      className="text-[13px] font-semibold px-3.5 py-1.5 bg-[#1B6DFC] text-white rounded-lg hover:bg-[#1558d6] transition-colors disabled:opacity-40"
                    >
                      Generate this draft
                    </button>
                    <button
                      onClick={() => dismissProposal(i)}
                      disabled={busy}
                      className="text-[13px] px-3 py-1.5 text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors disabled:opacity-40"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            )
          }

          // Draft created — link the coach to the program page to review + publish.
          if (m.role === 'assistant' && m.kind === 'draft-done' && m.draft) {
            return (
              <div key={i} className="border border-[#BBE3C8] bg-[rgba(34,160,84,0.06)] rounded-2xl px-4 py-3.5">
                <p className="text-[13px] font-semibold text-[#1A1A1A] mb-1">Draft created: {m.draft.block_name}</p>
                <p className="text-[12.5px] text-[#6B6B6B] leading-relaxed mb-2.5">It’s saved as a draft (not live). Open the program page to review every session, edit if needed, and publish when you’re happy.</p>
                <a
                  href={`/dashboard/clients/${clientId}/program`}
                  className="inline-block text-[13px] font-semibold px-3.5 py-1.5 bg-[#1A1A1A] text-white rounded-lg hover:bg-black transition-colors"
                >
                  Review the draft
                </a>
              </div>
            )
          }

          // Surgical edit proposal — the coach approves one named change.
          if (m.role === 'assistant' && m.kind === 'edit-proposal' && m.edit) {
            const applying = applyingIdx === i
            return (
              <div key={i} className="border border-[#E7C9A0] bg-[rgba(180,120,20,0.05)] rounded-2xl px-4 py-3.5">
                <p className="text-[10px] font-bold text-[#B4780E] uppercase tracking-widest mb-2" style={{ fontFamily: MONO }}>Proposed change</p>
                <p className="text-[13px] text-[#1A1A1A] leading-relaxed mb-3 whitespace-pre-wrap">{m.edit.summary || 'Apply this change to the draft.'}</p>
                <p className="text-[11.5px] text-[#8A8A8E] leading-snug mb-3">Only this changes. The rest of the draft stays exactly as it is, and it stays a draft until you publish it.</p>
                {applying ? (
                  <div className="flex items-center gap-2 text-[13px] text-[#B4780E]">
                    <span className="w-2 h-2 rounded-full bg-[#B4780E] animate-bounce motion-reduce:animate-none" />
                    Applying to the draft…
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => applyEdit(i)}
                      disabled={busy}
                      className="text-[13px] font-semibold px-3.5 py-1.5 bg-[#B4780E] text-white rounded-lg hover:bg-[#996408] transition-colors disabled:opacity-40"
                    >
                      Apply this change
                    </button>
                    <button
                      onClick={() => dismissProposal(i)}
                      disabled={busy}
                      className="text-[13px] px-3 py-1.5 text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors disabled:opacity-40"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            )
          }

          // Edit applied — confirm + link back to review the updated draft.
          if (m.role === 'assistant' && m.kind === 'edit-done') {
            return (
              <div key={i} className="border border-[#BBE3C8] bg-[rgba(34,160,84,0.06)] rounded-2xl px-4 py-3.5">
                <p className="text-[13px] font-semibold text-[#1A1A1A] mb-1">Change applied to the draft</p>
                {m.content && <p className="text-[12.5px] text-[#6B6B6B] leading-relaxed mb-2.5">{m.content}</p>}
                <a
                  href={`/dashboard/clients/${clientId}/program`}
                  className="inline-block text-[13px] font-semibold px-3.5 py-1.5 bg-[#1A1A1A] text-white rounded-lg hover:bg-black transition-colors"
                >
                  Review the draft
                </a>
              </div>
            )
          }

          // Plain text bubble (default).
          return (
            <div key={i} className={m.role === 'user' ? 'flex justify-end' : ''}>
              <div className={m.role === 'user'
                ? 'max-w-[85%] bg-[#1B6DFC] text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed'
                : 'max-w-[92%] bg-[#F5F3EE] text-[#1A1A1A] rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed'}>
                <p className="whitespace-pre-wrap">{m.content}</p>
                {m.role === 'assistant' && m.id && (
                  <button
                    onClick={() => toggleFlag(i)}
                    title={m.flagged ? 'Flagged for review — click to unflag' : 'Flag this answer for review'}
                    className={`mt-2 inline-flex items-center gap-1 text-[11px] ${m.flagged ? 'text-amber-700 font-semibold' : 'text-[#999999] hover:text-[#6B6B6B]'} transition-colors`}
                  >
                    👎 {m.flagged ? 'Flagged for review' : 'Flag'}
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {(loading || proposing || proposingEdit) && (
          <div className="bg-[#F5F3EE] rounded-2xl rounded-bl-sm px-4 py-3 inline-flex items-center gap-1.5 w-fit" aria-label="Co-pilot is working">
            <span className="w-2 h-2 rounded-full bg-[#9AA3AF] animate-bounce motion-reduce:animate-none" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-[#9AA3AF] animate-bounce motion-reduce:animate-none" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-[#9AA3AF] animate-bounce motion-reduce:animate-none" style={{ animationDelay: '300ms' }} />
          </div>
        )}

        {/* Suggested follow-ups under the latest answer — tap to continue or steer. */}
        {!busy && (() => {
          const last = messages[messages.length - 1]
          if (!last || last.role !== 'assistant' || !last.followups?.length) return null
          return (
            <div className="flex flex-col gap-1.5 pt-1">
              <p className="text-[10px] font-bold text-[#999999] uppercase tracking-widest" style={{ fontFamily: MONO }}>Follow up</p>
              {last.followups.map((f, i) => (
                <button
                  key={i}
                  onClick={() => send(f)}
                  className="text-left text-[13px] text-[#1B6DFC] border border-[#B5CFFC] bg-[rgba(27,109,252,0.05)] hover:bg-[rgba(27,109,252,0.1)] rounded-lg px-3 py-1.5 transition-colors"
                >
                  {f}
                </button>
              ))}
            </div>
          )
        })()}

        {error && (
          <div className="text-[13px] text-red-600">{error}</div>
        )}
      </div>

      {/* Program actions — Phase 2 draft + Phase 3 refine entry points. */}
      <div className="px-3 pt-2 shrink-0 flex gap-2">
        <button
          onClick={() => { setEditMode(false); proposeDraft() }}
          disabled={busy}
          className="flex-1 text-[13px] font-medium px-3 py-2 border border-[#B5CFFC] text-[#1B6DFC] rounded-xl hover:bg-[rgba(27,109,252,0.05)] transition-colors disabled:opacity-40"
        >
          ＋ Draft a program
        </button>
        <button
          onClick={() => { setError(''); setEditMode(m => !m) }}
          disabled={busy}
          aria-pressed={editMode}
          className={`flex-1 text-[13px] font-medium px-3 py-2 border rounded-xl transition-colors disabled:opacity-40 ${
            editMode
              ? 'border-[#E7C9A0] bg-[rgba(180,120,20,0.08)] text-[#B4780E]'
              : 'border-[#E7C9A0] text-[#B4780E] hover:bg-[rgba(180,120,20,0.05)]'
          }`}
        >
          ✎ Refine the draft
        </button>
      </div>
      {editMode && (
        <p className="px-4 pt-1.5 text-[11.5px] text-[#8A8A8E] leading-snug shrink-0">
          Refine mode: describe one change to the draft program (e.g. “swap the barbell squat for a hip thrust”, “drop the bench to 3 sets”). I’ll show it before it’s applied.
        </p>
      )}

      <div className="border-t border-[#E5E5E5] p-3 mt-2">
        <form
          onSubmit={e => { e.preventDefault(); editMode ? proposeEdit(input) : send(input) }}
          className="flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); editMode ? proposeEdit(input) : send(input) } }}
            placeholder={editMode ? 'Describe one change to the draft…' : `Ask about ${clientFirstName}…`}
            rows={2}
            className={`flex-1 resize-none text-sm border rounded-xl px-3 py-2 focus:outline-none ${editMode ? 'border-[#E7C9A0] focus:border-[#B4780E]' : 'border-[#E5E5E5] focus:border-[#1B6DFC]'}`}
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className={`text-sm font-medium px-4 py-2 text-white rounded-xl transition-colors disabled:opacity-40 ${editMode ? 'bg-[#B4780E] hover:bg-[#996408]' : 'bg-[#1B6DFC] hover:bg-[#1558d6]'}`}
          >
            {editMode ? 'Propose' : 'Ask'}
          </button>
        </form>
      </div>
    </div>
  )
}
