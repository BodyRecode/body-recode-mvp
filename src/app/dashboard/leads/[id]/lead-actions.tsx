'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getLeadStatusLabel } from '@/lib/utils'
import type { Lead } from '@/types'

const STATUSES = [
  'new_check_in', 'report_sent', 'cold_no_booking',
  'zoom_1_booked', 'zoom_1_completed', 'closed_no_show',
  'zoom_2_booked', 'zoom_2_completed', 'closed_declined',
  'commencement_fee_paid', 'active_deliberate_start', 'active_coaching',
]

export default function LeadActions({ lead }: { lead: Lead }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(lead.status)
  const [notes, setNotes] = useState(lead.notes || '')
  const [zoom1, setZoom1] = useState(lead.zoom_1_date ? lead.zoom_1_date.slice(0, 16) : '')
  const [zoom2, setZoom2] = useState(lead.zoom_2_date ? lead.zoom_2_date.slice(0, 16) : '')
  const [zoomUrl, setZoomUrl] = useState(lead.zoom_meeting_url || '')
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        notes,
        zoom_1_date: zoom1 || null,
        zoom_2_date: zoom2 || null,
        zoom_meeting_url: zoomUrl || null,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 mb-4 space-y-5">
      <h2 className="text-sm font-semibold text-stone-300 uppercase tracking-wider">Actions</h2>

      {/* Status */}
      <div>
        <label className="block text-xs text-stone-500 mb-1.5">Status</label>
        <select
          value={status}
          onChange={e => setStatus(e.target.value as Lead['status'])}
          className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-stone-500"
        >
          {STATUSES.map(s => (
            <option key={s} value={s}>{getLeadStatusLabel(s)}</option>
          ))}
        </select>
      </div>

      {/* Zoom meeting URL */}
      <div>
        <label className="block text-xs text-stone-500 mb-1.5">Zoom meeting URL</label>
        <input
          type="url"
          value={zoomUrl}
          onChange={e => setZoomUrl(e.target.value)}
          placeholder="https://zoom.us/j/..."
          className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-stone-500"
        />
      </div>

      {/* Zoom dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-stone-500 mb-1.5">Zoom 1 date</label>
          <input
            type="datetime-local"
            value={zoom1}
            onChange={e => setZoom1(e.target.value)}
            className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-stone-500"
          />
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1.5">Zoom 2 date</label>
          <input
            type="datetime-local"
            value={zoom2}
            onChange={e => setZoom2(e.target.value)}
            className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-stone-500"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs text-stone-500 mb-1.5">Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={5}
          className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-stone-500 resize-none"
          placeholder="Add notes about this lead..."
        />
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="bg-white text-stone-950 text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-stone-100 transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save changes'}
      </button>
    </div>
  )
}
