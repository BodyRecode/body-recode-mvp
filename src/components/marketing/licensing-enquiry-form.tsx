'use client'

import { useState } from 'react'
import { brand, coach } from "@/config/tenant";

const BLUE = '#1B6DFC'
const BLUE_LIGHT = '#5390FF'
const TXT_DIM = '#8A8E9B'
const MONO = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace"

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
          background: 'rgba(27,109,252,0.08)',
          border: '1px solid rgba(27,109,252,0.4)',
          borderRadius: 16,
          padding: 32,
        }}
      >
        <div style={{ width: 28, height: 2, background: BLUE, borderRadius: 2, marginBottom: 16 }} />
        <p
          style={{
            fontFamily: MONO,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.2em',
            color: BLUE_LIGHT,
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          Received
        </p>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>
          Thank you. Your enquiry is in.
        </h3>
        <p style={{ fontSize: 14, color: TXT_DIM, lineHeight: 1.8 }}>
          We will respond within two business days from {coach().email}. If your enquiry is
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
            background: 'rgba(240,68,56,0.10)',
            border: '1px solid rgba(240,68,56,0.35)',
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
            background: BLUE,
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: 14,
            padding: '14px 28px',
            borderRadius: 10,
            border: 'none',
            cursor: status === 'submitting' ? 'wait' : 'pointer',
            opacity: status === 'submitting' ? 0.6 : 1,
            letterSpacing: '0.01em',
            boxShadow: `0 10px 30px -12px ${BLUE}`,
          }}
        >
          {status === 'submitting' ? 'Sending…' : 'Send enquiry'}
        </button>
        <p style={{ fontSize: 12, color: TXT_DIM }}>
          Or email{' '}
          <a href={`mailto:${brand().supportEmail}`} style={{ color: BLUE_LIGHT, textDecoration: 'underline' }}>
            {brand().supportEmail}
                                </a>
        </p>
      </div>

      <style>{`
        .ip-field {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 14px;
          color: #FFFFFF;
          outline: none;
          width: 100%;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .ip-field::placeholder { color: #565A66; }
        .ip-field:focus {
          border-color: ${BLUE};
          box-shadow: 0 0 0 3px rgba(27,109,252,0.18);
        }
        .ip-field option { background: #121419; color: #FFFFFF; }
      `}</style>
    </form>
  )
}

/* ---------- Field primitives ---------- */

const labelStyle: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.12em',
  color: TXT_DIM,
  textTransform: 'uppercase',
}

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
      <span style={labelStyle}>{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="ip-field"
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
      <span style={labelStyle}>{label}</span>
      <select name={name} className="ip-field" defaultValue="">
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
      <span style={labelStyle}>{label}</span>
      <textarea
        name={name}
        required={required}
        placeholder={placeholder}
        rows={5}
        className="ip-field"
        style={{ fontFamily: 'inherit', resize: 'vertical', minHeight: 120 }}
      />
    </label>
  )
}
