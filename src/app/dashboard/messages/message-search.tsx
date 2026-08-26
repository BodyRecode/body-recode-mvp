'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'

/**
 * Filters the conversation list by client name or message text.
 *
 * Searching widens the list to every client, not just those with a thread, so
 * it doubles as the way to find someone you have never messaged.
 */
export default function MessageSearch({
  initialQuery,
  selectedClientId,
}: {
  initialQuery: string
  selectedClientId: string
}) {
  const router = useRouter()
  const [q, setQ] = useState(initialQuery)

  const apply = (value: string) => {
    const params = new URLSearchParams()
    if (value.trim()) params.set('q', value.trim())
    else params.set('client', selectedClientId)
    router.push(`/dashboard/messages?${params.toString()}`, { scroll: false })
  }

  return (
    <form
      onSubmit={e => { e.preventDefault(); apply(q) }}
      className="relative mb-3"
    >
      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A0AD] pointer-events-none" />
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Search names and messages"
        className="w-full bg-[#FFFFFF] border border-[#E8EAEE] rounded-xl pl-8 pr-8 py-2 text-[12px] text-[#141821] placeholder:text-[#98A0AD] focus:outline-none focus:border-[#1B6DFC]"
      />
      {q && (
        <button
          type="button"
          onClick={() => { setQ(''); apply('') }}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#98A0AD] hover:text-[#141821] transition-colors"
        >
          <X size={13} />
        </button>
      )}
    </form>
  )
}
