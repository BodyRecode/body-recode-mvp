'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Completion {
  id: string
  session_index: number
  day_label: string
  completed_at: string | null
  logged_by: string | null
  session_notes: string | null
}

export default function YogaSessionLog({
  programId, practices, completions,
}: {
  programId: string
  practices: { index: number; day_label: string }[]
  completions: Completion[]
}) {
  const router = useRouter()
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function log(sessionIndex: number) {
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/yoga-log-practice', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program_id: programId, session_index: sessionIndex, notes: notes || null }),
      })
      if (!res.ok) { setError((await res.json()).error || 'Failed to log'); return }
      setOpenIndex(null); setNotes('')
      router.refresh()
    } catch { setError('Failed to log') } finally { setBusy(false) }
  }

  const history = completions.slice().sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''))

  return (
    <div className="bg-stone-100 border border-stone-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-stone-200 flex items-center justify-between">
        <p className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">Session Log</p>
        <span className="text-[10px] text-stone-400">{history.length} logged</span>
      </div>

      <div className="px-5 py-4">
        <p className="text-xs text-stone-500 mb-3">Log a practice the client completed, in person or on your behalf.</p>
        <div className="space-y-2">
          {practices.map((pr) => (
            <div key={pr.index} className="rounded-lg border border-stone-200 bg-white">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm font-medium text-stone-800">{pr.day_label}</span>
                <button onClick={() => { setOpenIndex(openIndex === pr.index ? null : pr.index); setNotes('') }}
                  className="text-xs font-semibold text-[#1B6DFC] hover:underline">
                  {openIndex === pr.index ? 'Cancel' : 'Log session'}
                </button>
              </div>
              {openIndex === pr.index && (
                <div className="px-3 pb-3 space-y-2">
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                    placeholder="How did it go? (optional)"
                    className="w-full bg-stone-200 border border-stone-300 text-stone-900 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B6DFC]" />
                  <button onClick={() => log(pr.index)} disabled={busy}
                    className="text-xs font-semibold px-3 py-1.5 rounded-md bg-[#1B6DFC] text-white hover:bg-[#5390FF] disabled:opacity-40">
                    {busy ? 'Logging…' : 'Mark complete'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

        {history.length > 0 && (
          <div className="mt-5">
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">History</p>
            <ul className="space-y-2">
              {history.map((c) => (
                <li key={c.id} className="border-l-2 border-stone-300 pl-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm text-stone-800 font-medium">{c.day_label}</span>
                    <span className="text-[11px] text-stone-400 shrink-0">
                      {c.completed_at ? new Date(c.completed_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : ''}
                      {c.logged_by ? ` · by ${c.logged_by}` : ''}
                    </span>
                  </div>
                  {c.session_notes && <p className="text-xs text-stone-500 mt-0.5">{c.session_notes}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
