'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2 } from 'lucide-react'

interface Contact {
  id: string
  name: string
  type: 'lead' | 'client'
}

export default function CreateBookingButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)

  const [form, setForm] = useState({
    contactId: '',
    contactType: 'lead' as 'lead' | 'client',
    type: 'zoom1',
    date: '',
    time: '',
    duration: '60',
    meetingLink: '',
    notes: '',
  })

  async function openModal() {
    setOpen(true)
    setLoadingContacts(true)
    try {
      const [leadsRes, clientsRes] = await Promise.all([
        fetch('/api/bookings/contacts?type=leads'),
        fetch('/api/bookings/contacts?type=clients'),
      ])
      const leads = await leadsRes.json()
      const clients = await clientsRes.json()
      setContacts([
        ...(leads || []).map((l: { id: string; name: string }) => ({ ...l, type: 'lead' as const })),
        ...(clients || []).map((c: { id: string; name: string }) => ({ ...c, type: 'client' as const })),
      ])
    } finally {
      setLoadingContacts(false)
    }
  }

  function close() {
    setOpen(false)
    setForm({ contactId: '', contactType: 'lead', type: 'zoom1', date: '', time: '', duration: '60', meetingLink: '', notes: '' })
  }

  function submit() {
    if (!form.contactId || !form.date || !form.time) return
    const scheduled_at = new Date(`${form.date}T${form.time}:00+10:00`).toISOString()
    const contact = contacts.find(c => c.id === form.contactId)

    startTransition(async () => {
      await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: contact?.type === 'lead' ? form.contactId : null,
          client_id: contact?.type === 'client' ? form.contactId : null,
          type: form.type,
          scheduled_at,
          duration_minutes: parseInt(form.duration),
          meeting_link: form.meetingLink || null,
          notes: form.notes || null,
        }),
      })
      close()
      router.refresh()
    })
  }

  return (
    <>
      <button
        onClick={openModal}
        className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-stone-950 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
      >
        <Plus size={14} strokeWidth={2.5} />
        New Booking
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={close} />
          <div className="relative bg-stone-900 border border-stone-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">New Booking</h2>
              <button onClick={close} className="text-stone-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Contact */}
              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1.5">Contact</label>
                {loadingContacts ? (
                  <div className="flex items-center gap-2 text-stone-500 text-sm py-2">
                    <Loader2 size={14} className="animate-spin" />
                    Loading...
                  </div>
                ) : (
                  <select
                    value={form.contactId}
                    onChange={(e) => {
                      const contact = contacts.find(c => c.id === e.target.value)
                      setForm(f => ({ ...f, contactId: e.target.value, contactType: contact?.type ?? 'lead' }))
                    }}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-stone-500"
                  >
                    <option value="">Select a contact...</option>
                    {contacts.filter(c => c.type === 'lead').length > 0 && (
                      <optgroup label="Leads">
                        {contacts.filter(c => c.type === 'lead').map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </optgroup>
                    )}
                    {contacts.filter(c => c.type === 'client').length > 0 && (
                      <optgroup label="Clients">
                        {contacts.filter(c => c.type === 'client').map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1.5">Type</label>
                <div className="flex gap-2">
                  {[{ value: 'zoom1', label: 'Zoom 1' }, { value: 'zoom2', label: 'Zoom 2' }, { value: 'other', label: 'Other' }].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setForm(f => ({ ...f, type: opt.value }))}
                      className={`flex-1 text-xs font-medium py-2 rounded-lg border transition-colors ${
                        form.type === opt.value
                          ? 'bg-teal-500/10 border-teal-500/40 text-teal-400'
                          : 'border-stone-700 text-stone-400 hover:border-stone-600 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-400 mb-1.5">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-stone-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-400 mb-1.5">Time (Brisbane)</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm(f => ({ ...f, time: e.target.value }))}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-stone-500"
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1.5">Duration</label>
                <select
                  value={form.duration}
                  onChange={(e) => setForm(f => ({ ...f, duration: e.target.value }))}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-stone-500"
                >
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">60 min</option>
                  <option value="90">90 min</option>
                </select>
              </div>

              {/* Meeting link */}
              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1.5">Zoom Link (optional)</label>
                <input
                  type="url"
                  value={form.meetingLink}
                  onChange={(e) => setForm(f => ({ ...f, meetingLink: e.target.value }))}
                  placeholder="https://zoom.us/j/..."
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-stone-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={close}
                className="flex-1 text-sm text-stone-400 hover:text-white border border-stone-700 hover:border-stone-500 py-2.5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={!form.contactId || !form.date || !form.time || isPending}
                className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold bg-teal-500 hover:bg-teal-400 text-stone-950 disabled:opacity-40 disabled:cursor-not-allowed py-2.5 rounded-lg transition-colors"
              >
                {isPending && <Loader2 size={13} className="animate-spin" />}
                Book
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
