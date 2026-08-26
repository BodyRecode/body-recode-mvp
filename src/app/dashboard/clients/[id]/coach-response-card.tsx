'use client'

import { useState } from 'react'
import Link from 'next/link'

interface CoachResponseCardProps {
  clientId: string
  feedback: {
    id: string
    weekly_checkin_id: string
    interpretation: string
    reframe: string | null
    next_focus: string
    email_sent_at: string | null
    updated_at: string
    created_at: string
  }
  meta: { week_number: number; form_type: string; submitted_at: string } | undefined
}

/**
 * One row in the Coach Response History panel. Each of the three sections
 * (Interpretation, Reframe if present, This week hold this) shows a single-
 * line preview by default with an Open button to expand to the full text.
 * Stops the panel turning into a wall of text when a client has many weeks
 * of feedback.
 */
export default function CoachResponseCard({ clientId, feedback, meta }: CoachResponseCardProps) {
  const week = meta?.week_number ?? '?'
  const form = meta?.form_type ?? '?'
  const sent = !!feedback.email_sent_at
  const sentLabel = sent
    ? `Emailed ${new Date(feedback.email_sent_at!).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}`
    : 'Draft (not sent)'

  return (
    <div className="bg-[#FFFFFF] border border-[#E8EAEE] rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 border-b border-[#E8EAEE] flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 flex-wrap">
          <p className="text-[12.5px] font-semibold text-[#141821]">Week {week} · Form {form}</p>
          <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${sent ? 'bg-[rgba(27,109,252,0.08)] border border-[#B5CFFC] text-[#1056D6]' : 'bg-[linear-gradient(180deg,#FEFAF2,#FDF6E9)] border border-[#F1DEB8] text-[#A96A12]'}`}>
            {sentLabel}
          </span>
        </div>
        {meta && (
          <Link
            href={`/dashboard/clients/${clientId}/checkins/${meta.week_number}/${meta.form_type}`}
            className="text-[11.5px] font-medium text-[#1B6DFC] hover:text-[#1056D6]"
          >
            Open check-in →
          </Link>
        )}
      </div>
      <div className="px-4 py-3 space-y-2">
        <CollapsibleSection title="Interpretation" body={feedback.interpretation} />
        {feedback.reframe && <CollapsibleSection title="Reframe" body={feedback.reframe} />}
        <CollapsibleSection title="This week, hold this" body={feedback.next_focus} accent />
      </div>
    </div>
  )
}

function CollapsibleSection({ title, body, accent }: { title: string; body: string; accent?: boolean }) {
  const [open, setOpen] = useState(false)
  const preview = previewLine(body)
  const titleClass = accent ? 'text-[#1B6DFC]' : 'text-[#98A0AD]'

  return (
    <div className="rounded-md border border-[#E8EAEE] bg-[#FFFFFF]/40">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2 hover:bg-[#EFF1F4]/40 transition-colors text-left"
      >
        <div className="min-w-0 flex-1">
          <p className={`text-[11.5px] font-medium mb-0.5 ${titleClass}`}>{title}</p>
          {!open && (
            <p className="text-[12.5px] text-[#666D7A] truncate">{preview}</p>
          )}
        </div>
        <span className="shrink-0 text-[11.5px] font-medium text-[#1B6DFC] hover:text-[#1056D6]">
          {open ? 'Close' : 'Open'}
        </span>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1">
          <div className="text-[12.5px] text-[#43474F] leading-relaxed whitespace-pre-wrap">{body}</div>
        </div>
      )}
    </div>
  )
}

/**
 * First sentence (or first ~110 chars) of the body, for the collapsed preview
 * line. Strips internal newlines so the preview stays on one line.
 */
function previewLine(body: string): string {
  const flat = body.replace(/\s+/g, ' ').trim()
  const sentenceEnd = flat.search(/[.?!](\s|$)/)
  const cut = sentenceEnd > 30 ? sentenceEnd + 1 : Math.min(flat.length, 110)
  return flat.slice(0, cut).trim() + (cut < flat.length ? '…' : '')
}
