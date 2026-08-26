'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, AlertCircle, ChevronDown, CalendarClock } from 'lucide-react'

interface Props {
  bookingId: string
  currentStatus: string
  /** ISO timestamp, used to prefill the reschedule fields with the current slot. */
  scheduledAt: string
  durationMinutes: number
}

const options = [
  { value: 'completed', label: 'Completed', icon: CheckCircle2, colour: 'text-[#1B6DFC]' },
  { value: 'no_show', label: 'No Show', icon: AlertCircle, colour: 'text-[#C82626]' },
  { value: 'cancelled', label: 'Cancel', icon: XCircle, colour: 'text-[#666D7A]' },
]

/** Brisbane wall-clock parts of an instant, for prefilling the date/time inputs. */
function brisbaneParts(iso: string): { date: string; time: string } {
  const d = new Date(iso)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Brisbane',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d)
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? ''
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    // Intl renders midnight as "24" in some runtimes; normalise it.
    time: `${get('hour') === '24' ? '00' : get('hour')}:${get('minute')}`,
  }
}

export default function BookingStatusButton({ bookingId, currentStatus, scheduledAt, durationMinutes }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [rescheduling, setRescheduling] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const current = brisbaneParts(scheduledAt)
  const [date, setDate] = useState(current.date)
  const [time, setTime] = useState(current.time)
  const [duration, setDuration] = useState(String(durationMinutes))

  function updateStatus(status: string) {
    setOpen(false)
    startTransition(async () => {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const json = await res.json().catch(() => null)
      // A reminder that could not be pulled out of Resend's queue is the one
      // failure the coach MUST see: the contact still gets emailed at the old
      // time and nothing on screen would otherwise say so.
      if (json?.warning) setWarning(json.warning)
      router.refresh()
    })
  }

  function submitReschedule() {
    if (!date || !time) return
    // +10:00 is Brisbane year-round. Queensland has no daylight saving, so this
    // is a constant and not a bug waiting to happen in October.
    const scheduled_at = new Date(`${date}T${time}:00+10:00`).toISOString()
    setRescheduling(false)
    startTransition(async () => {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduled_at, duration_minutes: parseInt(duration) }),
      })
      const json = await res.json().catch(() => null)
      if (json?.warning) setWarning(json.warning)
      router.refresh()
    })
  }

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        disabled={isPending}
        className="flex items-center gap-1 text-[12.5px] text-[#666D7A] hover:text-[#141821] border border-[#E8EAEE] hover:border-[#CFD4DC] px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      >
        {isPending ? 'Saving...' : 'Update'}
        <ChevronDown size={11} />
      </button>

      {open && !rescheduling && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-[#F4F6F9] border border-[#E8EAEE] rounded-lg shadow-xl overflow-hidden min-w-36">
            {currentStatus === 'scheduled' && (
              <button
                onClick={() => { setRescheduling(true); setOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[12.5px] hover:bg-[#EFF1F4] transition-colors text-[#141821] border-b border-[#E8EAEE]"
              >
                <CalendarClock size={12} />
                Reschedule
              </button>
            )}
            {options.map((opt) => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.value}
                  onClick={() => updateStatus(opt.value)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[#EFF1F4] transition-colors ${opt.colour}`}
                >
                  <Icon size={12} />
                  {opt.label}
                </button>
              )
            })}
          </div>
        </>
      )}

      {warning && (
        <>
          <div className="fixed inset-0 z-30 bg-black/20" onClick={() => setWarning(null)} />
          <div className="absolute right-0 top-8 z-40 bg-[linear-gradient(180deg,#FEFAF2,#FDF6E9)] border border-[#F1DEB8] rounded-lg shadow-xl p-3 w-72">
            <p className="text-[12.5px] font-semibold text-[#8A5A14] mb-1.5">Heads up</p>
            <p className="text-[11px] text-[#8A5A14] leading-relaxed">{warning}</p>
            <button
              onClick={() => setWarning(null)}
              className="mt-2.5 w-full text-[12.5px] font-semibold text-[#8A5A14] border border-[#C08A2D] rounded-lg px-2 py-1.5 hover:bg-[#FAEFD8] transition-colors"
            >
              Got it
            </button>
          </div>
        </>
      )}

      {rescheduling && (
        <>
          <div className="fixed inset-0 z-10 bg-black/20" onClick={() => setRescheduling(false)} />
          <div className="absolute right-0 top-8 z-20 bg-[#F4F6F9] border border-[#E8EAEE] rounded-lg shadow-xl p-3 w-64">
            <p className="text-[12.5px] font-semibold text-[#141821] mb-2">Move this booking</p>
            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-medium text-[#666D7A] mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg px-2.5 py-1.5 text-[12.5px] text-[#141821] focus:outline-none focus:border-[#CFD4DC]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#666D7A] mb-1">Time (Brisbane)</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg px-2.5 py-1.5 text-[12.5px] text-[#141821] focus:outline-none focus:border-[#CFD4DC]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#666D7A] mb-1">Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg px-2.5 py-1.5 text-[12.5px] text-[#141821] focus:outline-none focus:border-[#CFD4DC]"
                >
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">60 min</option>
                  <option value="90">90 min</option>
                </select>
              </div>
            </div>
            <p className="text-[11px] text-[#666D7A] leading-relaxed mt-2.5">
              Moves the Zoom meeting without changing the join link, cancels the old reminders, and emails them the corrected time.
            </p>
            <div className="flex gap-2 mt-2.5">
              <button
                onClick={() => setRescheduling(false)}
                className="flex-1 text-[12.5px] text-[#666D7A] border border-[#E8EAEE] rounded-lg px-2 py-1.5 hover:bg-[#EFF1F4] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitReschedule}
                disabled={!date || !time}
                className="flex-1 text-[12.5px] font-semibold text-white bg-[#1B6DFC] rounded-lg px-2 py-1.5 hover:bg-[#1560E0] transition-colors disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
