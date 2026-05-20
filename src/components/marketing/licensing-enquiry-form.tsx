'use client'

import { useState } from 'react'

const TEAL = '#1B6DFC'

const ENVIRONMENTS = [
  'Performance Coaching',
  'Executive / Corporate',
  'Military / Tactical',
  'Clinical / Allied Health',
  'Education / Youth',
  'Other',
] as const

const INTENTS = [
  'License the system in my practice',
  'White-label under our brand',
  'Integrate with an existing workflow',
  'Exploring options',
] as const

type Status = 'idle' | 'submitting' | 'success' | 'error'

export default function LicensingEnquiryForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('submitting')
    setErrorMsg(null)

    const formData = new FormData(event.currentTarget)
    const payload = {
      name: String(formData.get('name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      organisation: String(formData.get('organisation') || '').trim(),
      role: String(formData.get('role') || '').trim(),
      environment: String(formData.get('environment') || '').trim(),
      intent: String(formData.get('intent') || '').trim(),
      message: String(formData.get('message') || '').trim(),
    }

    if (!payload.name || !payload.email || !payload.message) {
      setStatus('error')
      setErrorMsg('Name, email and a short message are required.')
      return
    }

    try {
      const res = await fetch('/api/licensing-enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Could not submit. Please try again.')
      }
      setStatus('success')
      ;(event.target as HTMLFormElement).reset()
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Could not submit.')
    }
  }

  if (status === 'success') {
    return (
      <div
        style={{
          background: 'rgba(16, 225, 194, 0.06)',
          border: '1px solid rgba(16, 225, 194, 0.3)',
          borderRadius: 16,
          padding: 32,
        }}
      >
        <div style={{ width: 32, height: 3, background: TEAL, borderRadius: 2, marginBottom: 16 }} />
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.18em',
            color: TEAL,
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          Received
        </p>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', marginBottom: 12 }}>
          Thank you. Your enquiry is in.
        </h3>
        <p style={{ fontSize: 14, color: '#6B6B6B', lineHeight: 1.8 }}>
          We will respond within two business days from kade@bodyrecode.au. If your enquiry is
          time-sensitive, reply directly to that email.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <Field label="Name *" name="name" type="text" required autoComplete="name" />
        <Field label="Email *" name="email" type="email" required autoComplete="email" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <Field label="Organisation" name="organisation" type="text" autoComplete="organization" />
        <Field label="Role" name="role" type="text" autoComplete="organization-title" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <SelectField label="Environment of interest" name="environment" options={ENVIRONMENTS as unknown as string[]} />
        <SelectField label="Intent" name="intent" options={INTENTS as unknown as string[]} />
      </div>
      <TextareaField
        label="What are you trying to solve? *"
        name="message"
        required
        placeholder="A few sentences on the population, the problem and the timeline."
      />

      {status === 'error' && errorMsg && (
        <p
          style={{
            fontSize: 13,
            color: '#fca5a5',
            background: '#2d0d0d',
            border: '1px solid #DC262633',
            padding: '10px 14px',
            borderRadius: 10,
          }}
        >
          {errorMsg}
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, marginTop: 8 }}>
        <button
          type="submit"
          disabled={status === 'submitting'}
          style={{
            background: TEAL,
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: 14,
            padding: '14px 28px',
            borderRadius: 10,
            border: 'none',
            cursor: status === 'submitting' ? 'wait' : 'pointer',
            opacity: status === 'submitting' ? 0.6 : 1,
            letterSpacing: '0.01em',
          }}
        >
          {status === 'submitting' ? 'Sending…' : 'Send enquiry'}
        </button>
        <p style={{ fontSize: 12, color: '#999999' }}>
          Or email{' '}
          <a href="mailto:info@bodyrecode.au" style={{ color: '#6B6B6B', textDecoration: 'underline' }}>
            info@bodyrecode.au
          </a>
        </p>
      </div>
    </form>
  )
}

/* ---------- Field primitives ---------- */

function Field({
  label,
  name,
  type,
  required,
  autoComplete,
}: {
  label: string
  name: string
  type: string
  required?: boolean
  autoComplete?: string
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.12em',
          color: '#6B6B6B',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        style={fieldInputStyle}
      />
    </label>
  )
}

function SelectField({
  label,
  name,
  options,
}: {
  label: string
  name: string
  options: string[]
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.12em',
          color: '#6B6B6B',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      <select name={name} style={fieldInputStyle} defaultValue="">
        <option value="" disabled>
          Select…
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  )
}

function TextareaField({
  label,
  name,
  required,
  placeholder,
}: {
  label: string
  name: string
  required?: boolean
  placeholder?: string
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.12em',
          color: '#6B6B6B',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      <textarea
        name={name}
        required={required}
        placeholder={placeholder}
        rows={5}
        style={{ ...fieldInputStyle, fontFamily: 'inherit', resize: 'vertical', minHeight: 120 }}
      />
    </label>
  )
}

const fieldInputStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E5E5E5',
  borderRadius: 10,
  padding: '12px 14px',
  fontSize: 14,
  color: '#3A3A3A',
  outline: 'none',
  width: '100%',
}
