'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { parseApiResponse } from '@/lib/parse-api-response'

/**
 * Pause a coaching engagement without ending it. Sibling to OffboardPanel.
 *
 * Same lockout, none of the finality: no token rotation, no retention date,
 * no reason code, no login ban. Unfreeze is a one-click reversal. Use for
 * holidays, saving-up breaks, injury recovery.
 */
export default function FreezePanel({
  clientId, clientName, endedAt, frozenAt, freezeNotes,
}: {
  clientId: string
  clientName: string
  endedAt: string | null
  frozenAt: string | null
  freezeNotes: string | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [steps, setSteps] = useState<{ step: string; done: boolean; detail?: string }[] | null>(null)

  const firstName = clientName.split(' ')[0] || 'this client'

  // If the engagement has ended, freeze is irrelevant. OffboardPanel handles that state.
  if (endedAt) return null

  async function unfreeze() {
    if (!confirm(
      `Unfreeze ${firstName}?\n\n` +
      `Their portal reopens and automated contact resumes. Stripe billing does NOT auto-restart: ` +
      `you will need to send them a fresh payment link when they are ready.`
    )) return

    setBusy(true); setError(null)
    try {
      const res = await fetch(`/api/clients/${clientId}/unfreeze`, { method: 'POST' })
      const { ok, data, error: apiError } = await parseApiResponse<{ steps?: typeof steps; error?: string }>(res)
      if (!ok) { setError(apiError || data?.error || 'Could not complete'); setSteps(data?.steps ?? null); return }
      setSteps(data?.steps ?? null)
      router.refresh()
    } finally { setBusy(false) }
  }

  if (frozenAt) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-5">
        <p className="text-sm font-semibold text-amber-900">Engagement paused</p>
        <p className="text-[12.5px] text-amber-800 mt-1">
          Frozen on {new Date(frozenAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
          {freezeNotes ? ` · ${freezeNotes}` : ''}
        </p>
        <p className="text-[12.5px] text-amber-800 mt-2">
          Portal locked, all automated contact stopped, Stripe subscription cancelled, email suppressed.
          Everything reversible with one click.
        </p>
        {error && <p className="text-[12.5px] text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2 mt-3">{error}</p>}
        {steps && (
          <ul className="text-[12.5px] space-y-1 mt-3">
            {steps.map((s, i) => (
              <li key={i} className={s.done ? 'text-amber-800' : 'text-red-700'}>
                {s.done ? '✓' : '!'} {s.step}{s.detail ? ` · ${s.detail}` : ''}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3">
          <button onClick={unfreeze} disabled={busy} className="px-4 py-2 rounded-lg text-[12.5px] font-medium bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-40 transition-colors">
            {busy ? 'Unfreezing…' : 'Unfreeze'}
          </button>
        </div>
      </div>
    )
  }

  async function freeze() {
    if (!confirm(
      `Pause the engagement with ${firstName}?\n\n` +
      `This locks their portal, stops every automated email, cancels their active Stripe subscription, ` +
      `and suppresses their email address.\n\n` +
      `Nothing is deleted. One-click Unfreeze to bring them back. Stripe billing does not auto-restart: ` +
      `you will send a fresh payment link when they return.`
    )) return

    setBusy(true); setError(null)
    try {
      const res = await fetch(`/api/clients/${clientId}/freeze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
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
            <p className="text-sm font-semibold text-[#141821]">Pause engagement</p>
            <p className="text-[12.5px] text-[#666D7A] mt-1">
              Same lockout as offboarding, none of the finality. Their file stays intact. Reverse in one click.
            </p>
          </div>
          <button onClick={() => setOpen(true)} className="flex-none px-4 py-2 rounded-lg text-[12.5px] font-medium bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors">
            Freeze
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-[#141821]">Pause engagement with {firstName}</p>

          <div>
            <label className="block text-[12.5px] font-medium text-[#666D7A] mb-1.5">
              Why the freeze <span className="font-normal normal-case text-[#98A0AD]">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Saving up, on holiday, surgery recovery. A few words for future you."
              className="w-full bg-[#F4F6F9] border border-[#E8EAEE] rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div className="rounded-lg bg-[#FBFCFD] border border-[#E8EAEE] p-3">
            <p className="text-[12.5px] font-semibold text-[#141821] mb-1.5">This will:</p>
            <ul className="text-[12.5px] text-[#666D7A] space-y-0.5 list-disc pl-4">
              <li>Lock their portal (they see a friendly &quot;on pause&quot; page)</li>
              <li>Stop every automated email: check-ins, log nudges, block-end, reminders</li>
              <li>Cancel any active Stripe subscription (no more weekly charges)</li>
              <li>Suppress their email address</li>
            </ul>
            <p className="text-[12.5px] text-[#666D7A] mt-2">
              Their plans, readings, photos, messages and history are unchanged and still open to you.
              Unfreeze restores the portal and email; Stripe billing needs a fresh payment link when they return.
            </p>
          </div>

          {error && <p className="text-[12.5px] text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}
          {steps && (
            <ul className="text-[12.5px] space-y-1">
              {steps.map((s, i) => (
                <li key={i} className={s.done ? 'text-[#666D7A]' : 'text-amber-700'}>
                  {s.done ? '✓' : '!'} {s.step}{s.detail ? ` · ${s.detail}` : ''}
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-2">
            <button onClick={freeze} disabled={busy} className="px-4 py-2 rounded-lg text-[12.5px] font-medium bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-40 transition-colors">
              {busy ? 'Freezing…' : 'Freeze'}
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
