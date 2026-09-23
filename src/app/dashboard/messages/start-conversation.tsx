'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

/**
 * Opens a thread with a client who has never messaged.
 *
 * The inbox is built from conversations, so without this it could only ever
 * react. Most of the valuable messages a coach sends are unprompted: checking
 * in after a hard week, following up on something noticed in a check-in.
 */
export default function StartConversation({
  clients,
}: {
  clients: Array<{ id: string; name: string }>
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  if (clients.length === 0) return null

  return (
    <div className="pt-2">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#2A2F39] px-4 py-3 text-[12.5px] font-semibold text-[#8A9099] hover:border-[#FAFAF8]/50 hover:text-[#FAFAF8] transition-colors"
        >
          <Plus size={13} />
          Message someone else ({clients.length})
        </button>
      ) : (
        <div className="rounded-xl border border-[#2A2F39] bg-[#14171D] p-2">
          <p className="text-[11px] font-medium text-[#676D76] px-2 py-1.5">
            Not messaged yet
          </p>
          <div className="max-h-64 overflow-y-auto">
            {clients.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => router.push(`/dashboard/messages?client=${c.id}`, { scroll: false })}
                className="block w-full text-left px-2 py-2 rounded-lg text-[12.5px] text-[#C2C6CC] hover:bg-[#F3F7FF] hover:text-[#FAFAF8] transition-colors"
              >
                {c.name}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full text-[11px] text-[#676D76] hover:text-[#FAFAF8] transition-colors px-2 py-1.5 mt-1"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
