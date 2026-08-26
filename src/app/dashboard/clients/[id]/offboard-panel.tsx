'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { parseApiResponse } from '@/lib/parse-api-response'
import { END_REASONS, RETENTION_YEARS, type EndReason } from '@/lib/offboard-client'

/**
 * Ending an engagement, as one action.
 *
 * Before this it took six hand-written database statements and there was no
 * record of why anyone left. `clients.active = false` looked like the switch and
 * did almost nothing: it does not gate the portal, and eleven of the twelve
 * scheduled jobs that email clients ignore it. A coach could set it, believe
 * contact had stopped, and have the system keep emailing a client who had quit.
 */
export default function OffboardPanel({
  clientId, clientName, endedAt, endReason, retainUntil,
}: {
  clientId: string
  clientName: string
  endedAt: string | null
  endReason: string | null
  retainUntil: string | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<EndReason | ''>('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [steps, setSteps] = useState<{ step: string; done: boolean; detail?: string }[] | null>(null)

  const firstName = clientName.split(' ')[0] || 'this client'

  if (endedAt) {
    const label = END_REASONS.find(r => r.value === endReason)?.label ?? endReason ?? 'not recorded'
    return (
      <div className="rounded-xl border border-[#E8EAEE] bg-[#F4F6F9] p-5">
        <p className="text-sm font-semibold text-[#141821]">Engagement ended</p>
        <p className="text-[12.5px] text-[#666D7A] mt-1">
          {new Date(endedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })} · {label}
        </p>
        {retainUntil && (
          <p className="text-[12.5px] text-[#666D7A] mt-2">
            Records retained until <strong>{new Date(retainUntil).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
            Nothing has been deleted.
          </p>
        )}
        <p className="text-[12.5px] text-[#666D7A] mt-2">
          Portal access revoked, login banned, automated contact stopped, email suppressed.
          Their full profile is unchanged and still open to you. Reinstating means clearing
          ended_at, which is done in the database deliberately rather than as a button.
        </p>
      </div>
    )
  }

  async function submit() {
    if (!reason) { setError('Pick a reason. It is the only part of this you will care about later.'); return }
    if (!confirm(
      `End the engagement with ${firstName}?\n\n` +
      `This revokes their portal access, bans their login, stops every automated email, ` +
      `and suppresses their email address.\n\n` +
      `Their full profile stays intact and visible to you. Nothing is deleted or archived. ` +
      `Records are retained for ${RETENTION_YEARS} years.`
    )) return

    setBusy(true); setError(null)
    try {
      const res = await fetch(`/api/clients/${clientId}/offboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, notes }),
      })
      const { ok, data, error: apiError } = await parseApiResponse<{ steps?: typeof steps; error?: string }>(res)
      if (!ok) { setError(apiError || data?.error || 'Could not complete'); setSteps(data?.steps ?? null); return }
      setSteps(data?.steps ?? null)
      router.refresh()
    } finally { setBusy(false) }
  }

  return (
    <div className="rounded-xl border border-[#E8EAEE] bg-white p-5">
      {!open ? (
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#141821]">End engagement</p>
            <p className="text-[12.5px] text-[#666D7A] mt-1">
              Revokes their access and stops all automated contact. Their profile stays intact and
            open to you. Records kept for {RETENTION_YEARS} years.
            </p>
          </div>
          <button onClick={() => setOpen(true)} className="flex-none px-4 py-2 rounded-lg text-[12.5px] font-medium bg-[#EFF1F4] text-[#141821] hover:bg-[#E8EAEE] transition-colors">
            Offboard
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-[#141821]">End engagement with {firstName}</p>

          <div>
            <label className="block text-[12.5px] font-medium text-[#666D7A] mb-1.5">Reason</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value as EndReason)}
              className="w-full bg-[#F4F6F9] border border-[#E8EAEE] rounded-md px-3 py-2 text-sm"
            >
              <option value="">- Select -</option>
              {END_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            {reason && <p className="text-[12.5px] text-[#666D7A] mt-1.5">{END_REASONS.find(r => r.value === reason)?.hint}</p>}
          </div>

          <div>
            <label className="block text-[12.5px] font-medium text-[#666D7A] mb-1.5">
              What happened <span className="font-normal normal-case text-[#98A0AD]">(worth more than the reason code)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
              placeholder="In your words. What they said, what you would do differently, anything a future you should know."
              className="w-full bg-[#F4F6F9] border border-[#E8EAEE] rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div className="rounded-lg bg-[#FBFCFD] border border-[#E8EAEE] p-3">
            <p className="text-[12.5px] font-semibold text-[#141821] mb-1.5">This will:</p>
            <ul className="text-[12.5px] text-[#666D7A] space-y-0.5 list-disc pl-4">
              <li>Close their portal and rotate the link so old bookmarks stop working</li>
              <li>Ban their login</li>
              <li>Stop every automated email: check-ins, log nudges, block-end, reminders</li>
              <li>Suppress their email address</li>
              <li>Record the date, reason and retention deadline</li>
            </ul>
            <p className="text-[12.5px] text-[#666D7A] mt-2">
              Their plans, readings, photos, messages and history stay exactly as they are in their
              profile, and you can still open all of it. Nothing is deleted or archived. Records are
              kept for {RETENTION_YEARS} years.
            </p>
          </div>

          {error && <p className="text-[12.5px] text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}
          {steps && (
            <ul className="text-[12.5px] space-y-1">
              {steps.map((s, i) => (
                <li key={i} className={s.done ? 'text-[#666D7A]' : 'text-amber-700'}>
                  {s.done ? '✓' : '!'} {s.step}{s.detail ? ` — ${s.detail}` : ''}
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-2">
            <button onClick={submit} disabled={busy} className="px-4 py-2 rounded-lg text-[12.5px] font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 transition-colors">
              {busy ? 'Ending…' : 'End engagement'}
            </button>
            <button onClick={() => { setOpen(false); setError(null) }} disabled={busy} className="px-4 py-2 rounded-lg text-[12.5px] font-medium bg-[#F4F6F9] text-[#141821] hover:bg-[#EFF1F4] transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
