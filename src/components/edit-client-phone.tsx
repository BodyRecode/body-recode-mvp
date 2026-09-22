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
          className="bg-[#1F242C] border border-[#CFD4DC] text-[#FAFAF8] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#FAFAF8] w-48"
        />
        <button onClick={save} disabled={loading} className="text-[12.5px] text-[#FAFAF8] hover:text-[#1056D6] font-medium">
          {loading ? 'Saving…' : 'Save'}
        </button>
        <button onClick={() => { setValue(saved); setEditing(false) }} className="text-[12.5px] text-[#676D76] hover:text-[#C2C6CC]">
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-[#C2C6CC]">{saved || <span className="text-[#676D76]">No mobile number</span>}</span>
      <button onClick={() => setEditing(true)} className="text-[12.5px] text-[#676D76] hover:text-[#C2C6CC] underline">
        {saved ? 'edit' : 'add'}
      </button>
    </div>
  )
}
