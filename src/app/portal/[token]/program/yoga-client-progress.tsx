'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Completion { session_index: number; week_number_in_block: number }

export default function YogaClientProgress({
  token, programId, weeks, practices, completions,
}: {
  token: string
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

  const byKey = new Set(completions.map((c) => `${c.week_number_in_block}-${c.session_index}`))
  const total = weeks * practices.length
  const done = completions.length
  const weekList = Array.from({ length: weeks }, (_, i) => i + 1)

  async function log(week: number, sessionIndex: number) {
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/portal/log-yoga-practice', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, program_id: programId, session_index: sessionIndex, week_number_in_block: week, notes: notes || null }),
      })
      if (!res.ok) { setError((await res.json()).error || 'Could not log'); return }
      setCell(null); setNotes('')
      router.refresh()
    } catch { setError('Could not log') } finally { setBusy(false) }
  }

  return (
    <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-[#1B6DFC] uppercase tracking-widest">Your Progress</p>
        <span className="text-xs text-[#999999]">{done} of {total} done</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1 text-sm">
          <thead>
            <tr>
              <th className="text-left text-[10px] font-bold text-[#999999] uppercase tracking-wide px-2 py-1">Practice</th>
              {weekList.map((w) => <th key={w} className="text-[10px] font-bold text-[#999999] uppercase tracking-wide px-2 py-1 text-center whitespace-nowrap">Wk {w}</th>)}
            </tr>
          </thead>
          <tbody>
            {practices.map((pr) => (
              <tr key={pr.index}>
                <td className="px-2 py-1 text-sm font-semibold text-[#1A1A1A] align-middle max-w-[160px] truncate">{pr.day_label}</td>
                {weekList.map((w) => {
                  const done = byKey.has(`${w}-${pr.index}`)
                  const active = cell?.week === w && cell?.index === pr.index
                  return (
                    <td key={w} className="px-1 py-1 text-center">
                      {done ? (
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#1B6DFC]/10 border border-[#1B6DFC]/30 text-[#1B6DFC] font-bold">✓</span>
                      ) : (
                        <button onClick={() => { setCell(active ? null : { week: w, index: pr.index }); setNotes('') }}
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-md border text-[#999999] hover:border-[#1B6DFC] hover:text-[#1B6DFC] transition-colors ${active ? 'border-[#1B6DFC] text-[#1B6DFC]' : 'border-[#E5E5E5]'}`}>+</button>
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
        <div className="mt-4 border border-[#E5E5E5] rounded-xl p-3">
          <p className="text-xs font-semibold text-[#3A3A3A] mb-2">{practices.find((p) => p.index === cell.index)?.day_label} · Week {cell.week}</p>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="How did it feel? (optional)"
            className="w-full border border-[#E5E5E5] rounded-xl px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1B6DFC]" />
          <div className="mt-2 flex items-center gap-2">
            <button onClick={() => log(cell.week, cell.index)} disabled={busy}
              className="rounded-lg bg-[#1B6DFC] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#5390FF] disabled:opacity-50">{busy ? 'Logging…' : 'Mark complete'}</button>
            <button onClick={() => setCell(null)} className="text-xs text-[#999999] hover:text-[#3A3A3A]">cancel</button>
            {error && <span className="text-xs text-red-600">{error}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
