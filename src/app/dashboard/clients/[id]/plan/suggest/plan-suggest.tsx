'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import StickyScrollNav from '@/components/sticky-scroll-nav'
import GenerationProgressOverlay from '@/components/generation-progress-overlay'
import { parseApiResponse } from '@/lib/parse-api-response'

const NAV_SECTIONS = [
  { id: 'rationale', title: 'Rationale' },
  { id: 'plan-details', title: 'Plan Details' },
  { id: 'blocks', title: 'Meso Blocks' },
]

interface SuggestedBlock {
  block_name: string
  progression_phase: string
  training_goal: string
  week_duration: number
  execution_arc: string
  phase_category: string
  phase_objective: string
  implied_frequency: number
  nutrition_context: string
  block_rationale: string
}

interface Suggestion {
  plan_name: string
  plan_name_reason: string
  macro_objective: string
  macro_objective_reason: string
  overall_rationale: string
  blocks: SuggestedBlock[]
}

const phaseColour: Record<string, string> = {
  accumulation: 'text-[#FFFFFF] bg-[rgba(27,109,252,0.08)] border-[#2A2F39]',
  intensification: 'text-[#C2C6CC] bg-[#1A1E26]/10 border-[#2A2F39]/30',
  realization: 'text-[#D4817E] bg-[#1A1214] border-[#4A2222]',
  restoration: 'text-[#C2C6CC] bg-[#1A1E26]/10 border-[#2A2F39]/30',
}

const goalColour: Record<string, string> = {
  strength: 'text-[#C2C6CC] bg-[#1A1E26] border-[#2A2F39]',
  hypertrophy: 'text-[#C2C6CC] bg-[#1A1E26]/10 border-[#2A2F39]/30',
  capacity: 'text-[#FAFAF8] bg-[rgba(27,109,252,0.08)] border-[#2A2F39]',
}

const PHASES = ['accumulation', 'intensification', 'realization', 'restoration']
const GOALS = ['strength', 'hypertrophy', 'capacity']
const ARCS = ['short', 'mid', 'long']
const DURATIONS = [2, 3, 4, 5, 6, 7, 8, 10, 12]

const PHASE_CATEGORIES = [
  'Accumulation-Oriented', 'Intensification-Oriented', 'Consolidation-Oriented',
  'Recovery-Dominant', 'Exposure-Management',
]
const PHASE_OBJECTIVES = [
  'Capacity Restoration', 'Capacity Building', 'Performance Expression', 'Consolidation and Stability',
]

export default function MacroPlanSuggest({ clientId }: { clientId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)
  // What the doctrine clamp changed, and what it could not fix.
  const [doctrine, setDoctrine] = useState<{ corrections: string[]; warnings: string[] } | null>(null)
  const [coachGuidance, setCoachGuidance] = useState('')

  const [planName, setPlanName] = useState('')
  const [macroObjective, setMacroObjective] = useState('')
  const [blocks, setBlocks] = useState<SuggestedBlock[]>([])
  const [editingBlock, setEditingBlock] = useState<number | null>(null)

  useEffect(() => {
    // AbortController guards against React Strict Mode firing the effect twice
    // and leaving stale error state from a cancelled call.
    const ac = new AbortController()
    fetch('/api/suggest-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId }),
      signal: ac.signal,
    })
      .then(r => r.json())
      .then(data => {
        if (ac.signal.aborted) return
        if (data.error) { setError(data.error); setLoading(false); return }
        const s: Suggestion = data.suggestion
        setSuggestion(s)
        setDoctrine(data.doctrine ?? null)
        setPlanName(s.plan_name)
        setMacroObjective(s.macro_objective)
        setBlocks(s.blocks)
        setError(null)
        setLoading(false)
      })
      .catch(err => {
        if (err?.name === 'AbortError') return
        setError('Failed to load suggestion')
        setLoading(false)
      })
    return () => ac.abort()
  }, [clientId])

  // Regenerate the arc with the coach's guidance steering it. Reuses `loading`
  // so the standard progress overlay shows while it runs.
  async function regenerate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/suggest-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, coach_guidance: coachGuidance }),
      })
      const { data, error: apiError } = await parseApiResponse<any>(res)
      if (data.error) { setError(data.error); setLoading(false); return }
      const s: Suggestion = data.suggestion
      setSuggestion(s)
      setDoctrine(data.doctrine ?? null)
      setPlanName(s.plan_name)
      setMacroObjective(s.macro_objective)
      setBlocks(s.blocks)
      setError(null)
      setLoading(false)
    } catch {
      setError('Failed to regenerate the arc')
      setLoading(false)
    }
  }

  function updateBlock(i: number, updates: Partial<SuggestedBlock>) {
    setBlocks(prev => prev.map((b, idx) => idx === i ? { ...b, ...updates } : b))
  }

  function removeBlock(i: number) {
    setBlocks(prev => prev.filter((_, idx) => idx !== i))
  }

  function addBlock() {
    setBlocks(prev => [...prev, {
      block_name: 'New Block',
      progression_phase: 'accumulation',
      training_goal: 'strength',
      week_duration: 4,
      execution_arc: 'mid',
      phase_category: '',
      phase_objective: '',
      implied_frequency: 3,
      nutrition_context: '',
      block_rationale: '',
    }])
    setEditingBlock(blocks.length)
  }

  async function handleApprove() {
    if (!planName) { setError('Plan name required'); return }
    if (blocks.length === 0) { setError('At least one block required'); return }
    setSaving(true)
    setError(null)

    // Create the plan as draft
    const planRes = await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        plan_name: planName,
        macro_objective: macroObjective,
        status: 'draft',
      }),
    })
    const planData = await planRes.json()
    if (!planRes.ok) { setError(planData.error); setSaving(false); return }

    // Add all blocks
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i]
      const blockRes = await fetch(`/api/plan/${planData.plan.id}/blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          block_name: b.block_name,
          progression_phase: b.progression_phase,
          training_goal: b.training_goal,
          week_duration: b.week_duration,
          execution_arc: b.execution_arc,
          phase_category: b.phase_category || null,
          phase_objective: b.phase_objective || null,
          training_frequency: b.implied_frequency,
          notes: b.block_rationale ? `Implied ${b.implied_frequency}x/week. ${b.nutrition_context}` : null,
        }),
      })
      if (!blockRes.ok) {
        const blockData = await blockRes.json()
        setError(`Block ${i + 1} failed: ${blockData.error}`)
        setSaving(false)
        return
      }
    }

    setSaving(false)
    router.push(`/dashboard/clients/${clientId}/plan`)
  }

  if (loading) {
    return (
      <GenerationProgressOverlay
        active
        title="Designing macro arc"
        stages={[
          { start: 0,  label: 'Reading body state, readiness, and training history' },
          { start: 5,  label: 'Selecting the phase sequence and entry point' },
          { start: 12, label: 'Designing the meso blocks (phase, goal, duration, frequency)' },
          { start: 30, label: 'Writing the arc rationale' },
          { start: 55, label: 'Taking longer than usual, give it another moment' },
        ]}
        disclaimer="Arc suggestion reads the full client context and designs a sequenced macro plan (3 to 5 meso blocks) grounded in body state and readiness. Typical: 20 to 45 seconds. The page is not frozen, please don't refresh."
      />
    )
  }

  if (error && !suggestion) {
    return (
      <div className="bg-[#1A1214] border border-[#4A2222] rounded-xl p-5">
        <p className="text-[#D4817E] text-sm">{error}</p>
        <a href={`/dashboard/clients/${clientId}/plan`} className="text-[12.5px] text-[#8A9099] hover:text-[#FAFAF8] mt-3 inline-block">
          Back to plan →
        </a>
      </div>
    )
  }

  if (!suggestion) return null

  const totalWeeks = blocks.reduce((sum, b) => sum + b.week_duration, 0)

  return (
    <div className="flex gap-8 max-w-5xl">
      <StickyScrollNav sections={NAV_SECTIONS} />
      <div className="flex-1 min-w-0 space-y-4">

      {/* Coach guidance — steer the arc, then regenerate (2026-07-12) */}
      <div className="br-card p-5">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <p className="text-[10px] font-medium text-[#FAFAF8]">Coach Guidance</p>
          <span className="text-[10px] text-[#676D76]">optional — steers the arc within doctrine, never breaks the safety gates</span>
        </div>
        <textarea
          value={coachGuidance}
          onChange={e => setCoachGuidance(e.target.value)}
          rows={3}
          placeholder="e.g. Bring body composition in sooner (hypertrophy-leaning, not a strength peak). Keep the running scaled right back this phase. Put a stress-management buffer around week 8 for his FIFO transition."
          className="w-full resize-none text-sm bg-[#0B0D10] border border-[#2A2F39] rounded-lg px-3 py-2 text-[#FAFAF8] focus:outline-none focus:border-[#FAFAF8]"
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={regenerate}
            disabled={loading || !coachGuidance.trim()}
            className="text-[13.5px] font-semibold px-4 py-2 rounded-lg bg-[#FAFAF8] text-[#0B0D10] hover:bg-[#FFFFFF] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Regenerate arc with guidance
          </button>
        </div>
      </div>

      {/* Doctrine clamp. Shown ABOVE the rationale: what the engine proposed
          and what doctrine overrode is the first thing a coach should read,
          not a footnote under the arc. */}
      {doctrine && (doctrine.corrections.length > 0 || doctrine.warnings.length > 0) && (
        <div className="rounded-xl border border-[#FAFAF8]/30 bg-[#14171D] px-5 py-4">
          <p className="text-[10px] font-medium text-[#FAFAF8] mb-2">
            Doctrine clamp
          </p>
          {doctrine.corrections.length > 0 && (
            <>
              <p className="text-[11px] font-semibold text-[#8A9099] mb-1.5">
                Corrected automatically ({doctrine.corrections.length})
              </p>
              <ul className="space-y-1.5 mb-3">
                {doctrine.corrections.map((c, i) => (
                  <li key={i} className="text-[13.5px] text-[#FAFAF8] leading-relaxed flex gap-2">
                    <span className="text-[#FAFAF8] shrink-0">·</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {doctrine.warnings.length > 0 && (
            <>
              <p className="text-[11px] font-semibold text-[#E0A254] mb-1.5">
                Needs your judgement ({doctrine.warnings.length})
              </p>
              <ul className="space-y-1.5">
                {doctrine.warnings.map((w, i) => (
                  <li key={i} className="text-[13.5px] text-[#E0A254] leading-relaxed flex gap-2">
                    <span className="shrink-0">·</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {/* Overall rationale */}
      <div id="rationale" className="scroll-mt-8 bg-[rgba(27,109,252,0.08)] border border-[#2A2F39]/40 rounded-xl px-5 py-4">
        <p className="text-[10px] font-medium text-[#FAFAF8] mb-2">Arc Rationale</p>
        <p className="text-sm text-[#FAFAF8] leading-relaxed">{suggestion.overall_rationale}</p>
      </div>

      {/* Plan name + objective */}
      <div id="plan-details" className="scroll-mt-8 bg-[#14171D] br-card p-5 space-y-4">
        <div>
          <label className="block text-[10px] font-medium text-[#8A9099] mb-1.5">Plan Name</label>
          <input
            value={planName}
            onChange={e => setPlanName(e.target.value)}
            className="w-full bg-[#1A1E26] border border-[#2A2F39] rounded-lg px-3 py-2 text-sm text-[#FAFAF8] focus:outline-none focus:border-[#FFFFFF]"
          />
          <div className="flex items-start gap-2 mt-2">
            <span className="text-[#FAFAF8] text-[12.5px] mt-0.5 shrink-0">→</span>
            <p className="text-[12.5px] text-[#FAFAF8] leading-relaxed">{suggestion.plan_name_reason}</p>
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-medium text-[#8A9099] mb-1.5">Macro Objective</label>
          <input
            value={macroObjective}
            onChange={e => setMacroObjective(e.target.value)}
            className="w-full bg-[#1A1E26] border border-[#2A2F39] rounded-lg px-3 py-2 text-sm text-[#FAFAF8] focus:outline-none focus:border-[#FFFFFF]"
          />
          <div className="flex items-start gap-2 mt-2">
            <span className="text-[#FAFAF8] text-[12.5px] mt-0.5 shrink-0">→</span>
            <p className="text-[12.5px] text-[#FAFAF8] leading-relaxed">{suggestion.macro_objective_reason}</p>
          </div>
        </div>
        <p className="text-[10px] text-[#8A9099]">{blocks.length} blocks · {totalWeeks} weeks total</p>
      </div>

      {/* Meso blocks */}
      <div id="blocks" className="scroll-mt-8">
        <p className="text-[10px] font-medium text-[#8A9099] mb-3 px-1">Meso Blocks</p>
        <div className="space-y-3">
          {blocks.map((block, i) => (
            <div key={i} className="bg-[#14171D] br-card overflow-hidden">
              {/* Block header */}
              <div className="px-5 py-3 border-b border-[#2A2F39] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-[#676D76]">{String(i + 1).padStart(2, '0')}</span>
                  <p className="text-sm font-semibold text-[#FAFAF8]">{block.block_name}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${phaseColour[block.progression_phase] || 'text-[#8A9099] bg-[#1A1E26] border-[#2A2F39]'}`}>
                    {block.progression_phase}
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${goalColour[block.training_goal] || 'text-[#8A9099] bg-[#1A1E26] border-[#2A2F39]'}`}>
                    {block.training_goal}
                  </span>
                  <span className="text-[10px] text-[#8A9099]">{block.week_duration}w</span>
                  <button
                    onClick={() => setEditingBlock(editingBlock === i ? null : i)}
                    className="text-[10px] text-[#676D76] hover:text-[#8A9099] px-2 py-0.5 transition-colors"
                  >
                    {editingBlock === i ? 'Done' : 'Edit'}
                  </button>
                  <button
                    onClick={() => removeBlock(i)}
                    className="text-[10px] text-[#FAFAF8] hover:text-[#D4817E] px-1 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Block summary */}
              {editingBlock !== i && (
                <div className="px-5 py-3 space-y-2">
                  <div className="flex gap-4 text-[12.5px] text-[#8A9099]">
                    <span>{block.implied_frequency}x/week</span>
                    <span className="capitalize">{block.execution_arc} arc</span>
                    {block.phase_category && <span>{block.phase_category}</span>}
                    {block.phase_objective && <span>{block.phase_objective}</span>}
                  </div>
                  {block.nutrition_context && (
                    <p className="text-[10px] text-[#8A9099] leading-relaxed">Nutrition: {block.nutrition_context}</p>
                  )}
                  <div className="flex items-start gap-2 mt-1">
                    <span className="text-[#FAFAF8] text-[10px] mt-0.5 shrink-0">→</span>
                    <p className="text-[12.5px] text-[#FAFAF8] leading-relaxed">{block.block_rationale}</p>
                  </div>
                </div>
              )}

              {/* Block edit form */}
              {editingBlock === i && (
                <div className="px-5 py-4 space-y-3">
                  <div>
                    <label className="block text-[10px] font-medium text-[#8A9099] mb-1">Block Name</label>
                    <input
                      value={block.block_name}
                      onChange={e => updateBlock(i, { block_name: e.target.value })}
                      className="w-full bg-[#1A1E26] border border-[#2A2F39] rounded-lg px-3 py-2 text-sm text-[#FAFAF8] focus:outline-none focus:border-[#FFFFFF]"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-medium text-[#8A9099] mb-1">Phase</label>
                      <select value={block.progression_phase} onChange={e => updateBlock(i, { progression_phase: e.target.value })} className="w-full bg-[#1A1E26] border border-[#2A2F39] rounded-lg px-3 py-2 text-sm text-[#FAFAF8] focus:outline-none">
                        {PHASES.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-[#8A9099] mb-1">Goal</label>
                      <select value={block.training_goal} onChange={e => updateBlock(i, { training_goal: e.target.value })} className="w-full bg-[#1A1E26] border border-[#2A2F39] rounded-lg px-3 py-2 text-sm text-[#FAFAF8] focus:outline-none">
                        {GOALS.map(g => <option key={g} value={g} className="capitalize">{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-[#8A9099] mb-1">Weeks</label>
                      <select value={block.week_duration} onChange={e => updateBlock(i, { week_duration: Number(e.target.value) })} className="w-full bg-[#1A1E26] border border-[#2A2F39] rounded-lg px-3 py-2 text-sm text-[#FAFAF8] focus:outline-none">
                        {DURATIONS.map(d => <option key={d} value={d}>{d} weeks</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-medium text-[#8A9099] mb-1">Arc</label>
                      <select value={block.execution_arc} onChange={e => updateBlock(i, { execution_arc: e.target.value })} className="w-full bg-[#1A1E26] border border-[#2A2F39] rounded-lg px-3 py-2 text-sm text-[#FAFAF8] focus:outline-none">
                        {ARCS.map(a => <option key={a} value={a} className="capitalize">{a}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-[#8A9099] mb-1">Frequency</label>
                      <select value={block.implied_frequency} onChange={e => updateBlock(i, { implied_frequency: Number(e.target.value) })} className="w-full bg-[#1A1E26] border border-[#2A2F39] rounded-lg px-3 py-2 text-sm text-[#FAFAF8] focus:outline-none">
                        {[2,3,4,5,6].map(n => <option key={n} value={n}>{n}x/week</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-[#8A9099] mb-1">Phase Category</label>
                      <select value={block.phase_category} onChange={e => updateBlock(i, { phase_category: e.target.value })} className="w-full bg-[#1A1E26] border border-[#2A2F39] rounded-lg px-3 py-2 text-sm text-[#FAFAF8] focus:outline-none">
                        <option value="">None</option>
                        {PHASE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-[#8A9099] mb-1">Phase Objective</label>
                    <select value={block.phase_objective} onChange={e => updateBlock(i, { phase_objective: e.target.value })} className="w-full bg-[#1A1E26] border border-[#2A2F39] rounded-lg px-3 py-2 text-sm text-[#FAFAF8] focus:outline-none">
                      <option value="">None</option>
                      {PHASE_OBJECTIVES.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={addBlock}
          className="w-full mt-3 py-3 border-2 border-dashed border-[#2A2F39] text-[#676D76] rounded-xl text-sm hover:border-[#2A2F39] hover:text-[#8A9099] transition-colors"
        >
          + Add Block
        </button>
      </div>

      {error && (
        <div className="bg-[#1A1214] border border-[#4A2222] rounded-lg px-4 py-3">
          <p className="text-[#D4817E] text-sm">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <a
          href={`/dashboard/clients/${clientId}/plan`}
          className="text-[12.5px] text-[#676D76] hover:text-[#8A9099] transition-colors"
        >
          Back to plan
        </a>
        <button
          onClick={handleApprove}
          disabled={saving}
          className="px-5 py-2.5 bg-[#FAFAF8] hover:bg-[#FFFFFF] disabled:bg-[#2A2F39] disabled:text-[#8A9099] text-[#0B0D10] font-semibold text-sm rounded-lg transition-colors"
        >
          {saving ? 'Saving arc...' : 'Save as Draft'}
        </button>
      </div>
      </div>
    </div>
  )
}
