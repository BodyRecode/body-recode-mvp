'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PACKAGES = [
  { value: 'online', label: 'Online - $149/week', stripe: 'https://buy.stripe.com/aFacN72Ey2GW7MH2915ZC02' },
  { value: '2x', label: 'In-Person 2x - $299/week', stripe: 'https://buy.stripe.com/4gM28t3ICftIff9cNF5ZC00' },
  { value: '3x', label: 'In-Person 3x - $409/week', stripe: 'https://buy.stripe.com/aFabJ3frk0yO8QL6ph5ZC03' },
]

const FOUNDING_PACKAGES = [
  { value: 'online', label: 'Online - $74.50/week (Founding)', stripe: 'https://buy.stripe.com/14A28t0wq5T8aYT8xp5ZC04' },
  { value: '2x', label: 'In-Person 2x - $149.50/week (Founding)', stripe: 'https://buy.stripe.com/4gM4gB3IC4P46IDcNF5ZC05' },
  { value: '3x', label: 'In-Person 3x - $204.50/week (Founding)', stripe: 'https://buy.stripe.com/eVq7sNdjc0yO6ID4h95ZC06' },
]

interface PackageManagerProps {
  clientId: string
  currentPackage?: string
  isFoundingClient?: boolean
  subscriptionLinkSendAt?: string | null
  subscriptionLinkSentAt?: string | null
}

export default function PackageManager({
  clientId,
  currentPackage,
  isFoundingClient,
  subscriptionLinkSendAt,
  subscriptionLinkSentAt,
}: PackageManagerProps) {
  const router = useRouter()
  const [pkg, setPkg] = useState(currentPackage ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduling, setScheduling] = useState(false)
  const [scheduleSaved, setScheduleSaved] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const packages = isFoundingClient ? FOUNDING_PACKAGES : PACKAGES

  const save = async (newPkg: string) => {
    setPkg(newPkg)
    setSaving(true)
    await fetch(`/api/clients/${clientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package: newPkg }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  const copyLink = async () => {
    const found = packages.find(p => p.value === pkg)
    if (!found) return
    const url = `${found.stripe}?client_reference_id=${clientId}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sendLink = async () => {
    setSending(true)
    const res = await fetch(`/api/clients/${clientId}/send-subscription`, { method: 'POST' })
    setSending(false)
    if (res.ok) {
      setSent(true)
      setTimeout(() => setSent(false), 3000)
      router.refresh()
    }
  }

  const scheduleLink = async () => {
    if (!scheduleDate) return
    setScheduling(true)
    // Send at 8am Brisbane time on the selected date
    const sendAt = new Date(`${scheduleDate}T08:00:00+10:00`).toISOString()
    await fetch(`/api/clients/${clientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription_link_send_at: sendAt, subscription_link_sent_at: null }),
    })
    setScheduling(false)
    setScheduleSaved(true)
    setShowSchedule(false)
    setTimeout(() => setScheduleSaved(false), 3000)
    router.refresh()
  }

  const cancelSchedule = async () => {
    setCancelling(true)
    await fetch(`/api/clients/${clientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription_link_send_at: null }),
    })
    setCancelling(false)
    router.refresh()
  }

  const currentInfo = packages.find(p => p.value === pkg)

  const scheduledDate = subscriptionLinkSendAt
    ? new Date(subscriptionLinkSendAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Brisbane' })
    : null

  const alreadySent = !!subscriptionLinkSentAt
  const isScheduled = !!subscriptionLinkSendAt && !alreadySent

  // Default the date picker to today
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Brisbane' })

  return (
    <div className="space-y-3">
      {isFoundingClient && (
        <p className="text-xs text-violet-400 font-semibold">Founding Client rates (50% adjusted)</p>
      )}
      <div className="flex flex-wrap gap-2">
        {packages.map(p => (
          <button
            key={p.value}
            onClick={() => save(p.value)}
            disabled={saving}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
              pkg === p.value
                ? 'bg-teal-500/10 border-teal-500/30 text-teal-400'
                : 'border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {saved && <p className="text-xs text-teal-400">Package updated</p>}

      {currentInfo && (
        <div className="space-y-2">
          {/* Scheduled send indicator */}
          {isScheduled && (
            <div className="flex items-center gap-3 text-xs">
              <span className="text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full">
                Subscription link scheduled for {scheduledDate}
              </span>
              <button
                onClick={cancelSchedule}
                disabled={cancelling}
                className="text-stone-500 hover:text-red-400 transition-colors"
              >
                {cancelling ? 'Cancelling...' : 'Cancel'}
              </button>
            </div>
          )}

          {alreadySent && (
            <div className="text-xs text-stone-500">
              Subscription link sent {new Date(subscriptionLinkSentAt!).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Brisbane' })}
            </div>
          )}

          {scheduleSaved && <p className="text-xs text-amber-400">Send scheduled</p>}

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={sendLink}
              disabled={sending || sent}
              className="text-xs font-bold px-4 py-2 bg-[#10E1C2] text-black rounded-lg hover:bg-[#0ecfb2] transition-colors disabled:opacity-50"
            >
              {sending ? 'Sending...' : sent ? 'Sent!' : 'Send to Client'}
            </button>
            <button
              onClick={copyLink}
              className="text-xs font-bold px-4 py-2 border border-stone-700 text-stone-300 rounded-lg hover:border-stone-500 hover:text-white transition-colors"
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            {!isScheduled && (
              <button
                onClick={() => setShowSchedule(v => !v)}
                className="text-xs font-bold px-4 py-2 border border-stone-700 text-stone-400 rounded-lg hover:border-amber-500/40 hover:text-amber-300 transition-colors"
              >
                Schedule Send
              </button>
            )}
          </div>

          {showSchedule && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="date"
                value={scheduleDate || todayStr}
                min={todayStr}
                onChange={e => setScheduleDate(e.target.value)}
                className="text-xs bg-stone-800 border border-stone-700 text-stone-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500/50"
              />
              <button
                onClick={scheduleLink}
                disabled={scheduling || !scheduleDate}
                className="text-xs font-bold px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-lg hover:bg-amber-500/30 transition-colors disabled:opacity-50"
              >
                {scheduling ? 'Saving...' : 'Confirm'}
              </button>
              <button
                onClick={() => setShowSchedule(false)}
                className="text-xs text-stone-600 hover:text-stone-400 transition-colors"
              >
                Cancel
              </button>
              <span className="text-xs text-stone-600">Will send at 8am Brisbane time</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
