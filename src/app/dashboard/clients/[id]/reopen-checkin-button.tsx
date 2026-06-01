'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  clientId: string
  overrideUntil: string | null
}

/**
 * Coach affordance to reopen a client's weekly check-in window outside the
 * standard Friday 6pm – Sunday 6:30pm Brisbane schedule. Lives in the
 * Weekly Synthesis section header on the client profile.
 *
 * If an override is currently active, shows when it expires + a Close button.
 * If not, shows a Reopen button (24h default, capped server-side at 7 days).
 */
export default function ReopenCheckinButton({ clientId, overrideUntil: initial }: Props) {
  const router = useRouter()
  const [overrideUntil, setOverrideUntil] = useState<string | null>(initial)
  const [pending, setPending] = useState(false)
  const active = overrideUntil ? new Date(overrideUntil).getTime() > Date.now() : false

  async function reopen() {
    setPending(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/reopen-checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'open', hours: 24 }),
      })
      const json = await res.json()
      if (!res.ok) { alert(json.error ?? 'Reopen failed'); return }
      setOverrideUntil(json.client?.checkin_window_override_until ?? null)
      router.refresh()
    } finally { setPending(false) }
  }

  async function close() {
    setPending(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/reopen-checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close' }),
      })
      const json = await res.json()
      if (!res.ok) { alert(json.error ?? 'Close failed'); return }
      setOverrideUntil(null)
      router.refresh()
    } finally { setPending(false) }
  }

  if (active && overrideUntil) {
    const expires = new Date(overrideUntil).toLocaleString('en-AU', {
      timeZone: 'Australia/Brisbane',
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    return (
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700">
          Window open until {expires}
        </span>
        <button
          type="button"
          onClick={close}
          disabled={pending}
          className="text-xs font-medium text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors disabled:opacity-50"
        >
          {pending ? 'Working…' : 'Close'}
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={reopen}
      disabled={pending}
      className="text-xs font-medium px-3 py-1.5 border border-[#E5E5E5] text-[#6B6B6B] rounded-lg hover:border-[#1B6DFC] hover:bg-blue-50 hover:text-[#1B6DFC] transition-colors disabled:opacity-50"
    >
      {pending ? 'Working…' : 'Reopen check-in (24h)'}
    </button>
  )
}
