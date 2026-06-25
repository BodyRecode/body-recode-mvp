'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function YogaLogButton({
  token, programId, sessionIndex, alreadyLogged,
}: { token: string; programId: string; sessionIndex: number; alreadyLogged: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (alreadyLogged) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1B6DFC]/10 px-3 py-1 text-xs font-semibold text-[#1B6DFC]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#1B6DFC]" /> Completed
      </span>
    )
  }

  async function log() {
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/portal/log-yoga-practice', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, program_id: programId, session_index: sessionIndex, notes: notes || null }),
      })
      if (!res.ok) { setError((await res.json()).error || 'Could not log'); return }
      router.refresh()
    } catch { setError('Could not log') } finally { setBusy(false) }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="rounded-full border border-[#E5E5E5] px-3 py-1 text-xs font-semibold text-[#3A3A3A] hover:border-[#1B6DFC] hover:text-[#1B6DFC] transition-colors">
        Mark complete
      </button>
    )
  }

  return (
    <div className="mt-2 w-full">
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
        placeholder="How did it feel? (optional)"
        className="w-full border border-[#E5E5E5] rounded-xl px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1B6DFC]" />
      <div className="mt-2 flex items-center gap-2">
        <button onClick={log} disabled={busy}
          className="rounded-lg bg-[#1B6DFC] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#5390FF] disabled:opacity-50">
          {busy ? 'Logging…' : 'Log practice'}
        </button>
        <button onClick={() => setOpen(false)} className="text-xs text-[#999999] hover:text-[#3A3A3A]">cancel</button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </div>
  )
}
