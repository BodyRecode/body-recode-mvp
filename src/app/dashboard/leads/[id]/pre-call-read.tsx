'use client'

import { useState } from 'react'

interface PreCallReadProps {
  leadId: string
  initialBrief: string | null
}

export default function PreCallRead({ leadId, initialBrief }: PreCallReadProps) {
  const [brief, setBrief] = useState(initialBrief ?? '')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState(initialBrief ?? '')

  async function save() {
    setSaving(true)
    const res = await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pre_call_brief: draft }),
    })
    setSaving(false)
    if (res.ok) {
      setBrief(draft)
      setEditing(false)
    }
  }

  function startEdit() {
    setDraft(brief)
    setEditing(true)
  }

  function cancel() {
    setDraft(brief)
    setEditing(false)
  }

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-stone-300 uppercase tracking-wider mb-1">Pre-Call Read</h2>
          <p className="text-stone-500 text-sm">
            Lead-specific brief for this call. Their pattern, what to listen for, lines to have ready.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button
                onClick={cancel}
                disabled={saving}
                className="text-sm font-bold px-4 py-2 border border-stone-700 text-stone-400 rounded-lg hover:border-stone-500 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="text-sm font-bold px-4 py-2 bg-[#10E1C2] text-black rounded-lg hover:bg-[#0ecfb2] transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <button
              onClick={startEdit}
              className="text-sm font-bold px-4 py-2 border border-stone-700 text-stone-300 rounded-lg hover:border-stone-500 hover:text-white transition-colors"
            >
              {brief ? 'Edit' : 'Add'}
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Paste or write the pre-call brief for this lead. Pattern, hot spot triggers, key lines..."
          className="w-full bg-stone-950 border border-stone-800 rounded-lg p-4 text-stone-200 text-sm font-mono leading-relaxed focus:outline-none focus:border-stone-600 placeholder-stone-700"
          style={{ minHeight: '480px' }}
        />
      ) : brief ? (
        <pre className="bg-stone-950 border border-stone-800 rounded-lg p-4 text-stone-200 text-sm leading-relaxed whitespace-pre-wrap font-mono overflow-x-auto">
          {brief}
        </pre>
      ) : (
        <div className="bg-stone-950 border border-stone-800 border-dashed rounded-lg p-6 text-center">
          <p className="text-stone-500 text-sm">No pre-call read written yet for this lead.</p>
          <p className="text-stone-600 text-xs mt-1">Click Add to write one.</p>
        </div>
      )}
    </div>
  )
}
