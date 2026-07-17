'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, Link2, Plus, Eye, Ban, RotateCcw } from 'lucide-react'
import { Card, Btn, EmptyState, Pill, MONO_FONT } from '@/components/dashboard/ui'
import { formatDate } from '@/lib/utils'

export type GuestRow = {
  id: string
  name: string
  company: string | null
  note: string | null
  url: string
  created_at: string
  first_opened_at: string | null
  last_seen_at: string | null
  visit_count: number
  revoked: boolean
}

function relTime(iso: string | null): string {
  if (!iso) return 'Not opened yet'
  const then = new Date(iso).getTime()
  const mins = Math.round((Date.now() - then) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(iso)
}

export default function PartnerRoomAdmin({ initialGuests }: { initialGuests: GuestRow[] }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  async function addGuest(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/partner-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, company, note }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create link')
      setName('')
      setCompany('')
      setNote('')
      // Copy the fresh link straight to the clipboard for convenience.
      try {
        await navigator.clipboard.writeText(data.url)
        setCopiedId(data.id)
        setTimeout(() => setCopiedId((c) => (c === data.id ? null : c)), 2500)
      } catch {
        /* clipboard may be blocked; the link still shows in the list */
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  async function copyLink(g: GuestRow) {
    try {
      await navigator.clipboard.writeText(g.url)
      setCopiedId(g.id)
      setTimeout(() => setCopiedId((c) => (c === g.id ? null : c)), 2000)
    } catch {
      setError('Could not copy — select the link and copy it manually.')
    }
  }

  async function toggleRevoke(g: GuestRow) {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/partner-room/${g.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: g.revoked ? 'restore' : 'revoke' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update')
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const inputCls =
    'w-full text-[14px] px-3.5 py-2.5 rounded-lg bg-[#FFFFFF] border border-[#E5E5E5] text-[#1A1A1A] placeholder:text-[#B0B0B0] focus:outline-none focus:border-[#1B6DFC] transition-colors'

  return (
    <div className="grid gap-8">
      {/* Add a guest */}
      <Card padding="lg" accent="blue">
        <p
          className="text-[11px] font-bold uppercase mb-4"
          style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em', color: '#1B6DFC' }}
        >
          New guest link
        </p>
        <form onSubmit={addGuest} className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[12px] font-medium text-[#4A4A4A] mb-1.5">Name</label>
              <input
                className={inputCls}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Zac"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#4A4A4A] mb-1.5">
                Company <span className="text-[#B0B0B0]">(optional)</span>
              </label>
              <input
                className={inputCls}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Where they're from"
              />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[#4A4A4A] mb-1.5">
              Private note <span className="text-[#B0B0B0]">(optional, only you see this)</span>
            </label>
            <input
              className={inputCls}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="How you know them, context for later"
            />
          </div>
          <div className="flex items-center gap-3 mt-1">
            <Btn type="submit" variant="primary" icon={Plus} disabled={busy || !name.trim()}>
              {busy ? 'Creating…' : 'Create link'}
            </Btn>
            <span className="text-[12px] text-[#999999]">
              We&rsquo;ll copy the link to your clipboard automatically.
            </span>
          </div>
          {error && <p className="text-[13px] text-[#DC2626] mt-1">{error}</p>}
        </form>
      </Card>

      {/* Guest list */}
      <div>
        <p
          className="text-[11px] font-bold uppercase mb-4"
          style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em', color: '#6B6B6B' }}
        >
          Guests ({initialGuests.length})
        </p>

        {initialGuests.length === 0 ? (
          <Card padding="none">
            <EmptyState
              icon={Link2}
              title="No guest links yet"
              hint="Add someone above to mint their private room link"
            />
          </Card>
        ) : (
          <div className="grid gap-2.5">
            {initialGuests.map((g) => (
              <Card key={g.id} padding="md" hover>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <p className="text-[15px] font-semibold text-[#1A1A1A]">{g.name}</p>
                      {g.company && <span className="text-[13px] text-[#999999]">{g.company}</span>}
                      {g.revoked ? (
                        <Pill accent="red">Revoked</Pill>
                      ) : g.visit_count > 0 ? (
                        <Pill accent="teal">Active</Pill>
                      ) : (
                        <Pill accent="neutral">Not opened</Pill>
                      )}
                    </div>
                    {g.note && <p className="text-[12px] text-[#999999] mt-1.5 truncate">{g.note}</p>}

                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      <span
                        className="inline-flex items-center gap-1.5 text-[12px] text-[#6B6B6B]"
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                        title="Times opened"
                      >
                        <Eye size={13} className="text-[#999999]" />
                        {g.visit_count} {g.visit_count === 1 ? 'view' : 'views'}
                      </span>
                      <span className="text-[12px] text-[#999999]">Last: {relTime(g.last_seen_at)}</span>
                      <span className="text-[12px] text-[#999999]">Added {formatDate(g.created_at)}</span>
                    </div>

                    {/* The link */}
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <code
                        className="text-[12px] text-[#4A4A4A] bg-[#F4F4F4] border border-[#E5E5E5] rounded-md px-2.5 py-1.5 max-w-full truncate"
                        style={{ fontFamily: MONO_FONT }}
                        title={g.url}
                      >
                        {g.url.replace(/^https?:\/\//, '')}
                      </code>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Btn
                      onClick={() => copyLink(g)}
                      variant={copiedId === g.id ? 'primary' : 'secondary'}
                      size="sm"
                      icon={copiedId === g.id ? Check : Copy}
                    >
                      {copiedId === g.id ? 'Copied' : 'Copy link'}
                    </Btn>
                    <Btn
                      onClick={() => toggleRevoke(g)}
                      variant={g.revoked ? 'secondary' : 'caution'}
                      size="sm"
                      icon={g.revoked ? RotateCcw : Ban}
                      disabled={busy}
                    >
                      {g.revoked ? 'Restore' : 'Revoke'}
                    </Btn>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
