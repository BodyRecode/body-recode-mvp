'use client'

import { useState } from 'react'

type FormState = {
  fullName: string
  email: string
  password: string
  businessName: string
  tenantId: string
  modality: 'strength' | 'yoga'
}

type Result = { tenantId: string; coachId: string; email: string; nextStep: string }

export default function SignupClient() {
  const [form, setForm] = useState<FormState>({
    fullName: '',
    email: '',
    password: '',
    businessName: '',
    tenantId: '',
    modality: 'strength',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/coach/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tenantId: form.tenantId || undefined,
        }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string } & Partial<Result>
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'signup failed')
      setResult({
        tenantId: data.tenantId!,
        coachId: data.coachId!,
        email: data.email!,
        nextStep: data.nextStep!,
      })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <div className="bg-white border border-green-200 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold">✓</div>
          <h2 className="text-xl font-bold text-[#1A1A1A]">Tenant provisioned</h2>
        </div>
        <div className="space-y-3 mb-6">
          <Row label="Tenant ID" value={result.tenantId} />
          <Row label="Coach email" value={result.email} />
          <Row label="Coach UUID" value={result.coachId} mono />
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-[13px] text-blue-900 leading-relaxed">
          <strong>Next step:</strong> {result.nextStep}
        </div>
        <div className="mt-6 flex gap-3">
          <a
            href="/portal/login"
            className="flex-1 text-center px-4 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            Log in as this coach
          </a>
          <button
            onClick={() => {
              setResult(null)
              setForm({
                fullName: '',
                email: '',
                password: '',
                businessName: '',
                tenantId: '',
                modality: 'strength',
              })
            }}
            className="flex-1 px-4 py-3 border border-stone-300 text-stone-700 rounded-lg font-semibold hover:bg-stone-50 transition-colors"
          >
            Sign up another coach
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
      <Field label="Your full name" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} required />
      <Field label="Business name" value={form.businessName} onChange={(v) => setForm({ ...form, businessName: v })} required hint="e.g. 'Melisa Coaching' — used as your brand.name" />
      <Field label="Tenant ID slug" value={form.tenantId} onChange={(v) => setForm({ ...form, tenantId: v })} hint="Optional. Auto-derived from business name if blank." placeholder="melisa-coaching" />
      <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
      <Field label="Password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required hint="Min 8 characters" />

      <div>
        <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-widest mb-1.5">Modality</label>
        <div className="flex gap-2">
          {(['strength', 'yoga'] as const).map((m) => (
            <button
              type="button"
              key={m}
              onClick={() => setForm({ ...form, modality: m })}
              className={`flex-1 py-2 rounded-lg border font-semibold text-[13px] transition-colors ${
                form.modality === m
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-50'
              }`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-900 rounded-lg p-3 text-[13px]">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Provisioning…' : 'Create coach + tenant'}
      </button>
    </form>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
  hint,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  hint?: string
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-widest mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-[14px] focus:outline-none focus:border-blue-500"
      />
      {hint && <p className="text-[11px] text-stone-500 mt-1">{hint}</p>}
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline gap-3">
      <div className="w-28 text-[11px] font-bold text-stone-500 uppercase tracking-widest">{label}</div>
      <div className={`flex-1 text-[13px] text-stone-900 break-all ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  )
}
