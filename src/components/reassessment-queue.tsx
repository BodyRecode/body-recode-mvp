'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Send, X, AlertTriangle } from 'lucide-react'
import type { DigestRow } from '@/lib/reassessment-digest'

/**
 * Roster-level reassessment queue.
 *
 * The per-client panel is not enough on its own: it only helps once you have
 * already decided to open that client. This is the view the Monday digest links
 * to, and the whole point of the mechanism is that you should not have to go
 * looking client by client to find outstanding work.
 *
 * Overdue items sort to the top and stay visually louder the longer they sit.
 */
export default function ReassessmentQueue({
  rows,
  reasonLabels,
  overdueAfterDays,
}: {
  rows: (DigestRow & { client_email?: string | null })[]
  reasonLabels: Record<string, string>
  overdueAfterDays: number
}) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [dismissingId, setDismissingId] = useState<string | null>(null)
  const [note, setNote] = useState('')

  const now = Date.now()
  const ageDays = (iso: string) => Math.floor((now - new Date(iso).getTime()) / 86_400_000)

  if (!rows.length) {
    return (
      <div className="bg-[#FFFFFF] border border-[#E8EAEE] rounded-xl p-5 mb-7">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="w-7 h-[3px] rounded-full bg-[#1B6DFC]" />
          <h2 className="text-[11px] font-medium text-[#141821]">
            Reassessment queue
          </h2>
        </div>
        <p className="text-sm text-[#666D7A]">
          Nothing open. Signals are being monitored weekly; anything that crosses a threshold will appear here.
        </p>
      </div>
    )
  }

  // Overdue first, then oldest first within each group.
  const sorted = [...rows].sort((a, b) => {
    const ao = ageDays(a.fired_at) > overdueAfterDays ? 1 : 0
    const bo = ageDays(b.fired_at) > overdueAfterDays ? 1 : 0
    if (ao !== bo) return bo - ao
    return new Date(a.fired_at).getTime() - new Date(b.fired_at).getTime()
  })

  const overdueCount = sorted.filter(r => ageDays(r.fired_at) > overdueAfterDays).length

  async function resolve(triggerId: string, action: 'send_progress_check' | 'dismiss', reason?: string) {
    setBusyId(triggerId)
    setError('')
    try {
      const res = await fetch('/api/reassessment-triggers/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggerId, action, note: reason }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Server returned ${res.status}`)
      if (data.warning) setError(data.warning)
      setDismissingId(null)
      setNote('')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="bg-[#FFFFFF] border border-[#E8EAEE] rounded-xl p-5 mb-7">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-[3px] rounded-full bg-[#1B6DFC]" />
          <h2 className="text-[11px] font-medium text-[#141821]">
            Reassessment queue
          </h2>
        </div>
        {overdueCount > 0 && (
          <span className="inline-flex items-center gap-1 text-[11.5px] font-mediumr px-2 py-0.5 rounded-full bg-[#FEE7E7] text-[#DC2626]">
            <AlertTriangle size={11} /> {overdueCount} overdue
          </span>
        )}
      </div>
      <p className="text-sm text-[#666D7A] mb-4">
        {sorted.length} open. Each stays here until you send a Progress Check or dismiss it with a reason.
      </p>

      {error && (
        <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <ul className="space-y-2">
        {sorted.map(t => {
          const age = ageDays(t.fired_at)
          const overdue = age > overdueAfterDays
          const busy = busyId === t.id
          return (
            <li
              key={t.id}
              className="border rounded-xl px-4 py-3"
              style={{ borderColor: overdue ? '#F5C6C6' : '#E8EAEE', background: overdue ? '#FEF7F7' : '#FFFFFF' }}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <Link
                      href={`/dashboard/clients/${t.client_id}`}
                      className="text-sm font-bold text-[#141821] hover:text-[#1B6DFC] transition-colors"
                    >
                      {t.client_name}
                    </Link>
                    <span className="text-sm text-[#666D7A]">{reasonLabels[t.reason] ?? t.reason}</span>
                    {t.trigger_class === 'deterministic' ? (
                      <span className="text-[11.5px] font-mediumr px-2 py-0.5 rounded-full bg-[#F4F6F9] text-[#666D7A]">
                        Scheduled
                      </span>
                    ) : (
                      <span className="text-[11.5px] font-mediumr px-2 py-0.5 rounded-full bg-blue-50 text-[#1B6DFC]">
                        Signal
                      </span>
                    )}
                  </div>
                  <p className="text-[12.5px] text-[#98A0AD]">
                    {age === 0 ? 'Fired today' : age === 1 ? 'Open 1 day' : `Open ${age} days`}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      if (!t.client_email) { setError(`No email on file for ${t.client_name}.`); return }
                      if (!confirm(`Email ${t.client_name} a Progress Check now?`)) return
                      resolve(t.id, 'send_progress_check')
                    }}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-medium text-white bg-[#1B6DFC] hover:bg-[#5390FF] disabled:opacity-60 transition-colors"
                  >
                    {busy ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                    Send
                  </button>
                  <button
                    onClick={() => setDismissingId(dismissingId === t.id ? null : t.id)}
                    disabled={busy}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12.5px] font-medium border border-[#E8EAEE] text-[#43474F] hover:border-[#CFD4DC] disabled:opacity-60 transition-colors"
                  >
                    <X size={12} /> Dismiss
                  </button>
                </div>
              </div>

              {dismissingId === t.id && (
                <div className="mt-3 pt-3 border-t border-[#E8EAEE]">
                  <label className="block text-[12.5px] font-medium text-[#141821] mb-1.5">
                    Why are you dismissing this? Required.
                  </label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    rows={2}
                    placeholder="e.g. Spoke to her Friday, the amber week was a work trip."
                    className="w-full text-sm border border-[#E8EAEE] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1B6DFC]"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => resolve(t.id, 'dismiss', note)}
                      disabled={busy || note.trim().length < 3}
                      className="px-3.5 py-2 rounded-lg text-[12.5px] font-medium text-white bg-[#141821] hover:bg-[#3A3A3A] disabled:opacity-40 transition-colors"
                    >
                      {busy ? 'Saving…' : 'Confirm dismissal'}
                    </button>
                    <button
                      onClick={() => { setDismissingId(null); setNote('') }}
                      className="px-3 py-2 rounded-lg text-[12.5px] font-medium text-[#666D7A] hover:text-[#141821]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
