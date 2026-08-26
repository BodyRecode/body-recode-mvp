'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Send, X, AlertTriangle, Clock } from 'lucide-react'
import type { ReassessmentTriggerRow } from '@/lib/reassessment-triggers'

/**
 * Open reassessment triggers for one client.
 *
 * The point of this panel is that a trigger cannot leave the screen without a
 * decision. Sending a Progress Check closes it; dismissing closes it but demands
 * a written reason. Before this existed the same signal was rendered as a passive
 * pill that could be scrolled past indefinitely.
 */
export default function ReassessmentTriggersPanel({
  triggers,
  clientEmail,
  reasonLabels,
  overdueAfterDays,
}: {
  triggers: ReassessmentTriggerRow[]
  clientEmail?: string | null
  reasonLabels: Record<string, string>
  overdueAfterDays: number
}) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [dismissingId, setDismissingId] = useState<string | null>(null)
  const [note, setNote] = useState('')

  if (!triggers.length) return null

  const now = Date.now()
  const ageDays = (iso: string) => Math.floor((now - new Date(iso).getTime()) / 86_400_000)

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
    <div className="bg-white border border-[#E8EAEE] rounded-xl p-6 mb-6">
      <div className="flex items-center gap-2.5 mb-1">
        <span className="w-7 h-[3px] rounded-full bg-[#1B6DFC]" />
        <h2 className="text-[11px] font-medium text-[#141821] tracking-[0.14em]">
          Reassessment queue
        </h2>
      </div>
      <p className="text-sm text-[#666D7A] mb-5">
        {triggers.length} open. Each stays here until you send a Progress Check or dismiss it with a reason.
      </p>

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <ul className="space-y-3">
        {triggers.map((t) => {
          const age = ageDays(t.fired_at)
          const overdue = age > overdueAfterDays
          const busy = busyId === t.id
          return (
            <li
              key={t.id}
              className="border rounded-xl p-4"
              style={{ borderColor: overdue ? '#F5C6C6' : '#E8EAEE', background: overdue ? '#FEF7F7' : '#FFFFFF' }}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-bold text-[#141821]">
                      {reasonLabels[t.reason] ?? t.reason}
                    </span>
                    {t.trigger_class === 'deterministic' ? (
                      <span className="text-[11.5px] font-mediumr px-2 py-0.5 rounded-full bg-[#F4F6F9] text-[#666D7A]">
                        Scheduled
                      </span>
                    ) : (
                      <span className="text-[11.5px] font-mediumr px-2 py-0.5 rounded-full bg-blue-50 text-[#1B6DFC]">
                        Signal
                      </span>
                    )}
                    {overdue && (
                      <span className="inline-flex items-center gap-1 text-[11.5px] font-mediumr px-2 py-0.5 rounded-full bg-[#FEE7E7] text-[#DC2626]">
                        <AlertTriangle size={11} /> Overdue
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#43474F] leading-relaxed">{t.message}</p>
                  <p className="text-[12.5px] text-[#98A0AD] mt-1.5 inline-flex items-center gap-1">
                    <Clock size={11} />
                    {age === 0 ? 'Fired today' : age === 1 ? 'Open 1 day' : `Open ${age} days`}
                    {' · suggests a '}
                    {t.recommended_depth === 'full' ? 'full re-intake' : t.recommended_depth === 'delta' ? 'Progress Check' : 'lightweight re-read'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      if (!clientEmail) {
                        setError('No email on file for this client.')
                        return
                      }
                      if (!confirm('Email this client a Progress Check now? It is a short re-assessment, about five minutes.')) return
                      resolve(t.id, 'send_progress_check')
                    }}
                    disabled={busy}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[12.5px] font-medium text-white bg-[#1B6DFC] hover:bg-[#5390FF] disabled:opacity-60 transition-colors"
                  >
                    {busy ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    Send Progress Check
                  </button>
                  <button
                    onClick={() => setDismissingId(dismissingId === t.id ? null : t.id)}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-medium border border-[#E8EAEE] text-[#43474F] hover:border-[#CFD4DC] disabled:opacity-60 transition-colors"
                  >
                    <X size={13} /> Dismiss
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
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    placeholder="e.g. Spoke to her Friday, the amber week was a work trip and she is back to normal."
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
