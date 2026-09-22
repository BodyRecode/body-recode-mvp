'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { RevisionPreview } from '@/lib/nutrition-revise-preview'
import type { NutritionEditOp } from '@/lib/nutrition-patch'

/**
 * Change one thing in her live plan (Kade's rule, 1 Sep 2026). Describe the
 * change, see exactly what would move, then create a revised draft. The live
 * plan stays live until the draft is approved.
 */
export default function ReviseOneChange({ clientId, hasDraft }: { clientId: string; hasDraft: boolean }) {
  const router = useRouter()
  const [instruction, setInstruction] = useState('')
  const [busy, setBusy] = useState<'propose' | 'apply' | null>(null)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState('')
  const [ops, setOps] = useState<NutritionEditOp[]>([])
  const [preview, setPreview] = useState<RevisionPreview | null>(null)
  const [accept, setAccept] = useState(false)

  async function propose() {
    setBusy('propose'); setError(''); setPreview(null); setOps([]); setSummary(''); setAccept(false)
    try {
      const res = await fetch(`/api/clients/${clientId}/nutrition/revise`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'propose', instruction }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error || 'Could not work out the change.'); return }
      setSummary(data.summary ?? ''); setOps(data.operations ?? []); setPreview(data.preview ?? null)
    } finally { setBusy(null) }
  }

  async function apply() {
    setBusy('apply'); setError('')
    try {
      const res = await fetch(`/api/clients/${clientId}/nutrition/revise`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'apply', operations: ops, changeNote: instruction, acceptIssues: accept }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error || 'Could not create the revised draft.'); return }
      setInstruction(''); setPreview(null); setOps([]); setSummary('')
      router.refresh()
    } finally { setBusy(null) }
  }

  const delta = (a: number, b: number, unit: string) => `${a}${unit} → ${b}${unit}${b !== a ? ` (${b - a > 0 ? '+' : ''}${b - a})` : ''}`

  return (
    <div className="br-card p-5 mb-4">
      <p className="text-[13.5px] font-semibold text-[#FAFAF8] mb-1">Change one thing</p>
      <p className="text-[12.5px] text-[#8A9099] leading-relaxed mb-3">
        Adjust her live plan without rewriting it: same foods, same meals, only the change you name. For a new block or a new direction, use Regenerate instead.
      </p>
      {hasDraft ? (
        <p className="text-[12.5px] text-[#E0A254]">There is a draft plan waiting. Approve or discard it before making another change.</p>
      ) : (
        <>
          <textarea
            value={instruction}
            onChange={e => setInstruction(e.target.value)}
            rows={2}
            placeholder="e.g. Carbs up 60g, spread over lunch and dinner"
            className="w-full bg-[#14171D] rounded-xl px-3 py-2.5 text-[13.5px] text-[#FAFAF8] border border-[#1A1E26] focus:outline-none focus:ring-2 focus:ring-[#FAFAF8]/30 resize-none"
          />
          <div className="flex items-center gap-3 mt-2">
            <button onClick={propose} disabled={!instruction.trim() || !!busy} className="br-btn disabled:opacity-50">
              {busy === 'propose' ? 'Working it out…' : 'Show me the change'}
            </button>
            {error && <p className="text-[12.5px] text-[#D4817E]">{error}</p>}
          </div>

          {summary && !preview && <p className="mt-3 text-[13.5px] text-[#C2C6CC] leading-relaxed">{summary}</p>}

          {preview && (
            <div className="mt-4 rounded-xl border border-[#2A2F39] p-4">
              {summary && <p className="text-[13.5px] text-[#C2C6CC] leading-relaxed mb-3">{summary}</p>}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 text-[12.5px] text-[#C2C6CC]">
                <div><p className="text-[11px] text-[#676D76]">Calories</p>{delta(preview.before.kcal, preview.after.kcal, '')}</div>
                <div><p className="text-[11px] text-[#676D76]">Protein</p>{delta(preview.before.protein, preview.after.protein, 'g')}</div>
                <div><p className="text-[11px] text-[#676D76]">Carbs</p>{delta(preview.before.carbs, preview.after.carbs, 'g')}</div>
                <div><p className="text-[11px] text-[#676D76]">Fat</p>{delta(preview.before.fat, preview.after.fat, 'g')}</div>
              </div>
              <p className="text-[11px] text-[#676D76] mb-1">What changes</p>
              <ul className="text-[13.5px] text-[#C2C6CC] space-y-0.5 mb-3">{preview.changes.map((c, i) => <li key={i}>· {c}</li>)}</ul>
              {preview.warnings.map((w, i) => <p key={i} className="text-[12.5px] text-[#E0A254] mb-1">Check: {w}</p>)}
              {preview.newIssues.length > 0 && (
                <div className="mt-2">
                  {preview.newIssues.map((w, i) => <p key={i} className="text-[12.5px] text-[#D4817E] mb-1">Would break: {w}</p>)}
                  <label className="flex items-center gap-2 text-[12.5px] text-[#C2C6CC] mt-1">
                    <input type="checkbox" checked={accept} onChange={e => setAccept(e.target.checked)} /> I have checked this and still want the draft
                  </label>
                </div>
              )}
              <p className="text-[12.5px] text-[#676D76] mt-3">Everything else in the plan stays exactly as it is. This creates a draft; her live plan does not change until you approve it.</p>
              <button onClick={apply} disabled={!!busy || !preview.changes.length || (preview.newIssues.length > 0 && !accept)} className="br-btn mt-2 disabled:opacity-50">
                {busy === 'apply' ? 'Creating draft…' : 'Create revised draft'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
