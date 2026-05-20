'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { COACHING_PACKAGES } from '@/lib/coaching-packages'

const PACKAGES = COACHING_PACKAGES.map(p => ({
  value: p.value,
  label: `${p.label} - ${p.price}`,
  stripe: p.stripe,
  tier: p.tier,
}))

interface PackageManagerProps {
  clientId: string
  currentPackage?: string
  subscriptionLinkSendAt?: string | null
  subscriptionLinkSentAt?: string | null
}

export default function PackageManager({
  clientId,
  currentPackage,
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

  const packages = PACKAGES

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
  // Non-billing packages have no Stripe link, so the Send / Copy / Schedule
  // controls don't apply. The "Package updated" toast and the section header
  // still render; everything below this is suppressed for contra/comp.
  const isNonBilling = !!currentInfo && !currentInfo.stripe

  const scheduledDate = subscriptionLinkSendAt
    ? new Date(subscriptionLinkSendAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Brisbane' })
    : null

  const alreadySent = !!subscriptionLinkSentAt
  const isScheduled = !!subscriptionLinkSendAt && !alreadySent

  // Default the date picker to today
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Brisbane' })

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div>
          <p className="text-[10px] font-semibold text-[#999999] uppercase tracking-widest mb-1.5">Standard</p>
          <div className="flex flex-wrap gap-2">
            {packages.filter(p => p.tier === 'standard').map(p => (
              <button
                key={p.value}
                onClick={() => save(p.value)}
                disabled={saving}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                  pkg === p.value
                    ? 'bg-teal-500/10 border-teal-500/30 text-teal-400'
                    : 'border-[#E5E5E5] text-[#6B6B6B] hover:border-[#D4D4D4] hover:text-[#e7e5e4]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-amber-500/80 uppercase tracking-widest mb-1.5">Launch Rate (50% off)</p>
          <div className="flex flex-wrap gap-2">
            {packages.filter(p => p.tier === 'launch').map(p => (
              <button
                key={p.value}
                onClick={() => save(p.value)}
                disabled={saving}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                  pkg === p.value
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                    : 'border-[#E5E5E5] text-[#6B6B6B] hover:border-amber-500/40 hover:text-amber-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-widest mb-1.5">Non-billing (Contra / Comp)</p>
          <div className="flex flex-wrap gap-2">
            {packages.filter(p => p.tier === 'comp').map(p => (
              <button
                key={p.value}
                onClick={() => save(p.value)}
                disabled={saving}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                  pkg === p.value
                    ? 'bg-stone-500/15 border-stone-500/40 text-stone-200'
                    : 'border-[#E5E5E5] text-[#6B6B6B] hover:border-stone-500/40 hover:text-stone-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-[#999999] mt-1.5">
            Skips the Payments tracker. No Stripe link sent, no commencement-fee flag, no overdue indicator.
          </p>
        </div>
      </div>
      {saved && <p className="text-xs text-teal-400">Package updated</p>}

      {currentInfo && isNonBilling && (
        <div className="text-xs text-stone-400 bg-stone-900/40 border border-stone-800 rounded-lg px-3 py-2">
          Non-billing arrangement — no subscription link to send.
        </div>
      )}

      {currentInfo && !isNonBilling && (
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
                className="text-[#999999] hover:text-red-400 transition-colors"
              >
                {cancelling ? 'Cancelling...' : 'Cancel'}
              </button>
            </div>
          )}

          {alreadySent && (
            <div className="text-xs text-[#999999]">
              Subscription link sent {new Date(subscriptionLinkSentAt!).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Brisbane' })}
              {subscriptionLinkSendAt && <span className="ml-1 text-[#999999]">(scheduled send)</span>}
            </div>
          )}

          {scheduleSaved && <p className="text-xs text-amber-400">Send scheduled</p>}

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={sendLink}
              disabled={sending || sent}
              className="text-xs font-bold px-4 py-2 bg-[#1B6DFC] text-black rounded-lg hover:bg-[#5390FF] transition-colors disabled:opacity-50"
            >
              {sending ? 'Sending...' : sent ? 'Sent!' : 'Send to Client'}
            </button>
            <button
              onClick={copyLink}
              className="text-xs font-bold px-4 py-2 border border-[#E5E5E5] text-[#3A3A3A] rounded-lg hover:border-[#D4D4D4] hover:text-white transition-colors"
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            {!isScheduled && (
              <button
                onClick={() => setShowSchedule(v => !v)}
                className="text-xs font-bold px-4 py-2 border border-[#E5E5E5] text-[#6B6B6B] rounded-lg hover:border-amber-500/40 hover:text-amber-300 transition-colors"
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
                className="text-xs bg-[#E5E5E5] border border-[#E5E5E5] text-[#e7e5e4] rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500/50"
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
                className="text-xs text-[#999999] hover:text-[#6B6B6B] transition-colors"
              >
                Cancel
              </button>
              <span className="text-xs text-[#999999]">Will send at 8am Brisbane time</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
