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
          className="bg-[#E5E5E5] border border-[#D4D4D4] text-[#1A1A1A] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#1B6DFC] w-48"
        />
        <button onClick={save} disabled={loading} className="text-xs text-blue-500 hover:text-blue-700 font-medium">
          {loading ? 'Saving…' : 'Save'}
        </button>
        <button onClick={() => { setValue(saved); setEditing(false) }} className="text-xs text-[#999999] hover:text-[#3A3A3A]">
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-[#3A3A3A]">{saved || <span className="text-[#999999]">No mobile number</span>}</span>
      <button onClick={() => setEditing(true)} className="text-xs text-[#999999] hover:text-[#3A3A3A] underline">
        {saved ? 'edit' : 'add'}
      </button>
    </div>
  )
}
