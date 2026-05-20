'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import StickyScrollNav from '@/components/sticky-scroll-nav'

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
  accumulation: 'text-blue-700 bg-blue-50 border-blue-200',
  intensification: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  realization: 'text-red-700 bg-red-50 border-red-200',
  restoration: 'text-green-400 bg-green-400/10 border-green-400/30',
}

const goalColour: Record<string, string> = {
  strength: 'text-violet-700 bg-violet-50 border-violet-200',
  hypertrophy: 'text-pink-400 bg-pink-400/10 border-pink-400/30',
  capacity: 'text-blue-500 bg-blue-50 border-blue-200',
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
      <div className="space-y-3">
        <div className="bg-stone-100 border border-stone-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <p className="text-sm text-stone-600">Reading client context and designing macro arc...</p>
          </div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-stone-200 rounded animate-pulse" style={{ width: `${50 + (i % 3) * 20}%` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error && !suggestion) {
    return (
      <div className="bg-red-950/30 border border-red-800 rounded-xl p-5">
        <p className="text-red-700 text-sm">{error}</p>
        <a href={`/dashboard/clients/${clientId}/plan`} className="text-xs text-stone-500 hover:text-stone-700 mt-3 inline-block">
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

      {/* Overall rationale */}
      <div id="rationale" className="scroll-mt-8 bg-blue-950/30 border border-blue-900/40 rounded-xl px-5 py-4">
        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">Arc Rationale</p>
        <p className="text-sm text-stone-700 leading-relaxed">{suggestion.overall_rationale}</p>
      </div>

      {/* Plan name + objective */}
      <div id="plan-details" className="scroll-mt-8 bg-stone-100 border border-stone-200 rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Plan Name</label>
          <input
            value={planName}
            onChange={e => setPlanName(e.target.value)}
            className="w-full bg-stone-200 border border-stone-300 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:border-blue-700"
          />
          <div className="flex items-start gap-2 mt-2">
            <span className="text-blue-500 text-xs mt-0.5 shrink-0">→</span>
            <p className="text-xs text-stone-700 leading-relaxed">{suggestion.plan_name_reason}</p>
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Macro Objective</label>
          <input
            value={macroObjective}
            onChange={e => setMacroObjective(e.target.value)}
            className="w-full bg-stone-200 border border-stone-300 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:border-blue-700"
          />
          <div className="flex items-start gap-2 mt-2">
            <span className="text-blue-500 text-xs mt-0.5 shrink-0">→</span>
            <p className="text-xs text-stone-700 leading-relaxed">{suggestion.macro_objective_reason}</p>
          </div>
        </div>
        <p className="text-[10px] text-stone-600">{blocks.length} blocks · {totalWeeks} weeks total</p>
      </div>

      {/* Meso blocks */}
      <div id="blocks" className="scroll-mt-8">
        <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-3 px-1">Meso Blocks</p>
        <div className="space-y-3">
          {blocks.map((block, i) => (
            <div key={i} className="bg-stone-100 border border-stone-200 rounded-xl overflow-hidden">
              {/* Block header */}
              <div className="px-5 py-3 border-b border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-stone-400">{String(i + 1).padStart(2, '0')}</span>
                  <p className="text-sm font-semibold text-stone-800">{block.block_name}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${phaseColour[block.progression_phase] || 'text-stone-600 bg-stone-200 border-stone-300'}`}>
                    {block.progression_phase}
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${goalColour[block.training_goal] || 'text-stone-600 bg-stone-200 border-stone-300'}`}>
                    {block.training_goal}
                  </span>
                  <span className="text-[10px] text-stone-600">{block.week_duration}w</span>
                  <button
                    onClick={() => setEditingBlock(editingBlock === i ? null : i)}
                    className="text-[10px] text-stone-400 hover:text-stone-600 px-2 py-0.5 transition-colors"
                  >
                    {editingBlock === i ? 'Done' : 'Edit'}
                  </button>
                  <button
                    onClick={() => removeBlock(i)}
                    className="text-[10px] text-stone-300 hover:text-red-700 px-1 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Block summary */}
              {editingBlock !== i && (
                <div className="px-5 py-3 space-y-2">
                  <div className="flex gap-4 text-xs text-stone-600">
                    <span>{block.implied_frequency}x/week</span>
                    <span className="capitalize">{block.execution_arc} arc</span>
                    {block.phase_category && <span>{block.phase_category}</span>}
                    {block.phase_objective && <span>{block.phase_objective}</span>}
                  </div>
                  {block.nutrition_context && (
                    <p className="text-[10px] text-stone-600 leading-relaxed">Nutrition: {block.nutrition_context}</p>
                  )}
                  <div className="flex items-start gap-2 mt-1">
                    <span className="text-blue-500 text-[10px] mt-0.5 shrink-0">→</span>
                    <p className="text-xs text-stone-700 leading-relaxed">{block.block_rationale}</p>
                  </div>
                </div>
              )}

              {/* Block edit form */}
              {editingBlock === i && (
                <div className="px-5 py-4 space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Block Name</label>
                    <input
                      value={block.block_name}
                      onChange={e => updateBlock(i, { block_name: e.target.value })}
                      className="w-full bg-stone-200 border border-stone-300 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:border-blue-700"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Phase</label>
                      <select value={block.progression_phase} onChange={e => updateBlock(i, { progression_phase: e.target.value })} className="w-full bg-stone-200 border border-stone-300 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none">
                        {PHASES.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Goal</label>
                      <select value={block.training_goal} onChange={e => updateBlock(i, { training_goal: e.target.value })} className="w-full bg-stone-200 border border-stone-300 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none">
                        {GOALS.map(g => <option key={g} value={g} className="capitalize">{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Weeks</label>
                      <select value={block.week_duration} onChange={e => updateBlock(i, { week_duration: Number(e.target.value) })} className="w-full bg-stone-200 border border-stone-300 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none">
                        {DURATIONS.map(d => <option key={d} value={d}>{d} weeks</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Arc</label>
                      <select value={block.execution_arc} onChange={e => updateBlock(i, { execution_arc: e.target.value })} className="w-full bg-stone-200 border border-stone-300 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none">
                        {ARCS.map(a => <option key={a} value={a} className="capitalize">{a}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Frequency</label>
                      <select value={block.implied_frequency} onChange={e => updateBlock(i, { implied_frequency: Number(e.target.value) })} className="w-full bg-stone-200 border border-stone-300 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none">
                        {[2,3,4,5,6].map(n => <option key={n} value={n}>{n}x/week</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Phase Category</label>
                      <select value={block.phase_category} onChange={e => updateBlock(i, { phase_category: e.target.value })} className="w-full bg-stone-200 border border-stone-300 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none">
                        <option value="">None</option>
                        {PHASE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Phase Objective</label>
                    <select value={block.phase_objective} onChange={e => updateBlock(i, { phase_objective: e.target.value })} className="w-full bg-stone-200 border border-stone-300 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none">
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
          className="w-full mt-3 py-3 border-2 border-dashed border-stone-200 text-stone-400 rounded-xl text-sm hover:border-stone-300 hover:text-stone-600 transition-colors"
        >
          + Add Block
        </button>
      </div>

      {error && (
        <div className="bg-red-950/30 border border-red-800 rounded-lg px-4 py-3">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <a
          href={`/dashboard/clients/${clientId}/plan`}
          className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
        >
          Back to plan
        </a>
        <button
          onClick={handleApprove}
          disabled={saving}
          className="px-5 py-2.5 bg-blue-500 hover:bg-blue-500 disabled:bg-stone-300 disabled:text-stone-500 text-white font-semibold text-sm rounded-lg transition-colors"
        >
          {saving ? 'Saving arc...' : 'Save as Draft'}
        </button>
      </div>
      </div>
    </div>
  )
}
