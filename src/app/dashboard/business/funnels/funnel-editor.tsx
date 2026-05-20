'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink, Trash2, X, Globe } from 'lucide-react'

interface FunnelEditorProps {
  funnel?: {
    id: string
    name: string
    slug: string
    is_active: boolean
    headline: string
    subheadline: string
    body: string
    cta_label: string
    redirect_to: string
  }
}

const REDIRECT_OPTIONS = [
  { value: 'book', label: 'Booking page (/book)' },
  { value: 'thank_you', label: 'Thank you message (no redirect)' },
]

export default function FunnelEditor({ funnel }: FunnelEditorProps) {
  const router = useRouter()
  const isNew = !funnel?.id

  const [name, setName] = useState(funnel?.name ?? '')
  const [slug, setSlug] = useState(funnel?.slug ?? '')
  const [isActive, setIsActive] = useState(funnel?.is_active ?? true)
  const [headline, setHeadline] = useState(funnel?.headline ?? '')
  const [subheadline, setSubheadline] = useState(funnel?.subheadline ?? '')
  const [body, setBody] = useState(funnel?.body ?? '')
  const [ctaLabel, setCtaLabel] = useState(funnel?.cta_label ?? 'Book a Free Call')
  const [redirectTo, setRedirectTo] = useState(funnel?.redirect_to ?? 'book')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function autoSlug(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  async function save() {
    if (!name.trim()) { setError('Funnel name is required'); return }
    if (!slug.trim()) { setError('URL slug is required'); return }
    setSaving(true)
    setError('')

    const payload = { name, slug, is_active: isActive, headline, subheadline, body, cta_label: ctaLabel, redirect_to: redirectTo }

    try {
      if (isNew) {
        const res = await fetch('/api/funnels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        router.push('/dashboard/business/funnels')
        router.refresh()
      } else {
        const res = await fetch(`/api/funnels/${funnel!.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        router.push('/dashboard/business/funnels')
        router.refresh()
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteFunnel() {
    if (!funnel?.id) return
    if (!confirm('Delete this funnel? The public URL will stop working.')) return
    await fetch(`/api/funnels/${funnel.id}`, { method: 'DELETE' })
    router.push('/dashboard/business/funnels')
    router.refresh()
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">{isNew ? 'New Funnel' : 'Edit Funnel'}</h1>
        <div className="flex items-center gap-2">
          {!isNew && (
            <>
              <a
                href={`/f/${slug}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 text-stone-400 hover:text-stone-600 transition-colors"
                title="Preview live page"
              >
                <ExternalLink size={15} />
              </a>
              <button
                onClick={deleteFunnel}
                className="p-2 text-stone-400 hover:text-red-400 transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </>
          )}
          <button
            onClick={() => router.back()}
            className="p-2 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Name + Slug */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-2">Funnel Name</label>
            <input
              type="text"
              value={name}
              onChange={e => {
                setName(e.target.value)
                if (isNew) setSlug(autoSlug(e.target.value))
              }}
              placeholder="e.g. Free Consultation"
              className="w-full bg-stone-100 border border-stone-200 rounded-lg px-4 py-2.5 text-sm text-[#1A1A1A] placeholder-stone-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-2">
              <Globe size={11} className="inline mr-1" />
              URL Slug
            </label>
            <div className="flex items-center bg-stone-100 border border-stone-200 rounded-lg overflow-hidden focus-within:border-blue-500">
              <span className="pl-3 text-stone-400 text-xs shrink-0">/f/</span>
              <input
                type="text"
                value={slug}
                onChange={e => setSlug(autoSlug(e.target.value))}
                placeholder="free-consultation"
                className="flex-1 bg-transparent px-2 py-2.5 text-sm text-[#1A1A1A] placeholder-stone-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Active toggle */}
        <div className="flex items-center justify-between bg-stone-100 border border-stone-200 rounded-lg px-4 py-3">
          <div>
            <p className="text-sm font-medium text-[#1A1A1A]">Live</p>
            <p className="text-xs text-stone-500">Anyone with the link can submit</p>
          </div>
          <button
            onClick={() => setIsActive(v => !v)}
            className={`relative w-10 h-6 rounded-full transition-colors ${isActive ? 'bg-blue-500' : 'bg-stone-300'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isActive ? 'left-5' : 'left-1'}`} />
          </button>
        </div>

        <hr className="border-stone-200" />
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Page Content</p>

        {/* Headline */}
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-2">Headline</label>
          <input
            type="text"
            value={headline}
            onChange={e => setHeadline(e.target.value)}
            placeholder="Stop guessing. Start transforming."
            className="w-full bg-stone-100 border border-stone-200 rounded-lg px-4 py-2.5 text-sm text-[#1A1A1A] placeholder-stone-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Subheadline */}
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-2">Subheadline</label>
          <input
            type="text"
            value={subheadline}
            onChange={e => setSubheadline(e.target.value)}
            placeholder="A short supporting line under the headline"
            className="w-full bg-stone-100 border border-stone-200 rounded-lg px-4 py-2.5 text-sm text-[#1A1A1A] placeholder-stone-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Body */}
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-2">Body Copy</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Describe what they'll get, who it's for, what happens next..."
            rows={6}
            className="w-full bg-stone-100 border border-stone-200 rounded-lg px-4 py-3 text-sm text-[#1A1A1A] placeholder-stone-400 focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        {/* CTA */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-2">Button Label</label>
            <input
              type="text"
              value={ctaLabel}
              onChange={e => setCtaLabel(e.target.value)}
              placeholder="Book a Free Call"
              className="w-full bg-stone-100 border border-stone-200 rounded-lg px-4 py-2.5 text-sm text-[#1A1A1A] placeholder-stone-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-2">After Submit</label>
            <div className="relative">
              <select
                value={redirectTo}
                onChange={e => setRedirectTo(e.target.value)}
                className="w-full appearance-none bg-stone-100 border border-stone-200 rounded-lg px-4 py-2.5 pr-8 text-sm text-[#1A1A1A] focus:outline-none focus:border-blue-500"
              >
                {REDIRECT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="pt-2">
          <button
            onClick={save}
            disabled={saving}
            className="bg-blue-500 hover:bg-blue-500 disabled:opacity-50 text-stone-50 text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : isNew ? 'Create Funnel' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
