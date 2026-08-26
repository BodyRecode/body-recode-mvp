'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { COACHING_PACKAGES } from '@/lib/coaching-packages'

const PACKAGES = COACHING_PACKAGES.map(p => ({
  value: p.value,
  label: `${p.label} - ${p.price}`,
  stripe: p.stripe,
  tier: p.tier,
  linkPending: !!p.linkPending,
  retired: !!p.retired,
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
  // Repriced 26 Aug 2026 with no new Stripe link yet. Everything that could
  // send or copy a link is suppressed until one exists, because the old link
  // charges the old amount under the new label.
  const linkPending = !!currentInfo?.linkPending
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
          <p className="text-[10px] font-semibold text-[#98A0AD] mb-1.5">Standard</p>
          <div className="flex flex-wrap gap-2">
            {packages.filter(p => p.tier === 'standard').map(p => (
              <button
                key={p.value}
                onClick={() => save(p.value)}
                disabled={saving}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                  pkg === p.value
                    ? 'bg-[rgba(27,109,252,0.08)] border-[#B5CFFC] text-[#1B6DFC]'
                    : 'border-[#E8EAEE] text-[#666D7A] hover:border-[#1B6DFC] hover:bg-[rgba(27,109,252,0.06)] hover:text-[#1B6DFC]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {packages.some(p => p.tier === 'launch' && p.value === pkg) && (
        <div>
          <p className="text-[10px] font-semibold text-[#B7791F]/80 mb-1.5">Launch Rate (retired, grandfathered)</p>
          <div className="flex flex-wrap gap-2">
            {packages.filter(p => p.tier === 'launch').map(p => (
              <button
                key={p.value}
                onClick={() => save(p.value)}
                disabled={saving}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                  pkg === p.value
                    ? 'bg-[#FDF6E9] border-[#E5C98F] text-[#A96A12]'
                    : 'border-[#E8EAEE] text-[#666D7A] hover:border-[#E5C98F] hover:text-[#A96A12]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        )}
        <div>
          <p className="text-[10px] font-semibold text-[#666D7A] mb-1.5">Non-billing (Contra / Comp)</p>
          <div className="flex flex-wrap gap-2">
            {packages.filter(p => p.tier === 'comp').map(p => (
              <button
                key={p.value}
                onClick={() => save(p.value)}
                disabled={saving}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                  pkg === p.value
                    ? 'bg-[#666D7A]/15 border-[#666D7A]/40 text-[#141821]'
                    : 'border-[#E8EAEE] text-[#666D7A] hover:border-[#666D7A]/40 hover:text-[#141821]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-[#98A0AD] mt-1.5">
            Skips the Payments tracker. No Stripe link sent, no Foundational Read flag, no overdue indicator.
          </p>
        </div>
      </div>
      {saved && <p className="text-[12.5px] text-[#1B6DFC]">Package updated</p>}

      {currentInfo && linkPending && (
        <div className="text-[12.5px] text-[#8A5A14] bg-[linear-gradient(180deg,#FEFAF2,#FDF6E9)] border border-[#F1DEB8] rounded-lg px-3 py-2">
          <span className="font-bold">Repriced 26 Aug 2026, Stripe link not created yet.</span> Create a weekly
          AUD payment link for {currentInfo.label} in Stripe, paste it into COACHING_PACKAGES, and these controls
          come back. They are hidden so nothing goes out charging the old amount under the new price.
        </div>
      )}

      {currentInfo && isNonBilling && !linkPending && (
        <div className="text-[12.5px] text-[#666D7A] bg-[#F4F6F9]/40 border border-[#EFF1F4] rounded-lg px-3 py-2">
          Non-billing arrangement - no subscription link to send.
        </div>
      )}

      {currentInfo && !isNonBilling && (
        <div className="space-y-2">
          {/* Scheduled send indicator */}
          {isScheduled && (
            <div className="flex items-center gap-3 text-[12.5px]">
              <span className="text-[#A96A12] bg-[linear-gradient(180deg,#FEFAF2,#FDF6E9)] border border-[#F1DEB8] px-2.5 py-1 rounded-full">
                Subscription link scheduled for {scheduledDate}
              </span>
              <button
                onClick={cancelSchedule}
                disabled={cancelling}
                className="text-[#98A0AD] hover:text-[#C82626] transition-colors"
              >
                {cancelling ? 'Cancelling...' : 'Cancel'}
              </button>
            </div>
          )}

          {alreadySent && (
            <div className="text-[12.5px] text-[#98A0AD]">
              Subscription link sent {new Date(subscriptionLinkSentAt!).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Brisbane' })}
              {subscriptionLinkSendAt && <span className="ml-1 text-[#98A0AD]">(scheduled send)</span>}
            </div>
          )}

          {scheduleSaved && <p className="text-[12.5px] text-[#A96A12]">Send scheduled</p>}

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={sendLink}
              disabled={sending || sent}
              className="text-[12.5px] font-medium px-4 py-2 bg-[#1B6DFC] text-white rounded-lg hover:bg-[#1560E0] transition-colors disabled:opacity-50"
            >
              {sending ? 'Sending...' : sent ? 'Sent!' : 'Send to Client'}
            </button>
            <button
              onClick={copyLink}
              className="text-[12.5px] font-medium px-4 py-2 border border-[#E8EAEE] text-[#43474F] rounded-lg hover:border-[#1B6DFC] hover:text-[#1B6DFC] hover:bg-[rgba(27,109,252,0.06)] transition-colors"
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            {!isScheduled && (
              <button
                onClick={() => setShowSchedule(v => !v)}
                className="text-[12.5px] font-medium px-4 py-2 border border-[#E8EAEE] text-[#666D7A] rounded-lg hover:border-[#E5C98F] hover:text-[#A96A12] transition-colors"
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
                className="text-[12.5px] bg-[#EFF1F4] border border-[#E8EAEE] text-[#141821] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#B7791F]/50"
              />
              <button
                onClick={scheduleLink}
                disabled={scheduling || !scheduleDate}
                className="text-[12.5px] font-medium px-3 py-1.5 bg-[#FAEFD8] border border-[#F1DEB8] text-[#A96A12] rounded-lg hover:bg-[#B7791F]/30 transition-colors disabled:opacity-50"
              >
                {scheduling ? 'Saving...' : 'Confirm'}
              </button>
              <button
                onClick={() => setShowSchedule(false)}
                className="text-[12.5px] text-[#98A0AD] hover:text-[#666D7A] transition-colors"
              >
                Cancel
              </button>
              <span className="text-[12.5px] text-[#98A0AD]">Will send at 8am Brisbane time</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
