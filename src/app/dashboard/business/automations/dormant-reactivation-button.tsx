'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Users, X, AlertTriangle } from 'lucide-react'

interface Preview {
  name: string
  email: string
  state: string
  pattern: string
  touch1_subject: string
  touch2_sms: string
  touch3_subject: string
}

interface DryRun {
  totalDormant: number
  wouldSend: number
  excludedCount: number
  excludedByReason: Record<string, number>
  preview: Preview[]
}

/**
 * Dormant reactivation, as a button rather than a curl.
 *
 * Built 2026-08-13 because the send had been sitting behind a browser-console
 * fetch, which is a developer's tool and Kade is not a developer. He should not
 * need devtools to run his own marketing. Same two-step safety as the API: look
 * at who would get it, then confirm.
 */
export default function DormantReactivationButton() {
  const router = useRouter()
  const [dry, setDry] = useState<DryRun | null>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function preview() {
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/admin/dormant-reactivation')
      if (!res.ok) throw new Error(`Preview failed (${res.status})`)
      setDry(await res.json())
      setOpen(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Preview failed')
    }
    setBusy(false)
  }

  async function send() {
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/admin/dormant-reactivation?confirm=1', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `Send failed (${res.status})`)
      setSent(json.enqueued ?? 0)
      setOpen(false)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Send failed')
    }
    setBusy(false)
  }

  return (
    <div className="mb-6 rounded-xl border border-[#B5CFFC] bg-blue-50/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-[#141821] flex items-center gap-1.5">
            <Users size={14} className="text-[#1B6DFC]" /> Dormant Lead Reactivation
          </p>
          <p className="text-[13px] text-[#4A4A4A] leading-relaxed mt-1 max-w-xl">
            Leads who did a scorecard and were never followed up. Sends their read, an SMS four days
            later, then the next step that matches their state. Anyone who replies drops out.
          </p>
          {sent !== null && (
            <p className="text-[13px] font-bold text-green-700 mt-2">
              Sent. {sent} leads are now in the sequence.
            </p>
          )}
          {error && <p className="text-[13px] font-bold text-red-700 mt-2">{error}</p>}
        </div>
        <button
          onClick={preview}
          disabled={busy}
          className="shrink-0 inline-flex items-center gap-1.5 text-[13px] font-bold px-4 py-2 bg-[#1B6DFC] text-white rounded-lg hover:bg-[#5390FF] transition-colors disabled:opacity-50"
        >
          <Send size={13} /> {busy ? 'Working...' : 'See who gets it'}
        </button>
      </div>

      {open && dry && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E8EAEE]">
              <p className="text-[14px] font-bold">Who would receive this</p>
              <button onClick={() => setOpen(false)} className="text-[#98A0AD] hover:text-[#141821]"><X size={16} /></button>
            </div>

            <div className="px-5 py-4 border-b border-[#E8EAEE]">
              <p className="text-[15px]">
                <b className="text-[#1B6DFC] text-[22px]">{dry.wouldSend}</b> leads would receive it.
                <span className="text-[#666D7A]"> {dry.excludedCount} excluded of {dry.totalDormant} dormant.</span>
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                {Object.entries(dry.excludedByReason).map(([reason, n]) => (
                  <span key={reason} className="text-[12px] text-[#666D7A]">{n} · {reason}</span>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3">
              <table className="w-full text-[12.5px]">
                <thead><tr className="text-left text-[#98A0AD] text-[11px]">
                  <th className="pb-2">Lead</th><th className="pb-2">Read</th><th className="pb-2">First email</th>
                </tr></thead>
                <tbody>
                  {dry.preview.map(p => (
                    <tr key={p.email} className="border-t border-[#F4F4F4]">
                      <td className="py-2 pr-3"><b>{p.name}</b><br /><span className="text-[#98A0AD]">{p.email}</span></td>
                      <td className="py-2 pr-3">{p.state?.replace(' State', '')}<br /><span className="text-[#98A0AD]">{p.pattern}</span></td>
                      <td className="py-2">{p.touch1_subject}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3.5 border-t border-[#E8EAEE] flex items-center justify-between gap-3">
              <p className="text-[12px] text-[#666D7A] flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-[#B7791F]" /> This sends real emails. It cannot be undone.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setOpen(false)} className="text-[13px] font-semibold px-4 py-2 border border-[#E8EAEE] rounded-lg hover:bg-[#F4F6F9]">
                  Not yet
                </button>
                <button onClick={send} disabled={busy}
                  className="text-[13px] font-bold px-4 py-2 bg-[#1B6DFC] text-white rounded-lg hover:bg-[#5390FF] disabled:opacity-50">
                  {busy ? 'Sending...' : `Send to ${dry.wouldSend}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
