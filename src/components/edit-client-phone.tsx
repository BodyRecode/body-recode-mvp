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
          className="bg-[#EFF1F4] border border-[#CFD4DC] text-[#141821] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#1B6DFC] w-48"
        />
        <button onClick={save} disabled={loading} className="text-[12.5px] text-[#1B6DFC] hover:text-[#1056D6] font-medium">
          {loading ? 'Saving…' : 'Save'}
        </button>
        <button onClick={() => { setValue(saved); setEditing(false) }} className="text-[12.5px] text-[#98A0AD] hover:text-[#43474F]">
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-[#43474F]">{saved || <span className="text-[#98A0AD]">No mobile number</span>}</span>
      <button onClick={() => setEditing(true)} className="text-[12.5px] text-[#98A0AD] hover:text-[#43474F] underline">
        {saved ? 'edit' : 'add'}
      </button>
    </div>
  )
}
