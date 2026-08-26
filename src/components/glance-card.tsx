import { MONO_FONT } from '@/components/dashboard/ui'

/**
 * GlanceCard — the ONE canonical "at a glance" summary card used across every
 * coach-facing artefact (Training Program, Foundational Synthesis, Weekly
 * Synthesis, Nutrition Plan). Built 2026-07-16 to end the drift where each
 * artefact had grown its own look (program = blue card, CFFS/CFWS = white card
 * with header bar, nutrition = stone cards).
 *
 * The SHELL is identical everywhere; the CONTENT stays relevant to each read:
 *   - headline  = the decision + why (one short paragraph)
 *   - subline   = optional second line (e.g. nutrition "what this means")
 *   - pills     = scan tokens (phase / RPE / body state / flags ...), tone-coded
 *   - bulletGroups = operating rules, or Prioritise / Avoid, etc.
 *   - children  = anything extra to nest inside (e.g. a collapsible full detail)
 *
 * Display-layer only. It reads nothing and writes nothing; call sites pass the
 * already-cleaned strings. Legacy artefacts without a summary simply don't
 * render it and fall through to their in-line sections, unchanged.
 */

export type GlancePill = {
  text: string
  /** neutral (default cream) · accent (blue) · flag (amber) · muted (grey) */
  tone?: 'neutral' | 'accent' | 'flag' | 'muted'
}

export type GlanceBulletGroup = {
  /** optional small heading above the bullets, e.g. "Prioritise" / "Avoid" */
  label?: string
  /** accent = blue bullets/heading · muted = grey bullets/heading */
  tone?: 'accent' | 'muted'
  items: string[]
}

/**
 * Shared "flags" pill for the scan row: amber when there are open flags, muted
 * grey when zero, nothing when the count is missing/unparseable. Accepts the
 * number|string the generators may return.
 */
export function flagsPill(raw: number | string | undefined | null): GlancePill | null {
  const n = typeof raw === 'number' ? raw : parseInt(String(raw ?? ''), 10)
  if (!Number.isFinite(n)) return null
  return { text: `${n} flag${n === 1 ? '' : 's'}`, tone: n > 0 ? 'flag' : 'muted' }
}

const PILL_TONE: Record<NonNullable<GlancePill['tone']>, string> = {
  neutral: 'text-[#141821] bg-[#F4F6F9] border-[#E8EAEE]',
  accent: 'text-[#1B6DFC] bg-[rgba(27,109,252,0.08)] border-[#B5CFFC]',
  flag: 'text-[#A96A12] bg-[#FDF6E9] border-[#F1DEB8]',
  muted: 'text-[#666D7A] bg-[#F4F6F9] border-[#EFF1F4]',
}

export function GlanceCard({
  label = 'At a glance',
  headline,
  subline,
  pills = [],
  bulletGroups = [],
  className = '',
  children,
}: {
  label?: string
  headline: string
  subline?: string
  pills?: GlancePill[]
  bulletGroups?: GlanceBulletGroup[]
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div className={`br-card overflow-hidden ${className}`}>
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[#E8EAEE] bg-[#FBFCFD]">
        <p
          className="text-[10px] font-medium text-[#1B6DFC]"
        >
          {label}
        </p>
      </div>
      <div className="px-5 py-4">
        <p className="text-sm text-[#141821] leading-relaxed whitespace-pre-wrap font-medium">{headline}</p>
        {subline && (
          <p className="text-sm text-[#666D7A] leading-relaxed mt-2">{subline}</p>
        )}
        {pills.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {pills.map((pill, i) => (
              <span
                key={i}
                className={`text-[11px] font-semibold rounded-full px-3 py-1 border ${PILL_TONE[pill.tone ?? 'neutral']}`}
              >
                {pill.text}
              </span>
            ))}
          </div>
        )}
        {bulletGroups.map((group, gi) => (
          group.items.length > 0 && (
            <div key={gi} className="mt-4">
              {group.label && (
                <p
                  className={`text-[11.5px] font-mediumr mb-1.5 ${group.tone === 'muted' ? 'text-[#666D7A]' : 'text-[#1B6DFC]'}`}
                >
                  {group.label}
                </p>
              )}
              <ul className="space-y-1.5">
                {group.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-[#2A2A2A] leading-snug">
                    <span className={`mt-0.5 shrink-0 ${group.tone === 'muted' ? 'text-[#98A0AD]' : 'text-[#1B6DFC]'}`}>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        ))}
        {children}
      </div>
    </div>
  )
}
