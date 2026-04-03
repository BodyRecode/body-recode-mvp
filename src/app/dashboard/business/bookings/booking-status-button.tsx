'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, AlertCircle, ChevronDown } from 'lucide-react'

interface Props {
  bookingId: string
  currentStatus: string
}

const options = [
  { value: 'completed', label: 'Completed', icon: CheckCircle2, colour: 'text-teal-400' },
  { value: 'no_show', label: 'No Show', icon: AlertCircle, colour: 'text-red-400' },
  { value: 'cancelled', label: 'Cancel', icon: XCircle, colour: 'text-stone-400' },
]

export default function BookingStatusButton({ bookingId, currentStatus }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function updateStatus(status: string) {
    setOpen(false)
    startTransition(async () => {
      await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      router.refresh()
    })
  }

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        disabled={isPending}
        className="flex items-center gap-1 text-xs text-stone-400 hover:text-white border border-stone-700 hover:border-stone-500 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      >
        Update
        <ChevronDown size={11} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-stone-900 border border-stone-700 rounded-lg shadow-xl overflow-hidden min-w-32">
            {options.map((opt) => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.value}
                  onClick={() => updateStatus(opt.value)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-stone-800 transition-colors ${opt.colour}`}
                >
                  <Icon size={12} />
                  {opt.label}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
