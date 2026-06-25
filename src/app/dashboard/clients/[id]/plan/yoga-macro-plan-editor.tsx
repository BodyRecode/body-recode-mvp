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
const statusStyle: Record<string, string> = {
  planned: 'bg-stone-200 text-stone-600 border-stone-300',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  complete: 'bg-green-50 text-green-700 border-green-200',
}

export default function YogaMacroPlanEditor({
  clientId, planId, initialBlocks,
}: { clientId: string; planId: string; initialBlocks: Block[] }) {
  const [blocks, setBlocks] = useState<Block[]>(
    initialBlocks.slice().sort((a, b) => a.position - b.position),
  )
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [newBlock, setNewBlock] = useState({ block_name: '', phase_category: 'gentle', week_duration: 4, phase_objective: '' })

  function patchLocal(id: string, updates: Partial<Block>) {
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, ...updates } : b)))
  }

  async function saveBlock(b: Block) {
    setBusy(b.id); setError(null)
    try {
      const res = await fetch(`/api/plan/${planId}/blocks/${b.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          block_name: b.block_name, phase_category: b.phase_category,
          phase_objective: b.phase_objective, week_duration: b.week_duration,
        }),
      })
      if (!res.ok) setError((await res.json()).error || 'Save failed')
    } catch { setError('Save failed') } finally { setBusy(null) }
  }

  async function markComplete(b: Block) {
    setBusy(b.id)
    try {
      const res = await fetch(`/api/plan/${planId}/blocks/${b.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'complete' }),
      })
      if (res.ok) patchLocal(b.id, { status: 'complete' })
    } finally { setBusy(null) }
  }

  async function deleteBlock(b: Block) {
    if (!confirm('Remove this block from the arc?')) return
    setBusy(b.id)
    try {
      const res = await fetch(`/api/plan/${planId}/blocks/${b.id}`, { method: 'DELETE' })
      if (res.ok) setBlocks((bs) => bs.filter((x) => x.id !== b.id).map((x, i) => ({ ...x, position: i + 1 })))
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
      setAdding(false)
    } catch { setError('Add failed') } finally { setBusy(null) }
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {blocks.map((b, i) => (
        <div key={b.id}>
          {i > 0 && <div className="flex justify-center py-1"><div className="w-px h-4 bg-stone-300" /></div>}
          <div className="bg-stone-100 border border-stone-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold text-stone-400 w-5 shrink-0">{b.position}</span>
              <input value={b.block_name} onChange={(e) => patchLocal(b.id, { block_name: e.target.value })}
                className={`${inp} flex-1 font-semibold`} />
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize shrink-0 ${statusStyle[b.status] ?? statusStyle.planned}`}>
                {b.status.replace('_', ' ')}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 pl-7">
              <select value={b.phase_category ?? 'gentle'} onChange={(e) => patchLocal(b.id, { phase_category: e.target.value })}
                className={`${inp} capitalize ${intensityColour[b.phase_category ?? '']}`}>
                {INTENSITIES.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
              <select value={b.week_duration} onChange={(e) => patchLocal(b.id, { week_duration: Number(e.target.value) })} className={inp}>
                {WEEKS.map((w) => <option key={w} value={w}>{w} weeks</option>)}
              </select>
              <input value={b.phase_objective ?? ''} onChange={(e) => patchLocal(b.id, { phase_objective: e.target.value })}
                placeholder="focus" className={`${inp} flex-1 min-w-[120px]`} />
            </div>
            <div className="flex items-center justify-between gap-2 pl-7 mt-3">
              <div className="flex items-center gap-2">
                <button onClick={() => saveBlock(b)} disabled={busy === b.id}
                  className="text-xs font-semibold px-3 py-1.5 rounded-md border border-stone-300 text-stone-700 hover:border-stone-500 disabled:opacity-40">
                  {busy === b.id ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => deleteBlock(b)} disabled={busy === b.id}
                  className="text-xs font-medium px-3 py-1.5 rounded-md text-stone-500 hover:text-red-600">Delete</button>
                {b.status !== 'complete' && b.status !== 'planned' && (
                  <button onClick={() => markComplete(b)} className="text-xs font-medium px-3 py-1.5 rounded-md text-stone-500 hover:text-green-700">Mark complete</button>
                )}
              </div>
              <YogaGenerateBlockButton
                clientId={clientId} planBlockId={b.id} blockName={b.block_name}
                ceiling={b.phase_category ?? 'gentle'} weekDuration={b.week_duration}
                done={b.status === 'in_progress' || b.status === 'complete'}
              />
            </div>
          </div>
        </div>
      ))}

      {/* Add block */}
      <div className="flex justify-center py-1"><div className="w-px h-4 bg-stone-300" /></div>
      {adding ? (
        <div className="bg-stone-100 border border-stone-200 rounded-xl p-4 space-y-3">
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
          <div className="flex items-center gap-2">
            <button onClick={addBlock} disabled={busy === 'add'}
              className="text-xs font-semibold px-4 py-1.5 rounded-md bg-[#1B6DFC] text-white hover:bg-[#5390FF] disabled:opacity-40">
              {busy === 'add' ? 'Adding…' : 'Add block'}
            </button>
            <button onClick={() => setAdding(false)} className="text-xs text-stone-500 hover:text-stone-800">cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="w-full py-3 rounded-xl border border-dashed border-stone-300 text-sm text-stone-500 hover:border-stone-400 hover:text-stone-700 transition-colors">
          + Add a block
        </button>
      )}
    </div>
  )
}
