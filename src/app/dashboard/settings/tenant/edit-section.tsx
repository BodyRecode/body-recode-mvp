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
      <div className="px-5 py-3 border-b border-[#E4E4E0] bg-[#FAFAF8] flex items-center justify-between gap-3">
        <h3 className="text-[13.5px] font-semibold text-[#0F1115] tracking-[-0.015em]">{title}</h3>
        {editing ? (
          <div className="flex items-center gap-2">
            <button
              onClick={cancel}
              disabled={saving}
              className="text-[12.5px] px-3 py-1 rounded-md text-[#6E747D] hover:bg-[#F2F2EF] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving || !dirty}
              className="text-[12.5px] px-3 py-1 rounded-md bg-[#0F1115] text-white font-semibold hover:bg-[#000000] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-[12.5px] px-3 py-1 rounded-md text-[#000000] hover:bg-[rgba(27,109,252,0.06)] font-semibold"
          >
            Edit
          </button>
        )}
      </div>

      {error && (
        <div className="px-5 py-2 bg-[#FBF1F1] border-b border-[#E8C9C9] text-[#8A1919] text-[12.5px]">
          Error: {error}
        </div>
      )}

      <div className="divide-y divide-[#F2F2EF]">
        {fields.map((f) => {
          const isNumeric = numericKeys.has(f.label)
          const isBool = booleanKeys.has(f.label)
          const isColor = colorKeys.has(f.label)
          const inputType = isColor ? 'color' : isNumeric ? 'number' : 'text'
          return (
            <div key={f.label} className="px-5 py-2.5 flex items-center gap-4">
              <div className="w-52 shrink-0 text-[12.5px] text-[#6E747D] font-mono">{f.label}</div>
              <div className="flex-1">
                {editing ? (
                  isBool ? (
                    <select
                      value={values[f.label]}
                      onChange={(e) => setValues({ ...values, [f.label]: e.target.value })}
                      className="w-full px-2 py-1 text-[13.5px] font-mono border border-[#E4E4E0] rounded focus:outline-none focus:border-[#0F1115]"
                    >
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  ) : (
                    <input
                      type={inputType}
                      value={values[f.label]}
                      onChange={(e) => setValues({ ...values, [f.label]: e.target.value })}
                      className={`px-2 py-1 text-[13.5px] font-mono border border-[#E4E4E0] rounded focus:outline-none focus:border-[#0F1115] ${isColor ? 'w-24 h-8 p-1' : 'w-full'}`}
                    />
                  )
                ) : (
                  <div className="text-[13.5px] text-[#0F1115] font-mono break-all">
                    {f.value || <span className="text-[#9CA2AB] italic">(empty)</span>}
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
