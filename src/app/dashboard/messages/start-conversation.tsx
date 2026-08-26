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
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#CFD4DC] px-4 py-3 text-[12px] font-semibold text-[#666D7A] hover:border-[#1B6DFC]/50 hover:text-[#1B6DFC] transition-colors"
        >
          <Plus size={13} />
          Message someone else ({clients.length})
        </button>
      ) : (
        <div className="rounded-xl border border-[#E8EAEE] bg-[#FFFFFF] p-2">
          <p className="text-[11.5px] font-medium text-[#98A0AD] px-2 py-1.5">
            Not messaged yet
          </p>
          <div className="max-h-64 overflow-y-auto">
            {clients.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => router.push(`/dashboard/messages?client=${c.id}`, { scroll: false })}
                className="block w-full text-left px-2 py-2 rounded-lg text-[12px] text-[#43474F] hover:bg-[#F3F7FF] hover:text-[#1B6DFC] transition-colors"
              >
                {c.name}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full text-[11px] text-[#98A0AD] hover:text-[#141821] transition-colors px-2 py-1.5 mt-1"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
