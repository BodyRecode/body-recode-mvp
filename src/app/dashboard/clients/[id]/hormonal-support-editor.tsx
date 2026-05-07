'use client'

import { useState } from 'react'
import { MONO_FONT } from '@/components/dashboard/ui'

export default function HormonalSupportEditor({
  clientId,
  initialValue,
}: {
  clientId: string
  initialValue: string | null
}) {
  const [value, setValue] = useState(initialValue ?? '')
  const [original, setOriginal] = useState(initialValue ?? '')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dirty = value !== original

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hormonal_support: value.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Save failed')
        return
      }
      setOriginal(value)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  function cancel() {
    setValue(original)
    setEditing(false)
    setError(null)
  }

  return (
    <div className="bg-[#111110] border border-[#1c1917] rounded-2xl p-6 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-[3px] rounded-full bg-[#14b8a6]" />
          <h2
            className="text-[11px] font-bold text-white uppercase"
            style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
          >
            Hormonal Support
          </h2>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-medium px-3 py-1.5 border border-[#1c1917] text-[#a8a29e] rounded-lg hover:border-[#292524] hover:text-[#e7e5e4] transition-colors"
          >
            {value ? 'Edit' : 'Add'}
          </button>
        )}
      </div>
      <p className="text-[#57534e] text-xs mb-3">
        TRT, exogenous hormones, GLP-1, peptides, anabolic support. Free text — describe regimen and dose context. Drives prescription modulation across program + nutrition.
      </p>
      {editing ? (
        <div className="space-y-3">
          <textarea
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="e.g. TRT 150mg test cypionate / week, year 2. No other peptides currently."
            className="w-full bg-[#0c0a09] border border-[#1c1917] rounded-lg p-3 text-[#e7e5e4] text-sm leading-relaxed focus:outline-none focus:border-[#292524] placeholder-[#3c3835] min-h-[100px]"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex items-center gap-2">
            <button
              onClick={save}
              disabled={saving || !dirty}
              className="text-sm font-bold px-4 py-2 bg-[#14b8a6] text-black rounded-lg hover:bg-[#5eead4] transition-colors disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={cancel}
              disabled={saving}
              className="text-sm font-bold px-4 py-2 border border-[#1c1917] text-[#a8a29e] rounded-lg hover:border-[#292524] hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : value ? (
        <p className="text-sm text-[#d4cfc9] leading-relaxed whitespace-pre-line">{value}</p>
      ) : (
        <p className="text-sm text-[#3c3835] italic">None reported.</p>
      )}
    </div>
  )
}
