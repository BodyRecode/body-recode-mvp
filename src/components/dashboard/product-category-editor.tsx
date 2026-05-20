'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORY_OPTIONS = [
  { value: '',                       label: 'Untagged' },
  { value: 'performance_coaching',   label: 'Performance Coaching' },
  { value: 'body_recode',            label: 'Body Recode (report / Blueprint / Membership)' },
  { value: 'studio_of_ten',          label: 'Studio of Ten' },
  { value: 'overhead',               label: 'Overhead' },
  { value: 'other',                  label: 'Other' },
] as const

type Category = (typeof CATEGORY_OPTIONS)[number]['value']

/**
 * Inline category dropdown for a be_products row. Saves on change.
 * Used on the Reconcile page so existing products can be tagged so that LTV
 * filters work properly.
 */
export default function ProductCategoryEditor({
  productId,
  initialCategory,
}: {
  productId: string
  initialCategory: Category | null
}) {
  const [value, setValue] = useState<Category>(initialCategory ?? '')
  const [pending, setPending] = useState(false)
  const router = useRouter()

  async function save(newValue: Category) {
    setPending(true)
    setValue(newValue)
    try {
      const res = await fetch('/api/admin/products/set-category', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ product_id: productId, category: newValue || null }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(`Failed: ${err.error ?? res.statusText}`)
        setValue(initialCategory ?? '')
        return
      }
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <select
      value={value}
      disabled={pending}
      onChange={(e) => save(e.target.value as Category)}
      className="bg-stone-100 border border-stone-200 hover:border-stone-300 text-xs text-stone-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500/50 disabled:opacity-50"
    >
      {CATEGORY_OPTIONS.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}
