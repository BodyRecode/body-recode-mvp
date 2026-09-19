'use client'

import { useCallback, useEffect, useState } from 'react'

interface Invitation {
  id: string
  email: string
  full_name: string
  business_name: string
  product_tier: string
  status: string
  note: string | null
  expires_at: string
  accepted_at: string | null
  created_at: string
}

const STATUS_COLOUR: Record<string, string> = {
  pending: 'bg-[#FDF6E9] text-[#8A6218] border-[#F1DEB8]',
  accepted: 'bg-[#EEF7F0] text-[#2E6B3E] border-[#CFE6D6]',
  revoked: 'bg-[#F4F5F7] text-[#6B6B6B] border-[#E8EAEE]',
  expired: 'bg-[#F4F5F7] text-[#6B6B6B] border-[#E8EAEE]',
}

export default function CoachesClient() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/coach/invitations')
      const d = (await res.json()) as { invitations?: Invitation[] }
      setInvitations(d.invitations ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function invite(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setMessage(null); setSending(true)
    try {
      const res = await fetch('/api/coach/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName, businessName, note: note || null }),
      })
      const d = (await res.json()) as { ok?: boolean; emailed?: boolean; error?: string; invitation?: { acceptUrl: string } }
      if (!res.ok || !d.ok) setError(d.error ?? 'Could not send the invitation.')
      else {
        setMessage(
          d.emailed
            ? `Invitation sent to ${email}. The link lasts 14 days.`
            : `Invitation created, but the email did not send. The link is ${d.invitation?.acceptUrl ?? 'in the list below'} — send it another way.`,
        )
        setEmail(''); setFullName(''); setBusinessName(''); setNote('')
        void load()
      }
    } catch {
      setError('Could not send the invitation.')
    } finally {
      setSending(false)
    }
  }

  async function revoke(id: string) {
    await fetch(`/api/coach/invitations?id=${id}`, { method: 'DELETE' })
    void load()
  }

  const input = 'w-full px-3 py-2.5 rounded-lg border border-[#E8EAEE] text-sm focus:outline-none focus:border-[#1B6DFC]'
  const label = 'block text-[12px] font-semibold text-[#1A1A1A] mb-1.5'

  return (
    <div className="space-y-8">
      <form onSubmit={invite} className="bg-white border border-[#E8EAEE] rounded-xl p-5 space-y-4">
        <p className="text-[13px] text-[#43474F] leading-relaxed">
          They get an email with a link that works once and lasts 14 days. They choose their own password, and they land on an
          empty dashboard: a coach only ever sees their own clients, and nobody sees theirs.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Their name</label>
            <input className={input} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jane Smith" />
          </div>
          <div>
            <label className={label}>Their email</label>
            <input className={input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" />
          </div>
        </div>
        <div>
          <label className={label}>Their business name</label>
          <input className={input} value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Smith Strength" />
        </div>
        <div>
          <label className={label}>Note to yourself <span className="font-normal text-[#98A0AD]">(optional, they never see it)</span></label>
          <input className={input} value={note} onChange={e => setNote(e.target.value)} placeholder="Met at the Newstead session, runs a small studio" />
        </div>
        {error && <p className="text-[13px] text-[#C0392B]">{error}</p>}
        {message && <p className="text-[13px] text-[#2E6B3E]">{message}</p>}
        <button type="submit" disabled={sending} className="px-4 py-2.5 rounded-lg bg-[#1B6DFC] text-white text-sm font-semibold disabled:opacity-60">
          {sending ? 'Sending…' : 'Send invitation'}
        </button>
      </form>

      <div>
        <p className="text-[12.5px] font-semibold text-[#666D7A] mb-3">Invitations</p>
        {loading ? (
          <p className="text-[13px] text-[#98A0AD]">Loading…</p>
        ) : invitations.length === 0 ? (
          <p className="text-[13px] text-[#98A0AD]">None yet.</p>
        ) : (
          <div className="space-y-2">
            {invitations.map(i => (
              <div key={i.id} className="bg-white border border-[#E8EAEE] rounded-xl p-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#141821]">{i.full_name} <span className="font-normal text-[#6B6B6B]">· {i.business_name}</span></p>
                  <p className="text-[12.5px] text-[#6B6B6B]">{i.email}</p>
                  {i.note && <p className="text-[12px] text-[#98A0AD] mt-1">{i.note}</p>}
                  <p className="text-[11.5px] text-[#98A0AD] mt-1">
                    {i.status === 'accepted' && i.accepted_at
                      ? `Accepted ${new Date(i.accepted_at).toLocaleDateString('en-AU')}`
                      : `Expires ${new Date(i.expires_at).toLocaleDateString('en-AU')}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[11px] font-semibold px-2 py-1 rounded-full border ${STATUS_COLOUR[i.status] ?? STATUS_COLOUR.revoked}`}>
                    {i.status}
                  </span>
                  {i.status === 'pending' && (
                    <button onClick={() => revoke(i.id)} className="text-[12px] text-[#C0392B] font-medium">Revoke</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
