'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { STATUSES, STATUS_LABELS, statusAccent, type SupportStatus } from '@/lib/support-tickets'

const MONO = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace"

const STATUS_HEX: Record<ReturnType<typeof statusAccent>, string> = {
  amber: '#B7791F',
  blue: '#1B6DFC',
  sage: '#7A8A6B',
  neutral: '#6B6B6B',
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
    <div className="border border-[#E8EAEE] bg-[#FAFBFD] rounded-xl p-6">
      <p className="text-[11px] font-medium text-[#666D7A] mb-4" style={{ fontFamily: MONO }}>
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
                color: active ? hex : '#4A4A4A',
                borderColor: active ? hex : '#E5E5E5',
              }}
            >
              {STATUS_LABELS[s]}
            </button>
          )
        })}
      </div>

      <label htmlFor="status-note" className="block text-[11px] font-medium text-[#666D7A] mb-2" style={{ fontFamily: MONO }}>
        Note to filer (optional)
      </label>
      <textarea
        id="status-note"
        value={note}
        onChange={e => setNote(e.target.value)}
        maxLength={2000}
        rows={4}
        placeholder={`Shown to the filer verbatim. Use plain language, no jargon. Blank means no note.`}
        className="w-full text-[13.5px] resize-none border border-[#E8EAEE] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1B6DFC] bg-white mb-3"
      />

      <label className="flex items-center gap-2 text-[13px] text-[#4A4A4A] mb-4">
        <input type="checkbox" checked={notify} onChange={e => setNotify(e.target.checked)} disabled={filerIsKade} />
        Email the filer about this change
        {filerIsKade && <span className="text-[11px] text-[#98A0AD]">(you filed this — no email sent)</span>}
      </label>

      {error && <div className="text-[12.5px] text-red-600 mb-3">{error}</div>}
      {saved && <div className="text-[12.5px] text-[#4D5A41] mb-3">Saved.</div>}

      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="text-[13px] font-semibold px-4 py-2 bg-[#1B6DFC] text-white rounded-lg hover:bg-[#1056D6] transition-colors disabled:opacity-40"
      >
        {pending ? 'Saving…' : 'Save update'}
      </button>
    </div>
  )
}
