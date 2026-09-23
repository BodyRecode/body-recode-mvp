'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  leadId: string
  name: string
  email: string | null
  phone: string | null
}

export default function EditContact({ leadId, name, email, phone }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [nameVal, setNameVal] = useState(name)
  const [emailVal, setEmailVal] = useState(email || '')
  const [phoneVal, setPhoneVal] = useState(phone || '')

  async function save() {
    setSaving(true)
    await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nameVal, email: emailVal || null, phone: phoneVal || null }),
    })
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  function cancel() {
    setNameVal(name)
    setEmailVal(email || '')
    setPhoneVal(phone || '')
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="br-card p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[13.5px] font-semibold text-[#FAFAF8] tracking-[-0.015em]">Contact</h2>
          <button
            onClick={() => setEditing(true)}
            className="text-[12.5px] text-[#676D76] hover:text-[#C2C6CC] transition-colors"
          >
            Edit
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[12.5px] text-[#676D76] mb-1">Email</p>
            <p className="text-[#FAFAF8] text-sm">{email || '-'}</p>
          </div>
          <div>
            <p className="text-[12.5px] text-[#676D76] mb-1">Phone</p>
            <p className="text-[#FAFAF8] text-sm">{phone || '-'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="br-card p-6 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[13.5px] font-semibold text-[#FAFAF8] tracking-[-0.015em]">Contact</h2>
        <button onClick={cancel} className="text-[12.5px] text-[#676D76] hover:text-[#C2C6CC] transition-colors">
          Cancel
        </button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-[12.5px] text-[#676D76] mb-1">Name</label>
          <input
            type="text"
            value={nameVal}
            onChange={e => setNameVal(e.target.value)}
            className="w-full bg-[#1F242C] border border-[#2A2F39] rounded-lg px-3 py-2 text-[#FAFAF8] text-sm focus:outline-none focus:border-[#FAFAF8]"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12.5px] text-[#676D76] mb-1">Email</label>
            <input
              type="email"
              value={emailVal}
              onChange={e => setEmailVal(e.target.value)}
              className="w-full bg-[#1F242C] border border-[#2A2F39] rounded-lg px-3 py-2 text-[#FAFAF8] text-sm focus:outline-none focus:border-[#FAFAF8]"
            />
          </div>
          <div>
            <label className="block text-[12.5px] text-[#676D76] mb-1">Phone</label>
            <input
              type="tel"
              value={phoneVal}
              onChange={e => setPhoneVal(e.target.value)}
              className="w-full bg-[#1F242C] border border-[#2A2F39] rounded-lg px-3 py-2 text-[#FAFAF8] text-sm focus:outline-none focus:border-[#FAFAF8]"
            />
          </div>
        </div>
        <button
          onClick={save}
          disabled={saving || !nameVal.trim()}
          className="bg-[#FAFAF8] text-[#14171D] text-sm font-medium px-5 py-2 rounded-lg hover:bg-[#E4E4E0] transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}
