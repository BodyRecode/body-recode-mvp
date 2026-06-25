'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Completion {
  id: string
  session_index: number
  week_number_in_block: number
  day_label: string
  completed_at: string | null
  logged_by: string | null
  session_notes: string | null
}

export default function YogaSessionLog({
  programId, weeks, practices, completions,
}: {
  programId: string
  weeks: number
  practices: { index: number; day_label: string }[]
  completions: Completion[]
}) {
  const router = useRouter()
  const [cell, setCell] = useState<{ week: number; index: number } | null>(null)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const byKey = new Map(completions.map((c) => [`${c.week_number_in_block}-${c.session_index}`, c]))
  const totalCells = weeks * practices.length
  const done = completions.length

  async function log(week: number, sessionIndex: number) {
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/yoga-log-practice', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program_id: programId, session_index: sessionIndex, week_number_in_block: week, notes: notes || null }),
      })
      if (!res.ok) { setError((await res.json()).error || 'Failed to log'); return }
      setCell(null); setNotes('')
      router.refresh()
    } catch { setError('Failed to log') } finally { setBusy(false) }
  }

  const weekList = Array.from({ length: weeks }, (_, i) => i + 1)

  return (
    <div className="bg-stone-100 border border-stone-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-stone-200 flex items-center justify-between">
        <p className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">Block Progress</p>
        <span className="text-[10px] text-stone-400">{done} of {totalCells} practices logged</span>
      </div>

      <div className="px-5 py-4">
        <p className="text-xs text-stone-500 mb-3">Log each practice as the client completes it, week by week.</p>
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-1 text-sm">
            <thead>
              <tr>
                <th className="text-left text-[10px] font-bold text-stone-400 uppercase tracking-wide px-2 py-1">Practice</th>
                {weekList.map((w) => (
                  <th key={w} className="text-[10px] font-bold text-stone-400 uppercase tracking-wide px-2 py-1 text-center whitespace-nowrap">Wk {w}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {practices.map((pr) => (
                <tr key={pr.index}>
                  <td className="px-2 py-1 text-sm font-medium text-stone-800 align-middle whitespace-nowrap max-w-[180px] truncate">{pr.day_label}</td>
                  {weekList.map((w) => {
                    const c = byKey.get(`${w}-${pr.index}`)
                    const active = cell?.week === w && cell?.index === pr.index
                    return (
                      <td key={w} className="px-1 py-1 text-center">
                        {c ? (
                          <span title={`${c.logged_by ?? ''}${c.completed_at ? ' · ' + new Date(c.completed_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : ''}${c.session_notes ? ' · ' + c.session_notes : ''}`}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 border border-blue-200 text-[#1B6DFC] font-bold">✓</span>
                        ) : (
                          <button onClick={() => { setCell(active ? null : { week: w, index: pr.index }); setNotes('') }}
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-md border text-stone-400 hover:border-[#1B6DFC] hover:text-[#1B6DFC] transition-colors ${active ? 'border-[#1B6DFC] text-[#1B6DFC]' : 'border-stone-300'}`}>+</button>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {cell && (
          <div className="mt-4 bg-white border border-stone-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-stone-700 mb-2">
              Log {practices.find((p) => p.index === cell.index)?.day_label} · Week {cell.week}
            </p>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="How did it go? (optional)"
              className="w-full bg-stone-200 border border-stone-300 text-stone-900 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B6DFC]" />
            <div className="mt-2 flex items-center gap-2">
              <button onClick={() => log(cell.week, cell.index)} disabled={busy}
                className="text-xs font-semibold px-3 py-1.5 rounded-md bg-[#1B6DFC] text-white hover:bg-[#5390FF] disabled:opacity-40">
                {busy ? 'Logging…' : 'Mark complete'}
              </button>
              <button onClick={() => setCell(null)} className="text-xs text-stone-500 hover:text-stone-800">cancel</button>
              {error && <span className="text-xs text-red-600">{error}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
