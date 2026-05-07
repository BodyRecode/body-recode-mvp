'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface PlanBlock {
  id: string
  plan_id: string
  client_id: string
  position: number
  block_name: string
  progression_phase: string
  phase_category: string | null
  execution_arc: string | null
  phase_objective: string | null
  training_goal: string
  week_duration: number
  training_frequency: number | null
  status: 'planned' | 'in_progress' | 'complete' | 'skipped'
  program_id: string | null
  notes: string | null
}

interface Plan {
  id: string
  plan_name: string
  macro_objective: string | null
  notes: string | null
  plan_blocks: PlanBlock[]
}

const phaseColour: Record<string, string> = {
  accumulation: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  intensification: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  realization: 'text-red-400 bg-red-400/10 border-red-400/30',
  restoration: 'text-green-400 bg-green-400/10 border-green-400/30',
}

const goalColour: Record<string, string> = {
  strength: 'text-violet-400 bg-violet-400/10 border-violet-400/30',
  hypertrophy: 'text-pink-400 bg-pink-400/10 border-pink-400/30',
  capacity: 'text-teal-400 bg-teal-400/10 border-teal-400/30',
}

const statusColour: Record<string, string> = {
  planned: 'text-stone-400 bg-stone-800 border-stone-700',
  in_progress: 'text-amber-400 bg-amber-400/10 border-amber-700',
  complete: 'text-green-400 bg-green-400/10 border-green-700',
  skipped: 'text-stone-600 bg-stone-900 border-stone-800',
}

const BLOCK_NAME_OPTIONS = [
  'Foundation Strength Block', 'General Strength Accumulation', 'Hypertrophy Accumulation Block',
  'Muscle Building Foundation', 'Work Capacity Accumulation', 'General Physical Preparation (GPP)',
  'Strength Intensification Block', 'Hypertrophy Intensification Block', 'Capacity Intensification Block',
  'Loading Phase Block', 'Progressive Overload Block', 'Strength Realization Block',
  'Peak Performance Block', 'Expression Phase Block', 'Deload / Restoration Block',
  'Active Recovery Block', 'Consolidation Block',
]

const PHASE_CATEGORIES = [
  'Accumulation-Oriented', 'Intensification-Oriented', 'Consolidation-Oriented',
  'Recovery-Dominant', 'Exposure-Management',
]

const PHASE_OBJECTIVES = [
  'Capacity Restoration', 'Capacity Building', 'Performance Expression', 'Consolidation and Stability',
]

const inputCls = 'w-full bg-stone-800 border border-stone-700 text-stone-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#10E1C2] focus:border-transparent'
const labelCls = 'block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1.5'

const emptyBlock = {
  block_name: '',
  progression_phase: 'accumulation',
  phase_category: '',
  execution_arc: 'mid',
  phase_objective: '',
  training_goal: 'strength',
  week_duration: 4,
  training_frequency: 3,
  notes: '',
}

export default function MacroPlanEditor({
  clientId,
  clientName,
  initialPlan,
}: {
  clientId: string
  clientName: string
  initialPlan: Plan | null
}) {
  const router = useRouter()
  const [plan, setPlan] = useState<Plan | null>(initialPlan)
  const [showCreatePlan, setShowCreatePlan] = useState(!initialPlan)
  const [showAddBlock, setShowAddBlock] = useState(false)
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [planForm, setPlanForm] = useState({
    plan_name: initialPlan?.plan_name ?? '',
    macro_objective: initialPlan?.macro_objective ?? '',
  })

  const [blockForm, setBlockForm] = useState({ ...emptyBlock })

  async function handleCreatePlan() {
    if (!planForm.plan_name) { setError('Plan name required'); return }
    setSaving(true); setError(null)
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, plan_name: planForm.plan_name, macro_objective: planForm.macro_objective }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setPlan({ ...data.plan, plan_blocks: [] })
      setShowCreatePlan(false)
    } finally { setSaving(false) }
  }

  async function handleAddBlock() {
    if (!blockForm.block_name || !plan) { setError('Block name required'); return }
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/plan/${plan.id}/blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          block_name: blockForm.block_name,
          progression_phase: blockForm.progression_phase,
          phase_category: blockForm.phase_category || null,
          execution_arc: blockForm.execution_arc || null,
          phase_objective: blockForm.phase_objective || null,
          training_goal: blockForm.training_goal,
          week_duration: blockForm.week_duration,
          training_frequency: blockForm.training_frequency,
          notes: blockForm.notes || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setPlan(prev => prev ? { ...prev, plan_blocks: [...prev.plan_blocks, data.block as PlanBlock] } : prev)
      setBlockForm({ ...emptyBlock })
      setShowAddBlock(false)
    } finally { setSaving(false) }
  }

  async function handleUpdateBlock(blockId: string, updates: Partial<typeof emptyBlock & { status: string }>) {
    if (!plan) return
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/plan/${plan.id}/blocks/${blockId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setPlan(prev => prev ? {
        ...prev,
        plan_blocks: prev.plan_blocks.map(b => b.id === blockId ? { ...b, ...updates } as PlanBlock : b),
      } : prev)
      setEditingBlockId(null)
    } finally { setSaving(false) }
  }

  async function handleDeleteBlock(blockId: string) {
    if (!plan || !confirm('Remove this block from the plan?')) return
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/plan/${plan.id}/blocks/${blockId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setPlan(prev => prev ? {
        ...prev,
        plan_blocks: prev.plan_blocks.filter(b => b.id !== blockId).map((b, i) => ({ ...b, position: i + 1 })),
      } : prev)
    } finally { setSaving(false) }
  }

  const totalWeeks = plan?.plan_blocks.filter(b => b.status !== 'skipped').reduce((sum, b) => sum + b.week_duration, 0) ?? 0

  return (
    <div>
      {error && (
        <p className="text-sm text-red-400 bg-red-950/50 border border-red-800 rounded-md px-3 py-2 mb-4">{error}</p>
      )}

      {/* No plan yet - create one */}
      {!plan ? (
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-stone-300 mb-4">Create Macro Plan</h2>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Plan Name</label>
              <input
                type="text"
                value={planForm.plan_name}
                onChange={e => setPlanForm(p => ({ ...p, plan_name: e.target.value }))}
                placeholder="e.g. 2025 Strength Foundation"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Macro Objective</label>
              <input
                type="text"
                value={planForm.macro_objective}
                onChange={e => setPlanForm(p => ({ ...p, macro_objective: e.target.value }))}
                placeholder="e.g. Build capacity foundation → strength expression over 6 months"
                className={inputCls}
              />
            </div>
            <button
              onClick={handleCreatePlan}
              disabled={saving}
              className="w-full py-2.5 bg-[#10E1C2] text-stone-900 font-semibold rounded-md hover:bg-[#0dcfb2] disabled:opacity-40 transition-colors"
            >
              {saving ? 'Creating…' : 'Create Plan'}
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* Plan header */}
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">{plan.plan_name}</h2>
                {plan.macro_objective && (
                  <p className="text-sm text-stone-400 mt-1">{plan.macro_objective}</p>
                )}
                <p className="text-xs text-stone-600 mt-2">{plan.plan_blocks.length} blocks · {totalWeeks} weeks total</p>
              </div>
              <button
                onClick={() => setShowCreatePlan(true)}
                className="text-xs text-stone-600 hover:text-stone-400 transition-colors"
              >
                Replace plan
              </button>
            </div>
          </div>

          {/* Replace plan form */}
          {showCreatePlan && (
            <div className="bg-stone-900 border border-stone-700 rounded-xl p-5 mb-4">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Replace Plan</p>
              <div className="space-y-3">
                <input type="text" value={planForm.plan_name} onChange={e => setPlanForm(p => ({ ...p, plan_name: e.target.value }))} placeholder="Plan name" className={inputCls} />
                <input type="text" value={planForm.macro_objective} onChange={e => setPlanForm(p => ({ ...p, macro_objective: e.target.value }))} placeholder="Macro objective" className={inputCls} />
                <div className="flex gap-2">
                  <button onClick={handleCreatePlan} disabled={saving} className="flex-1 py-2 bg-[#10E1C2] text-stone-900 font-semibold rounded-md text-sm disabled:opacity-40">{saving ? 'Saving…' : 'Save'}</button>
                  <button onClick={() => setShowCreatePlan(false)} className="px-4 py-2 border border-stone-700 text-stone-400 rounded-md text-sm hover:border-stone-500">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Block timeline */}
          {plan.plan_blocks.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-stone-800 rounded-xl mb-4">
              <p className="text-stone-500 text-sm mb-1">No blocks planned yet</p>
              <p className="text-stone-600 text-xs">Add the first meso block to begin building the arc</p>
            </div>
          ) : (
            <div className="space-y-2 mb-4">
              {plan.plan_blocks.map((block, i) => (
                <div key={block.id}>
                  {/* Connector line between blocks */}
                  {i > 0 && (
                    <div className="flex items-center gap-2 px-6 py-1">
                      <div className="w-px h-4 bg-stone-700 mx-auto" />
                    </div>
                  )}

                  {editingBlockId === block.id ? (
                    <BlockEditForm
                      block={block}
                      onSave={updates => handleUpdateBlock(block.id, updates)}
                      onCancel={() => setEditingBlockId(null)}
                      saving={saving}
                    />
                  ) : (
                    <div className={`bg-stone-900 border rounded-xl p-4 transition-colors ${block.status === 'skipped' ? 'opacity-40 border-stone-800' : 'border-stone-800'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-600 w-5">{block.position}</span>
                          <p className="text-sm font-semibold text-stone-100">{block.block_name}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${statusColour[block.status]}`}>
                            {block.status.replace('_', ' ')}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${phaseColour[block.progression_phase] || ''}`}>
                            {block.progression_phase}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${goalColour[block.training_goal] || ''}`}>
                            {block.training_goal}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-stone-500 mb-2 pl-7">
                        <span>{block.week_duration} weeks</span>
                        {block.training_frequency && <span>{block.training_frequency}x/week</span>}
                        {block.execution_arc && <span className="capitalize">{block.execution_arc} arc</span>}
                        {block.phase_category && <span>{block.phase_category}</span>}
                        {block.phase_objective && <span>{block.phase_objective}</span>}
                      </div>

                      {block.notes && (
                        <p className="text-xs text-stone-600 italic pl-7 mb-2">{block.notes}</p>
                      )}

                      <div className="flex items-center gap-3 pl-7 mt-2">
                        {block.program_id ? (
                          <Link
                            href={`/dashboard/clients/${clientId}/program`}
                            className="text-xs text-[#10E1C2] hover:underline"
                          >
                            View program →
                          </Link>
                        ) : block.status !== 'complete' && block.status !== 'skipped' ? (
                          <Link
                            href={`/dashboard/clients/${clientId}/program/suggest?plan_block_id=${block.id}`}
                            className="text-xs text-[#10E1C2] hover:underline"
                          >
                            Generate program →
                          </Link>
                        ) : null}
                        <button
                          onClick={() => setEditingBlockId(block.id)}
                          className="text-xs text-stone-600 hover:text-stone-400 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteBlock(block.id)}
                          className="text-xs text-stone-600 hover:text-red-400 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add block */}
          {showAddBlock ? (
            <BlockAddForm
              blockForm={blockForm}
              setBlockForm={setBlockForm}
              onAdd={handleAddBlock}
              onCancel={() => setShowAddBlock(false)}
              saving={saving}
            />
          ) : (
            <button
              onClick={() => setShowAddBlock(true)}
              className="w-full py-3 border-2 border-dashed border-stone-700 text-stone-500 rounded-xl text-sm hover:border-stone-500 hover:text-stone-300 transition-colors"
            >
              + Add Block
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function BlockAddForm({
  blockForm,
  setBlockForm,
  onAdd,
  onCancel,
  saving,
}: {
  blockForm: typeof emptyBlock
  setBlockForm: React.Dispatch<React.SetStateAction<typeof emptyBlock>>
  onAdd: () => void
  onCancel: () => void
  saving: boolean
}) {
  return (
    <div className="bg-stone-900 border border-stone-700 rounded-xl p-5">
      <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4">Add Meso Block</p>
      <BlockFormFields form={blockForm} setForm={setBlockForm} />
      <div className="flex gap-2 mt-4">
        <button onClick={onAdd} disabled={saving} className="flex-1 py-2.5 bg-[#10E1C2] text-stone-900 font-semibold rounded-md text-sm disabled:opacity-40">
          {saving ? 'Adding…' : 'Add Block'}
        </button>
        <button onClick={onCancel} className="px-4 py-2 border border-stone-700 text-stone-400 rounded-md text-sm hover:border-stone-500">
          Cancel
        </button>
      </div>
    </div>
  )
}

function BlockEditForm({
  block,
  onSave,
  onCancel,
  saving,
}: {
  block: PlanBlock
  onSave: (updates: Partial<typeof emptyBlock & { status: string }>) => void
  onCancel: () => void
  saving: boolean
}) {
  const [form, setForm] = useState<typeof emptyBlock & { status: 'planned' | 'in_progress' | 'complete' | 'skipped' }>({
    block_name: block.block_name,
    progression_phase: block.progression_phase,
    phase_category: block.phase_category ?? '',
    execution_arc: block.execution_arc ?? 'mid',
    phase_objective: block.phase_objective ?? '',
    training_goal: block.training_goal,
    week_duration: block.week_duration,
    training_frequency: block.training_frequency ?? 3,
    notes: block.notes ?? '',
    status: block.status,
  })

  return (
    <div className="bg-stone-900 border border-stone-600 rounded-xl p-5">
      <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4">Edit Block</p>
      <BlockFormFields form={form} setForm={setForm as React.Dispatch<React.SetStateAction<typeof emptyBlock>>} />
      <div className="mt-3">
        <label className={labelCls}>Status</label>
        <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as 'planned' | 'in_progress' | 'complete' | 'skipped' }))} className={inputCls}>
          <option value="planned">Planned</option>
          <option value="in_progress">In Progress</option>
          <option value="complete">Complete</option>
          <option value="skipped">Skipped</option>
        </select>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={() => onSave(form)} disabled={saving} className="flex-1 py-2.5 bg-[#10E1C2] text-stone-900 font-semibold rounded-md text-sm disabled:opacity-40">
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button onClick={onCancel} className="px-4 py-2 border border-stone-700 text-stone-400 rounded-md text-sm hover:border-stone-500">
          Cancel
        </button>
      </div>
    </div>
  )
}

function BlockFormFields({
  form,
  setForm,
}: {
  form: typeof emptyBlock
  setForm: React.Dispatch<React.SetStateAction<typeof emptyBlock>>
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>Block Name</label>
        <select value={form.block_name} onChange={e => setForm(p => ({ ...p, block_name: e.target.value }))} className={inputCls}>
          <option value="" disabled>Select a block name…</option>
          {BLOCK_NAME_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Progression Phase</label>
          <select value={form.progression_phase} onChange={e => setForm(p => ({ ...p, progression_phase: e.target.value }))} className={inputCls}>
            <option value="accumulation">Accumulation</option>
            <option value="intensification">Intensification</option>
            <option value="realization">Realization</option>
            <option value="restoration">Restoration</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Training Goal</label>
          <select value={form.training_goal} onChange={e => setForm(p => ({ ...p, training_goal: e.target.value }))} className={inputCls}>
            <option value="strength">Strength</option>
            <option value="hypertrophy">Hypertrophy</option>
            <option value="capacity">Capacity</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Week Duration</label>
          <select value={form.week_duration} onChange={e => setForm(p => ({ ...p, week_duration: parseInt(e.target.value) }))} className={inputCls}>
            <option value={2}>2 weeks</option>
            <option value={3}>3 weeks</option>
            <option value={4}>4 weeks</option>
            <option value={5}>5 weeks</option>
            <option value={6}>6 weeks</option>
            <option value={7}>7 weeks</option>
            <option value={8}>8 weeks</option>
            <option value={10}>10 weeks</option>
            <option value={12}>12 weeks</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Sessions / Week</label>
          <select value={form.training_frequency} onChange={e => setForm(p => ({ ...p, training_frequency: parseInt(e.target.value) }))} className={inputCls}>
            <option value={2}>2x</option>
            <option value={3}>3x</option>
            <option value={4}>4x</option>
            <option value={5}>5x</option>
            <option value={6}>6x</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Execution Arc</label>
          <select value={form.execution_arc} onChange={e => setForm(p => ({ ...p, execution_arc: e.target.value }))} className={inputCls}>
            <option value="short">Short Arc - rapid build</option>
            <option value="mid">Mid Arc - moderate window</option>
            <option value="long">Long Arc - sustained exposure</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Phase Category (Layer A)</label>
          <select value={form.phase_category} onChange={e => setForm(p => ({ ...p, phase_category: e.target.value }))} className={inputCls}>
            <option value="">- Select -</option>
            {PHASE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Phase Objective (Layer D)</label>
          <select value={form.phase_objective} onChange={e => setForm(p => ({ ...p, phase_objective: e.target.value }))} className={inputCls}>
            <option value="">- Select -</option>
            {PHASE_OBJECTIVES.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Notes (optional)</label>
        <input type="text" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Any coaching notes for this block" className={inputCls} />
      </div>
    </div>
  )
}
