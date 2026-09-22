'use client'

import { useState } from 'react'

export default function ReviewCoachNotes({ reviewId, existingNotes }: { reviewId: string; existingNotes: string | null }) {
  const [editing, setEditing] = useState(false)
  const [notes, setNotes] = useState(existingNotes ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/program-reviews/${reviewId}/notes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coach_notes: notes }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  if (!editing) {
    return (
      <div className="mt-2">
        {notes ? (
          <div className="bg-[#EDEDEA]/50 rounded-lg px-3 py-2 text-[12.5px] text-[#0F1115] leading-relaxed">
            <span className="text-[#0F1115] font-semibold mr-1">Your note:</span>{notes}
            <button onClick={() => setEditing(true)} className="ml-2 text-[#6E747D] hover:text-[#0F1115] underline text-[10px]">edit</button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-[11px] text-[#9CA2AB] hover:text-[#0F1115] transition-colors"
          >
            + Add feedback for client
          </button>
        )}
        {saved && <span className="text-[11px] text-[#0F1115] ml-2">Saved</span>}
      </div>
    )
  }

  return (
    <div className="mt-2 space-y-2">
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Write feedback for the client. This will appear on their portal home page."
        rows={3}
        className="w-full bg-[#EDEDEA] border border-[#E4E4E0] rounded-lg px-3 py-2 text-[12.5px] text-[#0F1115] placeholder-[#9CA2AB] focus:outline-none focus:border-[#0F1115] resize-none"
        autoFocus
      />
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-[12.5px] font-semibold bg-[#0F1115] hover:bg-[#DCDCD7] disabled:bg-[#E4E4E0] text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={() => { setEditing(false); setNotes(existingNotes ?? '') }}
          className="text-[12.5px] text-[#6E747D] hover:text-[#0F1115] px-3 py-1.5"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
