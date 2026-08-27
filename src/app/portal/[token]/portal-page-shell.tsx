import Link from 'next/link'
import ClientHeader from '@/components/client-header'
import type { ReactNode } from 'react'

/**
 * PortalPageShell - canonical outer wrapper for every operational portal page.
 *
 * Established the visual language on `/resources`, `/guides/*`, `/glossary`,
 * `/readings`, `/message`, `/account`. Used to be inlined per-page which led
 * to drift across ~16 pages (audit 2026-07-20). This component locks the
 * canonical wrapper so future pages inherit consistency by default.
 *
 * Design tokens (do NOT diverge without a design-system update):
 * - bg: #FFFFFF (Pure White)
 * - text: #141821 (Graphite)
 * - container: max-w-lg mx-auto px-6 py-10
 * - h1: text-[30px] font-extrabold tracking-tight leading-[1.1]
 * - eyebrow: text-[12.5px] text-[#1B6DFC], sentence case
 * - back link: text-[12px] text-[#98A0AD] hover:text-[#43474F]
 * - description: text-[15px] text-[#666D7A] leading-relaxed
 * - bottom spacer: h-16
 *
 * The eyebrow was 10px bold uppercase monospace at 0.18em tracking (27 Aug:
 * retired). It was the strongest bit of the terminal look the coach side had
 * just dropped, and it is worse here than there: this is read on a phone by
 * someone who is not looking at software all day, and 10px letter-spaced caps
 * is the least legible thing on the page. The 30px title and the wide column
 * stay - both are right for a phone and neither is what looked dated.
 *
 * For long-form editorial pages (Readings series) use the dedicated reading
 * layouts instead - they intentionally use a different visual grammar.
 */
export default function PortalPageShell({
  backHref,
  backLabel = '← Back',
  eyebrow,
  title,
  description,
  children,
  headerRight,
}: {
  /** Omit for onboarding-flow pages where clients should not escape back. */
  backHref?: string
  backLabel?: string
  eyebrow?: string
  title: string
  description?: ReactNode
  children: ReactNode
  headerRight?: ReactNode
}) {
  const hasEyebrowAbove = Boolean(backHref || eyebrow)
  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#141821]">
      <ClientHeader />
      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {backHref && (
              <Link
                href={backHref}
                className="text-[12px] text-[#98A0AD] hover:text-[#43474F] transition-colors"
              >
                {backLabel}
              </Link>
            )}
            {eyebrow && (
              <p className={`text-[12.5px] text-[#1B6DFC] mb-2.5 ${backHref ? 'mt-4' : ''}`}>
                {eyebrow}
              </p>
            )}
            <h1
              className={`text-[30px] font-extrabold text-[#141821] tracking-tight leading-[1.1] ${
                eyebrow ? 'mb-3' : hasEyebrowAbove ? 'mt-4 mb-3' : 'mb-3'
              }`}
            >
              {title}
            </h1>
            {description && (
              <div className="text-[#666D7A] text-[15px] leading-relaxed">{description}</div>
            )}
          </div>
          {headerRight && <div className="shrink-0 pt-4">{headerRight}</div>}
        </div>

        {children}

        <div className="h-16" />
      </div>
    </div>
  )
}
