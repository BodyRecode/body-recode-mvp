'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getLeadStatusLabel, LEAD_SOURCES } from '@/lib/utils'
import type { Lead } from '@/types'

/**
 * Must match the leads_status_check constraint exactly. This list used to offer
 * 'zoom_completed', which the database rejects, so marking a call done from this
 * dropdown silently failed. The real value is 'zoom_1_completed'.
 */
const STATUSES = [
  'new_check_in', 'report_sent', 'cold_no_booking',
  'zoom_1_booked', 'zoom_1_completed', 'closed_no_show',
  'zoom_2_booked', 'zoom_2_completed',
  'closed_declined', 'commencement_fee_paid', 'active_deliberate_start', 'active_coaching',
]

/** Quick-set buttons, because most follow-ups are "a bit later than this". */
const FOLLOW_UP_PRESETS = [
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '3 weeks', days: 21 },
  { label: '6 weeks', days: 42 },
]

function dateInputFromIso(iso: string): string {
  return new Date(new Date(iso).getTime() + 10 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function isoFromDateInput(local: string): string {
  // 9am Brisbane on the chosen day, so it lands at the top of the working day.
  return new Date(local + 'T09:00:00+10:00').toISOString()
}

function daysFromNow(days: number): string {
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  return new Date(d.getTime() + 10 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function utcToBrisbaneInput(iso: string): string {
  // Brisbane is UTC+10, no DST - shift UTC time forward 10h for display
  const d = new Date(new Date(iso).getTime() + 10 * 60 * 60 * 1000)
  return d.toISOString().slice(0, 16)
}

function brisbaneInputToUtcIso(local: string): string {
  // datetime-local value is Brisbane time - subtract 10h to get UTC
  return new Date(local + ':00+10:00').toISOString()
}

export default function LeadActions({ lead }: { lead: Lead }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(lead.status)
  const [source, setSource] = useState<string>(lead.source || '')
  const [notes, setNotes] = useState(lead.notes || '')
  const [zoomDate, setZoomDate] = useState(lead.zoom_1_date ? utcToBrisbaneInput(lead.zoom_1_date) : '')
  const [zoomUrl, setZoomUrl] = useState(lead.zoom_meeting_url || '')
  const [followUp, setFollowUp] = useState(lead.next_follow_up_at ? dateInputFromIso(lead.next_follow_up_at) : '')
  const [followUpNote, setFollowUpNote] = useState(lead.follow_up_note || '')
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        source,
        notes,
        zoom_1_date: zoomDate ? brisbaneInputToUtcIso(zoomDate) : null,
        zoom_meeting_url: zoomUrl || null,
        next_follow_up_at: followUp ? isoFromDateInput(followUp) : null,
        follow_up_note: followUpNote || null,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  return (
    <div className="br-card p-6 mb-4 space-y-5">
      <h2 className="text-[13.5px] font-semibold text-[#141821] tracking-[-0.015em]">Actions</h2>

      {/* Status */}
      <div>
        <label className="block text-[12.5px] text-[#98A0AD] mb-1.5">Status</label>
        <select
          value={status}
          onChange={e => setStatus(e.target.value as Lead['status'])}
          className="w-full bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg px-3 py-2 text-[#141821] text-sm focus:outline-none focus:border-[#1B6DFC]"
        >
          {STATUSES.map(s => (
            <option key={s} value={s}>{getLeadStatusLabel(s)}</option>
          ))}
        </select>
      </div>

      {/* Source */}
      <div>
        <label className="block text-[12.5px] text-[#98A0AD] mb-1.5">Lead source</label>
        <select
          value={source}
          onChange={e => setSource(e.target.value)}
          className="w-full bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg px-3 py-2 text-[#141821] text-sm focus:outline-none focus:border-[#1B6DFC]"
        >
          <option value="">Unknown</option>
          {LEAD_SOURCES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Zoom meeting URL */}
      <div>
        <label className="block text-[12.5px] text-[#98A0AD] mb-1.5">Zoom meeting URL</label>
        <input
          type="url"
          value={zoomUrl}
          onChange={e => setZoomUrl(e.target.value)}
          placeholder="https://zoom.us/j/..."
          className="w-full bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg px-3 py-2 text-[#141821] text-sm focus:outline-none focus:border-[#1B6DFC]"
        />
      </div>

      {/* Zoom date */}
      <div>
        <label className="block text-[12.5px] text-[#98A0AD] mb-1.5">Zoom date (Brisbane time)</label>
        <input
          type="datetime-local"
          value={zoomDate}
          onChange={e => setZoomDate(e.target.value)}
          className="w-full bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg px-3 py-2 text-[#141821] text-sm focus:outline-none focus:border-[#1B6DFC]"
        />
      </div>

      {/* Follow-up. The thing that stops a warm undecided lead going quiet. */}
      <div className="border-t border-[#E8EAEE] pt-5">
        <label className="block text-[12.5px] text-[#98A0AD] mb-1.5">Follow up on</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {FOLLOW_UP_PRESETS.map(p => (
            <button
              key={p.days}
              type="button"
              onClick={() => setFollowUp(daysFromNow(p.days))}
              className="text-[12.5px] font-medium px-2.5 py-1 rounded-md border border-[#E8EAEE] text-[#43474F] hover:border-[#1B6DFC] hover:text-[#1B6DFC] transition-colors"
            >
              {p.label}
            </button>
          ))}
          {followUp && (
            <button
              type="button"
              onClick={() => setFollowUp('')}
              className="text-[12.5px] font-medium px-2.5 py-1 rounded-md border border-[#E8EAEE] text-[#98A0AD] hover:text-[#141821] transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        <input
          type="date"
          value={followUp}
          onChange={e => setFollowUp(e.target.value)}
          className="w-full bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg px-3 py-2 text-[#141821] text-sm focus:outline-none focus:border-[#1B6DFC]"
        />
        <input
          type="text"
          value={followUpNote}
          onChange={e => setFollowUpNote(e.target.value)}
          placeholder="What to open with when they come back up"
          className="w-full mt-2 bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg px-3 py-2 text-[#141821] text-sm focus:outline-none focus:border-[#1B6DFC]"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-[12.5px] text-[#98A0AD] mb-1.5">Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={5}
          className="w-full bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg px-3 py-2 text-[#141821] text-sm focus:outline-none focus:border-[#1B6DFC] resize-none"
          placeholder="Add notes about this lead..."
        />
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="bg-[#1B6DFC] text-[#FFFFFF] text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-[#1560E0] transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save changes'}
      </button>
    </div>
  )
}
