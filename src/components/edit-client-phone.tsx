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
          className="bg-[#1c1917] border border-[#292524] text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#14b8a6] w-48"
        />
        <button onClick={save} disabled={loading} className="text-xs text-teal-400 hover:text-teal-300 font-medium">
          {loading ? 'Saving…' : 'Save'}
        </button>
        <button onClick={() => { setValue(saved); setEditing(false) }} className="text-xs text-[#57534e] hover:text-[#d4cfc9]">
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-[#d4cfc9]">{saved || <span className="text-[#3c3835]">No mobile number</span>}</span>
      <button onClick={() => setEditing(true)} className="text-xs text-[#57534e] hover:text-[#d4cfc9] underline">
        {saved ? 'edit' : 'add'}
      </button>
    </div>
  )
}
