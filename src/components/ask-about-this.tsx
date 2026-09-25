import Link from 'next/link'
import { MessageSquare } from 'lucide-react'
import { anchorAskLabel, askAboutHref, type AnchorKind } from '@/lib/message-anchors'

/**
 * "Ask about this" affordance for a client-facing artefact page.
 *
 * Deliberately quiet: it sits at the bottom of the artefact, styled as a
 * hairline row rather than a primary button. The artefact is the point; this
 * is the escape hatch when a line of it doesn't land. Making it loud would
 * invite chat-for-the-sake-of-chat, which is the failure mode of every
 * coaching app inbox.
 */
export default function AskAboutThis({
  token,
  kind,
  label,
}: {
  token: string
  kind: AnchorKind
  /** Snapshot of what this specific artefact is, e.g. "Block 2 - Rebuild". */
  label?: string | null
}) {
  return (
    <Link
      href={askAboutHref(token, kind, label)}
      /* print:hidden here rather than on each page that uses it. It is a
         control that opens a conversation, and it was printing into the PDF a
         client downloads and keeps: a dead button on a piece of paper, under
         the coach's signature. One place, so the next printable page that uses
         this is covered without anybody remembering. 25 Sep 2026.
         hover:bg-blue-50 was also a Tailwind colour nobody chose, which is the
         kind no search for a hex ever finds. */
      className="group flex items-center justify-between gap-3 rounded-2xl border border-[#E4E4E0] bg-[#FFFFFF] px-5 py-4 hover:border-[#0F1115]/40 hover:bg-[#F2F2EF] transition-colors print:hidden"
    >
      <div className="flex items-center gap-3 min-w-0">
        <MessageSquare size={15} className="text-[#0F1115] shrink-0" />
        <div className="min-w-0">
          <p className="text-[14px] font-medium text-[#0F1115] group-hover:text-[#0F1115] transition-colors">
            {anchorAskLabel(kind)}
          </p>
          {label && <p className="text-[11px] text-[#6E747D] mt-0.5 truncate">{label}</p>}
        </div>
      </div>
      <span className="text-[12px] font-bold text-[#0F1115] shrink-0">Ask →</span>
    </Link>
  )
}
