'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  User as UserIcon, Pause, Heart, Download, Loader2, Check,
} from 'lucide-react'

interface Props {
  clientId: string
  clientName: string
  email: string | null
  phone: string | null
  packageLabel: string | null
  portalToken: string
}

export default function AccountClient({ clientId, clientName, email, phone, packageLabel, portalToken }: Props) {
  return (
    <div className="space-y-4">
      <ContactCard clientId={clientId} email={email} phone={phone} />
      <PauseCard clientId={clientId} clientName={clientName} packageLabel={packageLabel} />
      <ReferCard clientId={clientId} clientName={clientName} />
      <DownloadCard portalToken={portalToken} />
    </div>
  )
}

/* ======================================================================== */

function Section({ icon: Icon, title, description, children }: { icon: typeof UserIcon; title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF] overflow-hidden">
      <div className="flex items-start gap-3 px-5 pt-5">
        <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] border border-[#E5E5E5] flex items-center justify-center shrink-0">
          <Icon size={16} className="text-[#1B6DFC]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-[#1A1A1A] mb-1">{title}</p>
          <p className="text-[12px] text-[#6B6B6B] leading-relaxed">{description}</p>
        </div>
      </div>
      <div className="px-5 pb-5 pt-4">{children}</div>
    </div>
  )
}

/* ======================================================================== */

function ContactCard({ clientId, email, phone }: { clientId: string; email: string | null; phone: string | null }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [emailValue, setEmailValue] = useState(email ?? '')
  const [phoneValue, setPhoneValue] = useState(phone ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dirty = emailValue !== (email ?? '') || phoneValue !== (phone ?? '')

  const save = async () => {
    if (!dirty || saving) return
    setError(null)
    setSaving(true)
    try {
      const res = await fetch('/api/portal/update-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, email: emailValue.trim(), phone: phoneValue.trim() || null }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Server returned ${res.status}`)
      setSaved(true)
      startTransition(() => router.refresh())
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Section icon={UserIcon} title="Contact details" description="Keep these up to date so we can reach you.">
      <div className="space-y-3">
        <div>
          <label className="text-[11px] font-bold text-[#999999] uppercase tracking-widest mb-1.5 block">Email</label>
          <input
            type="email"
            value={emailValue}
            onChange={e => setEmailValue(e.target.value)}
            className="w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl px-3 py-2.5 text-[14px] text-[#1A1A1A] focus:outline-none focus:border-[#D4D4D4]"
          />
          <p className="text-[11px] text-[#999999] mt-1">Changing this also changes the email you sign in with.</p>
        </div>
        <div>
          <label className="text-[11px] font-bold text-[#999999] uppercase tracking-widest mb-1.5 block">Phone</label>
          <input
            type="tel"
            value={phoneValue}
            onChange={e => setPhoneValue(e.target.value)}
            placeholder="+61 ..."
            className="w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl px-3 py-2.5 text-[14px] text-[#1A1A1A] placeholder:text-[#999999] focus:outline-none focus:border-[#D4D4D4]"
          />
        </div>
        {error && <p className="text-[12px] text-[#8A5A14]">{error}</p>}
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="w-full inline-flex items-center justify-center gap-2 bg-[#1B6DFC] text-[#FFFFFF] text-[13px] font-bold py-2.5 rounded-xl hover:bg-[#5390FF] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <Check size={13} /> : null}
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save changes'}
        </button>
      </div>
    </Section>
  )
}

/* ======================================================================== */

function PauseCard({ clientId, clientName, packageLabel }: { clientId: string; clientName: string; packageLabel: string | null }) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [requested, setRequested] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (submitting) return
    if (!confirm('Send a request to your coach to pause coaching? Your coach will reply to confirm timing.')) return
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/portal/request-pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, reason: reason.trim() || null }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Server returned ${res.status}`)
      setRequested(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send')
    } finally {
      setSubmitting(false)
    }
  }

  if (requested) {
    return (
      <Section icon={Pause} title="Pause coaching" description="Request received. Your coach will be in touch.">
        <div className="bg-[rgba(27,109,252,0.08)] border border-[#B5CFFC] rounded-xl px-4 py-3">
          <p className="text-[13px] text-[#1B6DFC]">Your coach has been notified and will reply to confirm.</p>
        </div>
      </Section>
    )
  }

  return (
    <Section
      icon={Pause}
      title="Pause coaching"
      description={packageLabel ? `Currently on ${packageLabel}. Pausing temporarily stops your subscription and protects your spot.` : 'Temporarily stop your coaching engagement and protect your spot for when you return.'}
    >
      <div className="space-y-3">
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Optional. What is prompting the pause?"
          rows={3}
          className="w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl px-3 py-2.5 text-[13px] text-[#1A1A1A] placeholder:text-[#999999] focus:outline-none focus:border-[#D4D4D4] leading-relaxed resize-y"
        />
        {error && <p className="text-[12px] text-[#8A5A14]">{error}</p>}
        <button
          onClick={submit}
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 bg-[#FFFFFF] border border-[#E5E5E5] text-[#3A3A3A] text-[13px] font-bold py-2.5 rounded-xl hover:border-[#1B6DFC] hover:bg-blue-50 hover:text-[#1B6DFC] transition-colors disabled:opacity-40"
        >
          {submitting && <Loader2 size={13} className="animate-spin" />}
          {submitting ? 'Sending request...' : 'Request pause'}
        </button>
      </div>
    </Section>
  )
}

/* ======================================================================== */

function ReferCard({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [name, setName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (submitting) return
    if (!name.trim() || !contactEmail.trim()) {
      setError('Please add a name and email.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/portal/refer-friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, friendName: name.trim(), friendEmail: contactEmail.trim(), note: note.trim() || null }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Server returned ${res.status}`)
      setSent(true)
      setName(''); setContactEmail(''); setNote('')
      setTimeout(() => setSent(false), 4000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Section icon={Heart} title="Refer a friend" description="Know someone who would benefit from this work? Send their details and your coach will reach out personally.">
      <div className="space-y-3">
        <div>
          <label className="text-[11px] font-bold text-[#999999] uppercase tracking-widest mb-1.5 block">Their name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl px-3 py-2.5 text-[14px] text-[#1A1A1A] placeholder:text-[#999999] focus:outline-none focus:border-[#D4D4D4]"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-[#999999] uppercase tracking-widest mb-1.5 block">Their email</label>
          <input
            type="email"
            value={contactEmail}
            onChange={e => setContactEmail(e.target.value)}
            className="w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl px-3 py-2.5 text-[14px] text-[#1A1A1A] placeholder:text-[#999999] focus:outline-none focus:border-[#D4D4D4]"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-[#999999] uppercase tracking-widest mb-1.5 block">Note (optional)</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Why are they a good fit?"
            rows={3}
            className="w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl px-3 py-2.5 text-[13px] text-[#1A1A1A] placeholder:text-[#999999] focus:outline-none focus:border-[#D4D4D4] leading-relaxed resize-y"
          />
        </div>
        {error && <p className="text-[12px] text-[#8A5A14]">{error}</p>}
        {sent && <p className="text-[12px] text-[#1B6DFC]">Thanks. Your coach will reach out to {name || 'them'} this week.</p>}
        <button
          onClick={submit}
          disabled={submitting || !name.trim() || !contactEmail.trim()}
          className="w-full inline-flex items-center justify-center gap-2 bg-[#FFFFFF] border border-[#E5E5E5] text-[#3A3A3A] text-[13px] font-bold py-2.5 rounded-xl hover:border-[#1B6DFC] hover:bg-blue-50 hover:text-[#1B6DFC] transition-colors disabled:opacity-40"
        >
          {submitting && <Loader2 size={13} className="animate-spin" />}
          {submitting ? 'Sending...' : 'Refer'}
        </button>
      </div>
    </Section>
  )
}

/* ======================================================================== */

function DownloadCard({ portalToken }: { portalToken: string }) {
  return (
    <Section icon={Download} title="Download your data" description="Export everything we hold about you as a JSON file. Your intake, baselines, check-ins, readings.">
      <a
        href={`/api/portal/${portalToken}/export`}
        className="w-full inline-flex items-center justify-center gap-2 bg-[#FFFFFF] border border-[#E5E5E5] text-[#3A3A3A] text-[13px] font-bold py-2.5 rounded-xl hover:border-[#1B6DFC] hover:bg-blue-50 hover:text-[#1B6DFC] transition-colors"
      >
        <Download size={13} /> Download my data (JSON)
      </a>
    </Section>
  )
}
