'use client'

import { useState } from 'react'

export default function EditClientPhone({ clientId, currentPhone }: { clientId: string; currentPhone: string | null }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(currentPhone ?? '')
  const [saved, setSaved] = useState(currentPhone ?? '')
  const [loading, setLoading] = useState(false)

  async function save() {
    setLoading(true)
    await fetch(`/api/clients/${clientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: value.trim() || null }),
    })
    setSaved(value.trim())
    setEditing(false)
    setLoading(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="tel"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          placeholder="+61 400 000 000"
          autoFocus
          className="bg-stone-800 border border-stone-600 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-stone-400 w-48"
        />
        <button onClick={save} disabled={loading} className="text-xs text-teal-400 hover:text-teal-300 font-medium">
          {loading ? 'Saving…' : 'Save'}
        </button>
        <button onClick={() => { setValue(saved); setEditing(false) }} className="text-xs text-stone-500 hover:text-stone-300">
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-stone-300">{saved || <span className="text-stone-600">No mobile number</span>}</span>
      <button onClick={() => setEditing(true)} className="text-xs text-stone-500 hover:text-stone-300 underline">
        {saved ? 'edit' : 'add'}
      </button>
    </div>
  )
}
