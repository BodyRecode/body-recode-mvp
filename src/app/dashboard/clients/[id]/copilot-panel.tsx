'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { CopilotStarters } from '@/components/copilot-starters'
import { clientStarterCategories } from '@/lib/copilot-starter-questions'
import { parseApiResponse } from '@/lib/parse-api-response'

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

// A proposed nutrition-plan generation spec (Phase 5). Same confirm-first
// pattern as the program draft, off the read-only suggest-nutrition engine.
// `raw` carries the full suggestion so generate-nutrition gets every field.
type NutritionSpec = {
  plan_name: string
  entry_state: string
  protein_anchor_g: number
  carb_demand_level: string
  meal_frequency: number
  reasons: Record<string, string>
  raw: Record<string, unknown>
}

// A proposed surgical edit to the draft (Phase 3 program, Phase 5 nutrition).
// `operations` is an opaque list of validated patch ops the server applies
// deterministically; `summary` is the plain-English description the coach OKs.
type EditProposal = { operations: unknown[]; summary: string }

// Which artefact the refine composer is targeting.
type EditTarget = 'program' | 'nutrition'

type Msg = {
  id: string | null
  role: 'user' | 'assistant'
  content: string
  flagged: boolean
  followups?: string[]
  /** Special assistant cards for the draft + refine flows. Absent = text bubble. */
  kind?: 'draft-proposal' | 'draft-done' | 'edit-proposal' | 'edit-done'
    | 'nutrition-proposal' | 'nutrition-done'
  draft?: DraftSpec
  nutrition?: NutritionSpec
  edit?: EditProposal
  /** For edit cards: which artefact the ops apply to (defaults to program). */
  editTarget?: EditTarget
}


const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

// What the co-pilot can help with — shown in the persistent "What I can help
// with" panel. Client-scoped variant.
const CAPABILITIES: { title: string; body: string }[] = [
  { title: 'Explain this client’s read', body: 'Why they landed in this state or phase, and what’s driving it.' },
  { title: 'Review a generated plan', body: 'Check the program or nutrition against doctrine and flag what’s off.' },
  { title: 'Pressure-test your decision', body: '“Talk me out of progressing them.” “Should this be Restoration?”' },
  { title: 'Draft a program or nutrition plan', body: 'Propose a full generation spec you review and approve before it runs.' },
  { title: 'Refine a draft', body: 'Describe one change (swap an exercise or food, adjust sets or a macro) and approve it before it applies.' },
]

export default function CopilotPanel({
  clientId,
  clientFirstName,
  sessionId,
  onClose,
  className,
}: {
  clientId: string
  clientFirstName: string
  /**
   * Identifies this conversation. Minted fresh each time the bubble is opened, so
   * the panel always starts empty and the route only replays this session's turns.
   */
  sessionId: string
  /** When provided (bubble mode), a ✕ shows in the header. */
  onClose?: () => void
  /** Extra classes for the outer card (bubble mode makes it fill its popover). */
  className?: string
}) {
  const pathname = usePathname() ?? ''
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showHelp, setShowHelp] = useState(false)
  // Program draft flow: `proposing` = fetching the spec; `generatingIdx` = which
  // proposal card is currently running the real generator.
  const [proposing, setProposing] = useState(false)
  const [generatingIdx, setGeneratingIdx] = useState<number | null>(null)
  // Nutrition draft flow (Phase 5) — mirrors the program one.
  const [proposingNutrition, setProposingNutrition] = useState(false)
  const [generatingNutritionIdx, setGeneratingNutritionIdx] = useState<number | null>(null)
  // Refine flow: `editMode` = which artefact the composer edits (null = normal
  // chat); `proposingEdit` = working out the patch; `applyingIdx` = card saving.
  const [editMode, setEditMode] = useState<EditTarget | null>(null)
  const [proposingEdit, setProposingEdit] = useState(false)
  const [applyingIdx, setApplyingIdx] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const busy = loading || proposing || generatingIdx !== null || proposingNutrition || generatingNutritionIdx !== null || proposingEdit || applyingIdx !== null

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading, proposing, generatingIdx, proposingNutrition, generatingNutritionIdx, proposingEdit, applyingIdx])

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
        body: JSON.stringify({ message: q, session_id: sessionId }),
      })
      const { data, error: apiError } = await parseApiResponse<any>(res)
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
      const { data, error: apiError } = await parseApiResponse<any>(res)
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
      const { data, error: apiError } = await parseApiResponse<any>(res)
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      // A program built without its macro arc has no phase objective and no
      // coach guidance. Say so rather than letting it look like a clean run.
      if (data.arc_warning) setError(data.arc_warning)
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

  // ── Nutrition draft (Phase 5) — mirrors proposeDraft/generateDraft ─────────
  // Step 1 (read-only): the vetted suggest-nutrition engine derives the inputs.
  async function proposeNutritionDraft() {
    if (busy) return
    setError('')
    setMessages(prev => [...prev, { id: null, role: 'user', content: 'Draft a nutrition plan', flagged: false }])
    setProposingNutrition(true)
    try {
      const res = await fetch('/api/suggest-nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId }),
      })
      const { data, error: apiError } = await parseApiResponse<any>(res)
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      const s = (data.suggestion || {}) as Record<string, any>
      const spec: NutritionSpec = {
        plan_name: String(s.plan_name ?? 'Nutrition Plan'),
        entry_state: String(s.entry_state ?? ''),
        protein_anchor_g: Number(s.protein_anchor_g) || 0,
        carb_demand_level: String(s.carb_demand_level ?? ''),
        meal_frequency: Number(s.meal_frequency) || 0,
        reasons: {
          entry_state: s.entry_state_reason ?? '',
          protein_anchor_g: s.protein_anchor_g_reason ?? '',
          carb_demand_level: s.carb_demand_level_reason ?? '',
          meal_frequency: s.meal_frequency_reason ?? '',
        },
        raw: s,
      }
      setMessages(prev => [...prev, { id: null, role: 'assistant', content: '', flagged: false, kind: 'nutrition-proposal', nutrition: spec }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not build a nutrition proposal')
    } finally {
      setProposingNutrition(false)
    }
  }

  // Step 2 (mutation, explicit coach action): generate-nutrition saves a DRAFT.
  async function generateNutritionDraft(idx: number) {
    const spec = messages[idx]?.nutrition
    if (!spec || busy) return
    if (!spec.plan_name.trim()) { setError('Give the plan a name first.'); return }
    setError('')
    setGeneratingNutritionIdx(idx)
    try {
      const res = await fetch('/api/generate-nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...spec.raw, client_id: clientId, plan_name: spec.plan_name }),
      })
      const { data, error: apiError } = await parseApiResponse<any>(res)
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setMessages(prev => prev.map((m, i) => (i === idx ? { ...m, kind: 'nutrition-done' } : m)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGeneratingNutritionIdx(null)
    }
  }

  // Refine endpoint by artefact: program vs nutrition draft.
  const editEndpoint = (target: EditTarget) =>
    target === 'nutrition'
      ? `/api/clients/${clientId}/copilot/edit-nutrition`
      : `/api/clients/${clientId}/copilot/edit-draft`

  // Refine step 1 (read-only): ask the model for a minimal patch for one change.
  async function proposeEdit(text: string) {
    const target = editMode
    const instruction = text.trim()
    if (!target || !instruction || busy) return
    setError('')
    setInput('')
    setMessages(prev => [...prev, { id: null, role: 'user', content: instruction, flagged: false }])
    setProposingEdit(true)
    try {
      const res = await fetch(editEndpoint(target), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'propose', instruction }),
      })
      const { data, error: apiError } = await parseApiResponse<any>(res)
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      const operations: unknown[] = Array.isArray(data.operations) ? data.operations : []
      const summary: string = typeof data.summary === 'string' ? data.summary : ''
      if (operations.length === 0) {
        // Ambiguous, unsupported, or refused on doctrine — show the reason, no Apply.
        setMessages(prev => [...prev, { id: null, role: 'assistant', content: summary || 'I could not make that change. Try naming exactly what to change.', flagged: false }])
      } else {
        setMessages(prev => [...prev, { id: null, role: 'assistant', content: '', flagged: false, kind: 'edit-proposal', edit: { operations, summary }, editTarget: target }])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not work out the edit')
    } finally {
      setProposingEdit(false)
    }
  }

  // Refine step 2 (mutation, explicit coach action): apply the patch to the draft.
  async function applyEdit(idx: number) {
    const m = messages[idx]
    const proposal = m?.edit
    const target: EditTarget = m?.editTarget ?? 'program'
    if (!proposal || busy) return
    setError('')
    setApplyingIdx(idx)
    try {
      const res = await fetch(editEndpoint(target), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply', operations: proposal.operations }),
      })
      const { data, error: apiError } = await parseApiResponse<any>(res)
      if (!res.ok) throw new Error(data.error || 'Could not apply the change')
      const applied: string[] = Array.isArray(data.applied) ? data.applied : []
      setMessages(prev => prev.map((mm, i) => (i === idx ? { ...mm, kind: 'edit-done', content: applied.join(' ') } : mm)))
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
    <div className={`br-card overflow-hidden flex flex-col ${className ?? ''}`}>
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[#E8EAEE] bg-[#FBFCFD] shrink-0">
        <p className="text-[13.5px] font-semibold text-[#141821] tracking-[-0.015em]">
          Co-Pilot · Doctrine tutor
        </p>
        <span className="ml-auto text-[11.5px] text-[#98A0AD]">coach only · you approve every change</span>
        {onClose && (
          <button onClick={onClose} aria-label="Close co-pilot" className="text-[#98A0AD] hover:text-[#141821] text-lg leading-none -my-1">✕</button>
        )}
      </div>

      {/* Persistent "What I can help with" bar — available any time. */}
      <button
        onClick={() => setShowHelp(s => !s)}
        aria-expanded={showHelp}
        className="flex items-center gap-2 px-5 py-2 border-b border-[#EFF1F4] bg-white text-[#1B6DFC] hover:bg-[rgba(27,109,252,0.04)] transition-colors shrink-0"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="#1B6DFC" strokeWidth="1.6" />
          <path d="M9.5 9.2a2.5 2.5 0 1 1 3.2 2.4c-.7.25-1.2.9-1.2 1.65v.35" stroke="#1B6DFC" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="12" cy="16.4" r="1" fill="#1B6DFC" />
        </svg>
        <span className="text-[13px] font-semibold">What I can help with</span>
        <ChevronDown size={14} className={`ml-auto text-[#98A0AD] transition-transform duration-150 ${showHelp ? 'rotate-180' : ''}`} />
      </button>

      <div ref={scrollRef} className="px-5 py-4 space-y-4 flex-1 min-h-0 overflow-y-auto">
        {showHelp && (
          <div className="text-sm text-[#43474F]">
            <p className="mb-3 text-[#141821] font-semibold">Here for {clientFirstName}. What I can help with:</p>
            <div className="space-y-2.5 mb-3">
              {CAPABILITIES.map(c => (
                <div key={c.title} className="border border-[#EFF1F4] rounded-xl px-3.5 py-2.5">
                  <p className="text-[13px] font-semibold text-[#141821] mb-0.5">{c.title}</p>
                  <p className="text-[12.5px] text-[#666D7A] leading-relaxed">{c.body}</p>
                </div>
              ))}
            </div>
            <p className="text-[12.5px] text-[#666D7A] leading-relaxed">I read {clientFirstName}’s file to answer. I never publish anything to the client, and any plan I draft is a draft you review and approve.</p>
          </div>
        )}
        {!showHelp && messages.length === 0 && (
          <div className="text-sm text-[#666D7A]">
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
              <div key={i} className="border border-[#B5CFFC] bg-[rgba(27,109,252,0.04)] rounded-xl px-4 py-3.5">
                <p className="text-[12.5px] font-medium text-[#1B6DFC] mb-2.5">Proposed program draft</p>
                <label className="block text-[11px] font-medium text-[#666D7A] mb-1">Block name</label>
                <input
                  value={d.block_name}
                  onChange={e => updateDraft(i, { block_name: e.target.value })}
                  disabled={gen}
                  className="w-full text-sm border border-[#CBD9F2] rounded-lg px-2.5 py-1.5 mb-3 bg-white focus:outline-none focus:border-[#B9D0FD] focus:ring-[3px] focus:ring-[rgba(27,109,252,0.13)] disabled:opacity-60"
                />
                <div className="space-y-2 mb-3">
                  {rows.map(([label, val, reason]) => (
                    <div key={label}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[12px] text-[#666D7A]">{label}</span>
                        <span className="text-[13px] font-semibold text-[#141821] text-right">{val}</span>
                      </div>
                      {reason && <p className="text-[11.5px] text-[#666D7A] leading-snug mt-0.5">{reason}</p>}
                    </div>
                  ))}
                </div>
                <p className="text-[11.5px] text-[#666D7A] leading-snug mb-3">Equipment defaults to barbell, dumbbell, bodyweight. Change it on the full generator if this client differs. Generating creates a <strong>draft</strong> only. Nothing reaches {clientFirstName} until you publish it.</p>
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
                      className="text-[13px] font-semibold px-3.5 py-1.5 text-white rounded-lg border border-[#1560E0] bg-[linear-gradient(180deg,#3B82F9,#1B6DFC)] hover:bg-[linear-gradient(180deg,#2E77F7,#1560E0)] shadow-[0_1px_2px_rgba(27,109,252,0.4),inset_0_1px_0_rgba(255,255,255,0.28)] transition-all active:translate-y-[0.5px] disabled:opacity-40"
                    >
                      Generate this draft
                    </button>
                    <button
                      onClick={() => dismissProposal(i)}
                      disabled={busy}
                      className="text-[13px] px-3 py-1.5 text-[#666D7A] hover:text-[#141821] transition-colors disabled:opacity-40"
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
              <div key={i} className="border border-[#BBE3C8] bg-[rgba(34,160,84,0.06)] rounded-xl px-4 py-3.5">
                <p className="text-[13px] font-semibold text-[#141821] mb-1">Draft created: {m.draft.block_name}</p>
                <p className="text-[12.5px] text-[#666D7A] leading-relaxed mb-2.5">It’s saved as a draft (not live). Open the program page to review every session, edit if needed, and publish when you’re happy.</p>
                <a
                  href={`/dashboard/clients/${clientId}/program`}
                  className="inline-block text-[13px] font-semibold px-3.5 py-1.5 bg-[#141821] text-white rounded-lg hover:bg-black transition-colors"
                >
                  Review the draft
                </a>
              </div>
            )
          }

          // Nutrition proposal card (Phase 5) — coach reviews + approves.
          if (m.role === 'assistant' && m.kind === 'nutrition-proposal' && m.nutrition) {
            const n = m.nutrition
            const gen = generatingNutritionIdx === i
            const rows: [string, string, string][] = [
              ['Entry state', cap(n.entry_state.replace(/_/g, ' ')), n.reasons.entry_state],
              ['Protein anchor', `${n.protein_anchor_g}g`, n.reasons.protein_anchor_g],
              ['Carb demand', cap(n.carb_demand_level), n.reasons.carb_demand_level],
              ['Meals/day', `${n.meal_frequency}`, n.reasons.meal_frequency],
            ]
            return (
              <div key={i} className="border border-[#B5CFFC] bg-[rgba(27,109,252,0.04)] rounded-xl px-4 py-3.5">
                <p className="text-[12.5px] font-medium text-[#1B6DFC] mb-2.5">Proposed nutrition draft</p>
                <label className="block text-[11px] font-medium text-[#666D7A] mb-1">Plan name</label>
                <input
                  value={n.plan_name}
                  onChange={e => setMessages(prev => prev.map((mm, ii) => (ii === i && mm.nutrition ? { ...mm, nutrition: { ...mm.nutrition, plan_name: e.target.value } } : mm)))}
                  disabled={gen}
                  className="w-full text-sm border border-[#CBD9F2] rounded-lg px-2.5 py-1.5 mb-3 bg-white focus:outline-none focus:border-[#B9D0FD] focus:ring-[3px] focus:ring-[rgba(27,109,252,0.13)] disabled:opacity-60"
                />
                <div className="space-y-2 mb-3">
                  {rows.map(([label, val, reason]) => (
                    <div key={label}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[12px] text-[#666D7A]">{label}</span>
                        <span className="text-[13px] font-semibold text-[#141821] text-right">{val}</span>
                      </div>
                      {reason && <p className="text-[11.5px] text-[#666D7A] leading-snug mt-0.5">{reason}</p>}
                    </div>
                  ))}
                </div>
                <p className="text-[11.5px] text-[#666D7A] leading-snug mb-3">Generating builds the meals against the protein anchor and calorie floor, and creates a <strong>draft</strong> only. Nothing reaches {clientFirstName} until you publish it.</p>
                {gen ? (
                  <div className="flex items-center gap-2 text-[13px] text-[#1B6DFC]">
                    <span className="w-2 h-2 rounded-full bg-[#1B6DFC] animate-bounce motion-reduce:animate-none" />
                    Generating the nutrition draft. This takes a minute or two, keep the panel open.
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => generateNutritionDraft(i)}
                      disabled={busy}
                      className="text-[13px] font-semibold px-3.5 py-1.5 text-white rounded-lg border border-[#1560E0] bg-[linear-gradient(180deg,#3B82F9,#1B6DFC)] hover:bg-[linear-gradient(180deg,#2E77F7,#1560E0)] shadow-[0_1px_2px_rgba(27,109,252,0.4),inset_0_1px_0_rgba(255,255,255,0.28)] transition-all active:translate-y-[0.5px] disabled:opacity-40"
                    >
                      Generate this draft
                    </button>
                    <button
                      onClick={() => dismissProposal(i)}
                      disabled={busy}
                      className="text-[13px] px-3 py-1.5 text-[#666D7A] hover:text-[#141821] transition-colors disabled:opacity-40"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            )
          }

          // Nutrition draft created — link to the nutrition page to review + publish.
          if (m.role === 'assistant' && m.kind === 'nutrition-done' && m.nutrition) {
            return (
              <div key={i} className="border border-[#BBE3C8] bg-[rgba(34,160,84,0.06)] rounded-xl px-4 py-3.5">
                <p className="text-[13px] font-semibold text-[#141821] mb-1">Nutrition draft created: {m.nutrition.plan_name}</p>
                <p className="text-[12.5px] text-[#666D7A] leading-relaxed mb-2.5">It’s saved as a draft (not live). Open the nutrition page to review the meals, edit if needed, and publish when you’re happy.</p>
                <a
                  href={`/dashboard/clients/${clientId}/nutrition`}
                  className="inline-block text-[13px] font-semibold px-3.5 py-1.5 bg-[#141821] text-white rounded-lg hover:bg-black transition-colors"
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
              <div key={i} className="border border-[#E7C9A0] bg-[rgba(180,120,20,0.05)] rounded-xl px-4 py-3.5">
                <p className="text-[12.5px] font-medium text-[#A96A12] mb-2">Proposed change</p>
                <p className="text-[13px] text-[#141821] leading-relaxed mb-3 whitespace-pre-wrap">{m.edit.summary || 'Apply this change to the draft.'}</p>
                <p className="text-[11.5px] text-[#666D7A] leading-snug mb-3">Only this changes. The rest of the draft stays exactly as it is, and it stays a draft until you publish it.</p>
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
                      className="text-[13px] px-3 py-1.5 text-[#666D7A] hover:text-[#141821] transition-colors disabled:opacity-40"
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
            const nutritionEdit = m.editTarget === 'nutrition'
            return (
              <div key={i} className="border border-[#BBE3C8] bg-[rgba(34,160,84,0.06)] rounded-xl px-4 py-3.5">
                <p className="text-[13px] font-semibold text-[#141821] mb-1">Change applied to the {nutritionEdit ? 'nutrition draft' : 'draft'}</p>
                {m.content && <p className="text-[12.5px] text-[#666D7A] leading-relaxed mb-2.5">{m.content}</p>}
                <a
                  href={`/dashboard/clients/${clientId}/${nutritionEdit ? 'nutrition' : 'program'}`}
                  className="inline-block text-[13px] font-semibold px-3.5 py-1.5 bg-[#141821] text-white rounded-lg hover:bg-black transition-colors"
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
                ? 'max-w-[85%] bg-[linear-gradient(180deg,#3B82F9,#1B6DFC)] text-white rounded-xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed shadow-[0_1px_2px_rgba(27,109,252,0.35)]'
                : 'max-w-[92%] bg-[#F4F6F9] border border-[#E8EAEE] text-[#141821] rounded-xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed'}>
                <p className="whitespace-pre-wrap">{m.content}</p>
                {m.role === 'assistant' && m.id && (
                  <button
                    onClick={() => toggleFlag(i)}
                    title={m.flagged ? 'Flagged for review — click to unflag' : 'Flag this answer for review'}
                    className={`mt-2 inline-flex items-center gap-1 text-[11px] ${m.flagged ? 'text-[#A96A12] font-semibold' : 'text-[#98A0AD] hover:text-[#666D7A]'} transition-colors`}
                  >
                    👎 {m.flagged ? 'Flagged for review' : 'Flag'}
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {(loading || proposing || proposingNutrition || proposingEdit) && (
          <div className="bg-[#F4F6F9] br-card rounded-bl-sm px-4 py-3 inline-flex items-center gap-1.5 w-fit" aria-label="Co-pilot is working">
            <span className="w-2 h-2 rounded-full bg-[#98A0AD] animate-bounce motion-reduce:animate-none" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-[#98A0AD] animate-bounce motion-reduce:animate-none" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-[#98A0AD] animate-bounce motion-reduce:animate-none" style={{ animationDelay: '300ms' }} />
          </div>
        )}

        {/* Suggested follow-ups under the latest answer — tap to continue or steer. */}
        {!busy && (() => {
          const last = messages[messages.length - 1]
          if (!last || last.role !== 'assistant' || !last.followups?.length) return null
          return (
            <div className="flex flex-col gap-1.5 pt-1">
              <p className="text-[11.5px] text-[#98A0AD]">Follow up</p>
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
          <div className="text-[13px] text-[#C82626]">{error}</div>
        )}
      </div>

      {/* Draft + refine actions — program (Phase 2/3) and nutrition (Phase 5). */}
      <div className="px-3 pt-2 shrink-0 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => { setEditMode(null); proposeDraft() }}
            disabled={busy}
            className="flex-1 text-[13px] font-medium px-3 py-2 border border-[#B5CFFC] text-[#1B6DFC] rounded-xl hover:bg-[rgba(27,109,252,0.05)] transition-colors disabled:opacity-40"
          >
            ＋ Draft a program
          </button>
          <button
            onClick={() => { setError(''); setEditMode(m => (m === 'program' ? null : 'program')) }}
            disabled={busy}
            aria-pressed={editMode === 'program'}
            className={`flex-1 text-[13px] font-medium px-3 py-2 border rounded-xl transition-colors disabled:opacity-40 ${
              editMode === 'program'
                ? 'border-[#E7C9A0] bg-[rgba(180,120,20,0.08)] text-[#B4780E]'
                : 'border-[#E7C9A0] text-[#B4780E] hover:bg-[rgba(180,120,20,0.05)]'
            }`}
          >
            ✎ Refine program
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setEditMode(null); proposeNutritionDraft() }}
            disabled={busy}
            className="flex-1 text-[13px] font-medium px-3 py-2 border border-[#B5CFFC] text-[#1B6DFC] rounded-xl hover:bg-[rgba(27,109,252,0.05)] transition-colors disabled:opacity-40"
          >
            ＋ Draft nutrition
          </button>
          <button
            onClick={() => { setError(''); setEditMode(m => (m === 'nutrition' ? null : 'nutrition')) }}
            disabled={busy}
            aria-pressed={editMode === 'nutrition'}
            className={`flex-1 text-[13px] font-medium px-3 py-2 border rounded-xl transition-colors disabled:opacity-40 ${
              editMode === 'nutrition'
                ? 'border-[#E7C9A0] bg-[rgba(180,120,20,0.08)] text-[#B4780E]'
                : 'border-[#E7C9A0] text-[#B4780E] hover:bg-[rgba(180,120,20,0.05)]'
            }`}
          >
            ✎ Refine nutrition
          </button>
        </div>
      </div>
      {editMode && (
        <p className="px-4 pt-1.5 text-[11.5px] text-[#666D7A] leading-snug shrink-0">
          Refine mode ({editMode}): describe one change to the {editMode} draft ({editMode === 'nutrition' ? '“swap the oats for berries”, “drop to 3 meals”' : '“swap the barbell squat for a hip thrust”, “drop the bench to 3 sets”'}). I’ll show it before it’s applied.
        </p>
      )}

      <div className="border-t border-[#E8EAEE] p-3 mt-2">
        <form
          onSubmit={e => { e.preventDefault(); editMode ? proposeEdit(input) : send(input) }}
          className="flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); editMode ? proposeEdit(input) : send(input) } }}
            placeholder={editMode ? `Describe one change to the ${editMode} draft…` : `Ask about ${clientFirstName}…`}
            rows={2}
            className={`flex-1 resize-none text-sm border rounded-xl px-3 py-2 focus:outline-none ${editMode ? 'border-[#E7C9A0] focus:border-[#B4780E]' : 'border-[#E8EAEE] focus:border-[#1B6DFC]'}`}
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className={`text-sm font-medium px-4 py-2 text-white rounded-xl transition-colors disabled:opacity-40 ${editMode ? 'bg-[#B4780E] hover:bg-[#996408]' : 'bg-[#1B6DFC] hover:bg-[#1560E0]'}`}
          >
            {editMode ? 'Propose' : 'Ask'}
          </button>
        </form>
      </div>
    </div>
  )
}
