'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Field = { label: string; value: string; type?: 'text' | 'number' | 'color' | 'boolean' }

/**
 * Editable card for one section of the tenant config (brand/coach/products/etc).
 * Toggle between read-only and edit mode. Save posts to /api/tenant/update.
 */
export function EditableSection({
  section,
  title,
  fields,
  numericKeys = new Set(),
  booleanKeys = new Set(),
  colorKeys = new Set(),
}: {
  section: 'brand' | 'coach' | 'products' | 'licence' | 'modality'
  title: string
  fields: Field[]
  numericKeys?: Set<string>
  booleanKeys?: Set<string>
  colorKeys?: Set<string>
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.label, f.value])),
  )

  const dirty = fields.some((f) => values[f.label] !== f.value)

  async function save() {
    setSaving(true)
    setError(null)
    try {
      // Build the patch — cast numeric/boolean values back to correct types
      const patch: Record<string, unknown> = {}
      for (const f of fields) {
        const raw = values[f.label]
        if (raw === f.value) continue  // skip unchanged
        if (numericKeys.has(f.label)) {
          patch[f.label] = Number(raw)
        } else if (booleanKeys.has(f.label)) {
          patch[f.label] = raw === 'true'
        } else {
          patch[f.label] = raw
        }
      }

      const res = await fetch('/api/tenant/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, patch }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'save failed')

      setEditing(false)
      router.refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  function cancel() {
    setValues(Object.fromEntries(fields.map((f) => [f.label, f.value])))
    setEditing(false)
    setError(null)
  }

  return (
    <div className="mb-4 br-card overflow-hidden">
      <div className="px-5 py-3 border-b border-[#E8EAEE] bg-[#FBFCFD] flex items-center justify-between gap-3">
        <h3 className="text-[13.5px] font-semibold text-[#141821] tracking-[-0.015em]">{title}</h3>
        {editing ? (
          <div className="flex items-center gap-2">
            <button
              onClick={cancel}
              disabled={saving}
              className="text-[12px] px-3 py-1 rounded-md text-[#666D7A] hover:bg-[#F4F6F9] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving || !dirty}
              className="text-[12px] px-3 py-1 rounded-md bg-[#1B6DFC] text-white font-semibold hover:bg-[#1560E0] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-[12px] px-3 py-1 rounded-md text-[#1560E0] hover:bg-[rgba(27,109,252,0.06)] font-semibold"
          >
            Edit
          </button>
        )}
      </div>

      {error && (
        <div className="px-5 py-2 bg-[#FDEDED] border-b border-[#F5C9C9] text-[#8A1919] text-[12px]">
          Error: {error}
        </div>
      )}

      <div className="divide-y divide-[#F4F6F9]">
        {fields.map((f) => {
          const isNumeric = numericKeys.has(f.label)
          const isBool = booleanKeys.has(f.label)
          const isColor = colorKeys.has(f.label)
          const inputType = isColor ? 'color' : isNumeric ? 'number' : 'text'
          return (
            <div key={f.label} className="px-5 py-2.5 flex items-center gap-4">
              <div className="w-52 shrink-0 text-[12px] text-[#666D7A] font-mono">{f.label}</div>
              <div className="flex-1">
                {editing ? (
                  isBool ? (
                    <select
                      value={values[f.label]}
                      onChange={(e) => setValues({ ...values, [f.label]: e.target.value })}
                      className="w-full px-2 py-1 text-[13px] font-mono border border-[#E8EAEE] rounded focus:outline-none focus:border-[#1B6DFC]"
                    >
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  ) : (
                    <input
                      type={inputType}
                      value={values[f.label]}
                      onChange={(e) => setValues({ ...values, [f.label]: e.target.value })}
                      className={`px-2 py-1 text-[13px] font-mono border border-[#E8EAEE] rounded focus:outline-none focus:border-[#1B6DFC] ${isColor ? 'w-24 h-8 p-1' : 'w-full'}`}
                    />
                  )
                ) : (
                  <div className="text-[13px] text-[#141821] font-mono break-all">
                    {f.value || <span className="text-[#98A0AD] italic">(empty)</span>}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
