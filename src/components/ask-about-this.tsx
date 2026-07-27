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
      className="group flex items-center justify-between gap-3 rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF] px-5 py-4 hover:border-[#1B6DFC]/40 hover:bg-blue-50 transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <MessageSquare size={15} className="text-[#1B6DFC] shrink-0" />
        <div className="min-w-0">
          <p className="text-[14px] font-medium text-[#1A1A1A] group-hover:text-[#1B6DFC] transition-colors">
            {anchorAskLabel(kind)}
          </p>
          {label && <p className="text-[11px] text-[#999999] mt-0.5 truncate">{label}</p>}
        </div>
      </div>
      <span className="text-[12px] font-bold text-[#1B6DFC] shrink-0">Ask →</span>
    </Link>
  )
}
