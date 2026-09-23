'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const SOURCES = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'google', label: 'Google' },
  { value: 'gym_floor', label: 'Gym Floor' },
  { value: 'referral', label: 'Referral' },
  { value: 'direct', label: 'Direct Contact' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'other', label: 'Other' },
]

export default function NewLeadPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = e.currentTarget
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
      source: (form.elements.namedItem('source') as HTMLSelectElement).value,
      source_detail: (form.elements.namedItem('source_detail') as HTMLInputElement).value,
      notes: (form.elements.namedItem('notes') as HTMLTextAreaElement).value,
    }

    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      const lead = await res.json()
      router.push(`/dashboard/leads/${lead.id}`)
    } else {
      setError('Failed to create lead. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl">
      <div className="br-page-header sticky top-0 z-20 mb-7 pt-4 pb-3.5 border-b border-[#2A2F39] bg-[#14171D]/[0.88] backdrop-blur-md print:static print:bg-transparent">
        <h1 className="text-2xl font-semibold">Add Lead</h1>
        <p className="text-[#8A9099] text-sm mt-1">Manually add a lead from any source</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-[#FAFAF8] mb-1.5">Name <span className="text-[#D4817E]">*</span></label>
          <input
            name="name"
            required
            className="w-full bg-[#1A1E26] border border-[#2A2F39] rounded-lg px-4 py-2.5 text-[#FAFAF8] text-sm focus:outline-none focus:border-[#2A2F39]"
            placeholder="Full name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#FAFAF8] mb-1.5">Email</label>
          <input
            name="email"
            type="email"
            className="w-full bg-[#1A1E26] border border-[#2A2F39] rounded-lg px-4 py-2.5 text-[#FAFAF8] text-sm focus:outline-none focus:border-[#2A2F39]"
            placeholder="email@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#FAFAF8] mb-1.5">Phone</label>
          <input
            name="phone"
            type="tel"
            className="w-full bg-[#1A1E26] border border-[#2A2F39] rounded-lg px-4 py-2.5 text-[#FAFAF8] text-sm focus:outline-none focus:border-[#2A2F39]"
            placeholder="04xx xxx xxx"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#FAFAF8] mb-1.5">Source <span className="text-[#D4817E]">*</span></label>
          <select
            name="source"
            required
            className="w-full bg-[#1A1E26] border border-[#2A2F39] rounded-lg px-4 py-2.5 text-[#FAFAF8] text-sm focus:outline-none focus:border-[#2A2F39]"
          >
            {SOURCES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#FAFAF8] mb-1.5">Source detail <span className="text-[#8A9099] font-normal">(optional)</span></label>
          <input
            name="source_detail"
            className="w-full bg-[#1A1E26] border border-[#2A2F39] rounded-lg px-4 py-2.5 text-[#FAFAF8] text-sm focus:outline-none focus:border-[#2A2F39]"
            placeholder="e.g. Referred by John Smith"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#FAFAF8] mb-1.5">Notes <span className="text-[#8A9099] font-normal">(optional)</span></label>
          <textarea
            name="notes"
            rows={4}
            className="w-full bg-[#1A1E26] border border-[#2A2F39] rounded-lg px-4 py-2.5 text-[#FAFAF8] text-sm focus:outline-none focus:border-[#2A2F39] resize-none"
            placeholder="Any initial context about this lead..."
          />
        </div>

        {error && <p className="text-[#D4817E] text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#14171D] text-[#14171D] text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-[#14171D] transition-colors disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Lead'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-[#8A9099] text-sm px-5 py-2.5 rounded-lg hover:text-[#FAFAF8] transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
