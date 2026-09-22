'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { STATUSES, STATUS_LABELS, statusAccent, type SupportStatus } from '@/lib/support-tickets'

const MONO = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace"

const STATUS_HEX: Record<ReturnType<typeof statusAccent>, string> = {
  amber: '#B06E1F',
  blue: '#0F1115',
  sage: '#2B5E45',
  neutral: '#6E747D',
}

export default function TicketStatusForm({
  id,
  initialStatus,
  initialNote,
  filerIsKade,
}: {
  id: string
  initialStatus: SupportStatus
  initialNote: string
  filerIsKade: boolean
}) {
  const router = useRouter()
  const [status, setStatus] = useState<SupportStatus>(initialStatus)
  const [note, setNote] = useState(initialNote)
  const [notify, setNotify] = useState(!filerIsKade)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  async function save() {
    setError('')
    setSaved(false)
    const res = await fetch(`/api/support/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, status_note: note, notify }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data.error || 'Failed to save')
      return
    }
    setSaved(true)
    startTransition(() => router.refresh())
  }

  return (
    <div className="border border-[#E4E4E0] bg-[#FAFAF8] rounded-xl p-6">
      <p className="text-[11px] font-medium text-[#6E747D] mb-4" style={{ fontFamily: MONO }}>
        Update status
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
        {STATUSES.map(s => {
          const active = s === status
          const hex = STATUS_HEX[statusAccent(s)]
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className="text-[13px] font-semibold px-3 py-2 rounded-lg border transition-colors"
              style={{
                background: active ? `${hex}14` : '#FFFFFF',
                color: active ? hex : '#4A4F57',
                borderColor: active ? hex : '#E4E4E0',
              }}
            >
              {STATUS_LABELS[s]}
            </button>
          )
        })}
      </div>

      <label htmlFor="status-note" className="block text-[11px] font-medium text-[#6E747D] mb-2" style={{ fontFamily: MONO }}>
        Note to filer (optional)
      </label>
      <textarea
        id="status-note"
        value={note}
        onChange={e => setNote(e.target.value)}
        maxLength={2000}
        rows={4}
        placeholder={`Shown to the filer verbatim. Use plain language, no jargon. Blank means no note.`}
        className="w-full text-[13.5px] resize-none border border-[#E4E4E0] rounded-lg px-3 py-2 focus:outline-none focus:border-[#0F1115] bg-white mb-3"
      />

      <label className="flex items-center gap-2 text-[13px] text-[#4A4F57] mb-4">
        <input type="checkbox" checked={notify} onChange={e => setNotify(e.target.checked)} disabled={filerIsKade} />
        Email the filer about this change
        {filerIsKade && <span className="text-[11px] text-[#9CA2AB]">(you filed this — no email sent)</span>}
      </label>

      {error && <div className="text-[12.5px] text-[#8F2D2D] mb-3">{error}</div>}
      {saved && <div className="text-[12.5px] text-[#2B5E45] mb-3">Saved.</div>}

      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="text-[13px] font-semibold px-4 py-2 bg-[#0F1115] text-white rounded-lg hover:bg-[#000000] transition-colors disabled:opacity-40"
      >
        {pending ? 'Saving…' : 'Save update'}
      </button>
    </div>
  )
}
