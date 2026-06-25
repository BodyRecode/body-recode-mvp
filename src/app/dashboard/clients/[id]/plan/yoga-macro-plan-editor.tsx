'use client'

import { useState } from 'react'
import { YogaGenerateBlockButton } from './yoga-plan-actions'

interface Block {
  id: string
  block_name: string
  phase_category: string | null   // intensity
  phase_objective: string | null  // focus
  week_duration: number
  position: number
  status: string
}

const INTENSITIES = ['restorative', 'gentle', 'moderate', 'strong']
const WEEKS = [4, 6, 8]
const inp = 'bg-stone-200 border border-stone-300 text-stone-900 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B6DFC] focus:border-transparent'

const intensityColour: Record<string, string> = {
  restorative: 'text-green-600 bg-green-50 border-green-200',
  gentle: 'text-blue-400 bg-blue-50 border-blue-200',
  moderate: 'text-blue-600 bg-blue-50 border-blue-200',
  strong: 'text-violet-700 bg-violet-50 border-violet-200',
}
const statusColour: Record<string, string> = {
  planned: 'text-stone-600 bg-stone-200 border-stone-300',
  in_progress: 'text-amber-700 bg-amber-50 border-amber-200',
  complete: 'text-green-700 bg-green-50 border-green-200',
}

function BlockEditForm({ block, onSave, onCancel, saving }: {
  block: Block; onSave: (u: Partial<Block>) => void; onCancel: () => void; saving: boolean
}) {
  const [f, setF] = useState({
    block_name: block.block_name, phase_category: block.phase_category ?? 'gentle',
    week_duration: block.week_duration, phase_objective: block.phase_objective ?? '',
  })
  return (
    <div className="bg-stone-100 border border-stone-300 rounded-xl p-4 space-y-3">
      <input value={f.block_name} onChange={(e) => setF({ ...f, block_name: e.target.value })}
        placeholder="Block name" className={`${inp} w-full font-semibold`} />
      <div className="flex flex-wrap items-center gap-2">
        <select value={f.phase_category} onChange={(e) => setF({ ...f, phase_category: e.target.value })} className={`${inp} capitalize`}>
          {INTENSITIES.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        <select value={f.week_duration} onChange={(e) => setF({ ...f, week_duration: Number(e.target.value) })} className={inp}>
          {WEEKS.map((w) => <option key={w} value={w}>{w} weeks</option>)}
        </select>
        <input value={f.phase_objective} onChange={(e) => setF({ ...f, phase_objective: e.target.value })}
          placeholder="focus" className={`${inp} flex-1 min-w-[120px]`} />
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSave(f)} disabled={saving} className="flex-1 py-2 bg-[#1B6DFC] text-white font-semibold rounded-md text-sm disabled:opacity-40">{saving ? 'Saving…' : 'Save'}</button>
        <button onClick={onCancel} className="px-4 py-2 border border-stone-300 text-stone-600 rounded-md text-sm hover:border-stone-500">Cancel</button>
      </div>
    </div>
  )
}

export default function YogaMacroPlanEditor({
  clientId, planId, initialBlocks,
}: { clientId: string; planId: string; initialBlocks: Block[] }) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks.slice().sort((a, b) => a.position - b.position))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newBlock, setNewBlock] = useState({ block_name: '', phase_category: 'gentle', week_duration: 4, phase_objective: '' })

  async function saveBlock(id: string, updates: Partial<Block>) {
    setBusy(id); setError(null)
    try {
      const res = await fetch(`/api/plan/${planId}/blocks/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) { setError((await res.json()).error || 'Save failed'); return }
      setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, ...updates } : b)))
      setEditingId(null)
    } catch { setError('Save failed') } finally { setBusy(null) }
  }

  async function deleteBlock(id: string) {
    if (!confirm('Remove this block from the arc?')) return
    setBusy(id)
    try {
      const res = await fetch(`/api/plan/${planId}/blocks/${id}`, { method: 'DELETE' })
      if (res.ok) setBlocks((bs) => bs.filter((x) => x.id !== id).map((x, i) => ({ ...x, position: i + 1 })))
    } finally { setBusy(null) }
  }

  async function addBlock() {
    if (!newBlock.block_name) { setError('Block name required'); return }
    setBusy('add'); setError(null)
    try {
      const res = await fetch(`/api/plan/${planId}/blocks`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId, block_name: newBlock.block_name,
          progression_phase: 'restoration', training_goal: 'capacity',
          phase_category: newBlock.phase_category, phase_objective: newBlock.phase_objective,
          week_duration: newBlock.week_duration,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Add failed'); return }
      setBlocks((bs) => [...bs, data.block as Block])
      setNewBlock({ block_name: '', phase_category: 'gentle', week_duration: 4, phase_objective: '' })
      setShowAdd(false)
    } catch { setError('Add failed') } finally { setBusy(null) }
  }

  return (
    <div>
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

      <div className="space-y-2 mb-4">
        {blocks.map((b, i) => (
          <div key={b.id}>
            {i > 0 && (
              <div className="flex items-center gap-2 px-6 py-1">
                <div className="w-px h-4 bg-stone-300 mx-auto" />
              </div>
            )}
            {editingId === b.id ? (
              <BlockEditForm block={b} saving={busy === b.id}
                onSave={(u) => saveBlock(b.id, u)} onCancel={() => setEditingId(null)} />
            ) : (
              <div className="bg-stone-100 border border-stone-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-400 w-5">{b.position}</span>
                    <p className="text-sm font-semibold text-stone-900">{b.block_name}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${statusColour[b.status] ?? statusColour.planned}`}>
                      {b.status.replace('_', ' ')}
                    </span>
                    {b.phase_category && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${intensityColour[b.phase_category] || ''}`}>
                        {b.phase_category}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-stone-500 mb-2 pl-7">
                  <span>{b.week_duration} weeks</span>
                  {b.phase_objective && <span>{b.phase_objective}</span>}
                </div>
                <div className="flex items-center gap-3 pl-7 mt-2">
                  {b.status !== 'complete' && (
                    <YogaGenerateBlockButton
                      clientId={clientId} planBlockId={b.id} blockName={b.block_name}
                      ceiling={b.phase_category ?? 'gentle'} weekDuration={b.week_duration}
                      done={b.status === 'in_progress'}
                    />
                  )}
                  <button onClick={() => setEditingId(b.id)} className="text-xs text-stone-400 hover:text-stone-600 transition-colors">Edit</button>
                  <button onClick={() => deleteBlock(b.id)} className="text-xs text-stone-400 hover:text-red-700 transition-colors">Remove</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add block */}
      {showAdd ? (
        <div className="bg-stone-100 border border-stone-300 rounded-xl p-4 space-y-3 mb-4">
          <input value={newBlock.block_name} onChange={(e) => setNewBlock({ ...newBlock, block_name: e.target.value })}
            placeholder="Block name" className={`${inp} w-full font-semibold`} />
          <div className="flex flex-wrap items-center gap-2">
            <select value={newBlock.phase_category} onChange={(e) => setNewBlock({ ...newBlock, phase_category: e.target.value })} className={`${inp} capitalize`}>
              {INTENSITIES.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
            <select value={newBlock.week_duration} onChange={(e) => setNewBlock({ ...newBlock, week_duration: Number(e.target.value) })} className={inp}>
              {WEEKS.map((w) => <option key={w} value={w}>{w} weeks</option>)}
            </select>
            <input value={newBlock.phase_objective} onChange={(e) => setNewBlock({ ...newBlock, phase_objective: e.target.value })}
              placeholder="focus" className={`${inp} flex-1 min-w-[120px]`} />
          </div>
          <div className="flex gap-2">
            <button onClick={addBlock} disabled={busy === 'add'} className="flex-1 py-2 bg-[#1B6DFC] text-white font-semibold rounded-md text-sm disabled:opacity-40">{busy === 'add' ? 'Adding…' : 'Add Block'}</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 border border-stone-300 text-stone-600 rounded-md text-sm hover:border-stone-500">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)}
          className="w-full py-3 border-2 border-dashed border-stone-300 text-stone-500 rounded-xl text-sm hover:border-stone-500 hover:text-stone-700 transition-colors">
          + Add Block
        </button>
      )}
    </div>
  )
}
