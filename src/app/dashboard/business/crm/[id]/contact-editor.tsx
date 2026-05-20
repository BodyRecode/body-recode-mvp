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
        className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-700 transition-colors mt-1"
      >
        <Pencil size={11} />
        Edit contact details
      </button>
    )
  }

  return (
    <div className="mt-4 space-y-3">
      <div>
        <label className="block text-xs text-stone-500 mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full bg-stone-200 border border-stone-300 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs text-stone-500 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full bg-stone-200 border border-stone-300 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs text-stone-500 mb-1">Phone</label>
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="0412 345 678"
          className="w-full bg-stone-200 border border-stone-300 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] placeholder-stone-400 focus:outline-none focus:border-blue-500"
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-500 disabled:opacity-50 text-stone-50 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          <Check size={12} />
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={() => setEditing(false)}
          className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-700 transition-colors"
        >
          <X size={12} />
          Cancel
        </button>
      </div>
    </div>
  )
}
