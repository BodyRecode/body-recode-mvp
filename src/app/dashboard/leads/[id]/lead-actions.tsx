'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getLeadStatusLabel, LEAD_SOURCES } from '@/lib/utils'
import type { Lead } from '@/types'

const STATUSES = [
  'new_check_in', 'report_sent', 'cold_no_booking',
  'zoom_1_booked', 'zoom_completed', 'closed_no_show',
  'closed_declined', 'commencement_fee_paid', 'active_deliberate_start', 'active_coaching',
]

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
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  return (
    <div className="bg-[#111110] border border-[#1c1917] rounded-xl p-6 mb-4 space-y-5">
      <h2 className="text-sm font-semibold text-[#d4cfc9] uppercase tracking-wider">Actions</h2>

      {/* Status */}
      <div>
        <label className="block text-xs text-[#57534e] mb-1.5">Status</label>
        <select
          value={status}
          onChange={e => setStatus(e.target.value as Lead['status'])}
          className="w-full bg-[#1c1917] border border-[#1c1917] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#14b8a6]"
        >
          {STATUSES.map(s => (
            <option key={s} value={s}>{getLeadStatusLabel(s)}</option>
          ))}
        </select>
      </div>

      {/* Source */}
      <div>
        <label className="block text-xs text-[#57534e] mb-1.5">Lead source</label>
        <select
          value={source}
          onChange={e => setSource(e.target.value)}
          className="w-full bg-[#1c1917] border border-[#1c1917] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#14b8a6]"
        >
          <option value="">Unknown</option>
          {LEAD_SOURCES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Zoom meeting URL */}
      <div>
        <label className="block text-xs text-[#57534e] mb-1.5">Zoom meeting URL</label>
        <input
          type="url"
          value={zoomUrl}
          onChange={e => setZoomUrl(e.target.value)}
          placeholder="https://zoom.us/j/..."
          className="w-full bg-[#1c1917] border border-[#1c1917] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#14b8a6]"
        />
      </div>

      {/* Zoom date */}
      <div>
        <label className="block text-xs text-[#57534e] mb-1.5">Zoom date (Brisbane time)</label>
        <input
          type="datetime-local"
          value={zoomDate}
          onChange={e => setZoomDate(e.target.value)}
          className="w-full bg-[#1c1917] border border-[#1c1917] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#14b8a6]"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs text-[#57534e] mb-1.5">Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={5}
          className="w-full bg-[#1c1917] border border-[#1c1917] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#14b8a6] resize-none"
          placeholder="Add notes about this lead..."
        />
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="bg-[#14b8a6] text-[#0c0a09] text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-[#5eead4] transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save changes'}
      </button>
    </div>
  )
}
