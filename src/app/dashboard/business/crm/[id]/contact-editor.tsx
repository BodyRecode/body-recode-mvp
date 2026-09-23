'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Check, X } from 'lucide-react'

interface Props {
  leadId: string
  initialName: string
  initialEmail: string | null
  initialPhone: string | null
}

export default function ContactEditor({ leadId, initialName, initialEmail, initialPhone }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(initialEmail ?? '')
  const [phone, setPhone] = useState(initialPhone ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email: email || null, phone: phone || null }),
    })
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-1.5 text-[12.5px] text-[#8A9099] hover:text-[#FAFAF8] transition-colors mt-1"
      >
        <Pencil size={11} />
        Edit contact details
      </button>
    )
  }

  return (
    <div className="mt-4 space-y-3">
      <div>
        <label className="block text-[12.5px] text-[#8A9099] mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full bg-[#1F242C] border border-[#2A2F39] rounded-lg px-3 py-2 text-sm text-[#FAFAF8] focus:outline-none focus:border-[#FAFAF8]"
        />
      </div>
      <div>
        <label className="block text-[12.5px] text-[#8A9099] mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full bg-[#1F242C] border border-[#2A2F39] rounded-lg px-3 py-2 text-sm text-[#FAFAF8] focus:outline-none focus:border-[#FAFAF8]"
        />
      </div>
      <div>
        <label className="block text-[12.5px] text-[#8A9099] mb-1">Phone</label>
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="0412 345 678"
          className="w-full bg-[#1F242C] border border-[#2A2F39] rounded-lg px-3 py-2 text-sm text-[#FAFAF8] placeholder-[#676D76] focus:outline-none focus:border-[#FAFAF8]"
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 bg-[#FAFAF8] hover:bg-[#E4E4E0] disabled:opacity-50 text-[#14171D] text-[12.5px] font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          <Check size={12} />
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={() => setEditing(false)}
          className="flex items-center gap-1.5 text-[12.5px] text-[#8A9099] hover:text-[#FAFAF8] transition-colors"
        >
          <X size={12} />
          Cancel
        </button>
      </div>
    </div>
  )
}
