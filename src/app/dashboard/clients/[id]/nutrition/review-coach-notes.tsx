'use client'

import { useState } from 'react'

export default function NutritionReviewCoachNotes({ reviewId, existingNotes }: { reviewId: string; existingNotes: string | null }) {
  const [editing, setEditing] = useState(false)
  const [notes, setNotes] = useState(existingNotes ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/nutrition-reviews/${reviewId}/notes`, {
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
          <div className="bg-stone-200/50 rounded-lg px-3 py-2 text-xs text-stone-700 leading-relaxed">
            <span className="text-blue-500 font-semibold mr-1">Your note:</span>{notes}
            <button onClick={() => setEditing(true)} className="ml-2 text-stone-500 hover:text-stone-700 underline text-[10px]">edit</button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-[11px] text-stone-400 hover:text-blue-500 transition-colors"
          >
            + Add feedback for client
          </button>
        )}
        {saved && <span className="text-[11px] text-blue-500 ml-2">Saved</span>}
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
        className="w-full bg-stone-200 border border-stone-300 rounded-lg px-3 py-2 text-xs text-[#1A1A1A] placeholder-stone-400 focus:outline-none focus:border-blue-500 resize-none"
        autoFocus
      />
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs font-semibold bg-blue-500 hover:bg-blue-300 disabled:bg-stone-300 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={() => { setEditing(false); setNotes(existingNotes ?? '') }}
          className="text-xs text-stone-500 hover:text-stone-700 px-3 py-1.5"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
