import Link from 'next/link'
import ClientHeader from '@/components/client-header'
import type { ReactNode } from 'react'

const MONO_FONT = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace"

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
 * - text: #1A1A1A (Graphite)
 * - container: max-w-lg mx-auto px-6 py-10
 * - h1: text-[30px] font-extrabold tracking-tight leading-[1.1]
 * - eyebrow: text-[10px] font-bold text-[#1B6DFC] uppercase, mono, ls 0.18em
 * - back link: text-[12px] text-[#999999] hover:text-[#3A3A3A]
 * - description: text-[15px] text-[#6B6B6B] leading-relaxed
 * - bottom spacer: h-16
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
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1A]">
      <ClientHeader />
      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {backHref && (
              <Link
                href={backHref}
                className="text-[12px] text-[#999999] hover:text-[#3A3A3A] transition-colors"
              >
                {backLabel}
              </Link>
            )}
            {eyebrow && (
              <p
                className={`text-[10px] font-bold text-[#1B6DFC] uppercase mb-3 ${
                  backHref ? 'mt-4' : ''
                }`}
                style={{ fontFamily: MONO_FONT, letterSpacing: '0.18em' }}
              >
                {eyebrow}
              </p>
            )}
            <h1
              className={`text-[30px] font-extrabold text-[#1A1A1A] tracking-tight leading-[1.1] ${
                eyebrow ? 'mb-3' : hasEyebrowAbove ? 'mt-4 mb-3' : 'mb-3'
              }`}
            >
              {title}
            </h1>
            {description && (
              <div className="text-[#6B6B6B] text-[15px] leading-relaxed">{description}</div>
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
