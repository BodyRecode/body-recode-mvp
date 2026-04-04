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
          <div className="bg-stone-800/50 rounded-lg px-3 py-2 text-xs text-stone-300 leading-relaxed">
            <span className="text-teal-500 font-semibold mr-1">Your note:</span>{notes}
            <button onClick={() => setEditing(true)} className="ml-2 text-stone-500 hover:text-stone-300 underline text-[10px]">edit</button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-[11px] text-stone-600 hover:text-teal-400 transition-colors"
          >
            + Add feedback for client
          </button>
        )}
        {saved && <span className="text-[11px] text-teal-400 ml-2">Saved</span>}
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
        className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-teal-500 resize-none"
        autoFocus
      />
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs font-semibold bg-teal-400 hover:bg-teal-300 disabled:bg-stone-700 text-black px-3 py-1.5 rounded-lg transition-colors"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={() => { setEditing(false); setNotes(existingNotes ?? '') }}
          className="text-xs text-stone-500 hover:text-stone-300 px-3 py-1.5"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
