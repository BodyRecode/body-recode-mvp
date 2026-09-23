'use client'

import { useState, useTransition } from 'react'
import { Check, Loader2 } from 'lucide-react'

interface Props {
  leadId: string
  initialNotes: string
}

export default function NotesEditor({ leadId, initialNotes }: Props) {
  const [notes, setNotes] = useState(initialNotes)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function save() {
    startTransition(async () => {
      await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  const isDirty = notes !== initialNotes

  return (
    <div className="space-y-3">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add notes about this lead..."
        rows={5}
        className="w-full bg-[#1F242C] border border-[#2A2F39] rounded-lg px-3 py-2.5 text-sm text-[#FAFAF8] placeholder-[#676D76] resize-none focus:outline-none focus:border-[#2A2F39] transition-colors"
      />
      <div className="flex items-center justify-end gap-2">
        {saved && (
          <span className="flex items-center gap-1 text-[12.5px] text-[#FAFAF8]">
            <Check size={12} />
            Saved
          </span>
        )}
        <button
          onClick={save}
          disabled={!isDirty || isPending}
          className="flex items-center gap-1.5 text-[12.5px] font-medium bg-[#FAFAF8] hover:bg-[#E4E4E0] text-[#14171D] disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg transition-colors"
        >
          {isPending ? <Loader2 size={12} className="animate-spin" /> : null}
          Save Notes
        </button>
      </div>
    </div>
  )
}
