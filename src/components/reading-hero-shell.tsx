import { brand } from '@/config/tenant'
import type { ReactNode } from 'react'

/**
 * Shared editorial reading layout - dark-hero + tinted-ground + white cards.
 *
 * Single implementation used by all four client-facing reading documents:
 *   - Foundational Reading   (/portal/[token]/foundational-reading)
 *   - Program Reading        (/portal/[token]/program/reading)
 *   - Trajectory Reading     (/portal/[token]/program/trajectory-reading)
 *   - Nutrition Reading      (/portal/[token]/my-plan/reading)
 *
 * Before this component, four separate layout files diverged: FR was the
 * newer dark-hero design (2026-07-12), the other three still used the
 * older editorial cream/narrow-column style. Audit 2026-07-20 flagged the
 * split. This shell locks the visual grammar for the entire reading series.
 *
 * Content-specific props (eyebrow, hero title, sub, pill, sections, coach
 * note) come from the wrapping layout; visual system lives here.
 *
 * Prints via `@media print` so PDF generation routes (puppeteer with
 * printBackground: true) keep working across all four readings.
 */

const ACCENT = '#1B6DFC'
const INK = '#1A1A1A'
const BODY = '#2B2B2B'
const MUTED = '#667085'
const LINE = '#ECEEF2'
const BG = '#F5F7FA'
const SANS = "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif"

// Section icons (lucide-style, inline so they render in-app and in the PDF).
const ICONS: Record<string, string> = {
  pin: '<path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/>',
  pulse: '<path d="M3 12h4l2.5 7 5-14L18 12h3"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  hold: '<circle cx="12" cy="12" r="9"/><line x1="9.5" y1="9.5" x2="9.5" y2="14.5"/><line x1="14.5" y1="9.5" x2="14.5" y2="14.5"/>',
  note: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  path: '<path d="M4 20l6-6 4 4 6-6"/><circle cx="4" cy="20" r="1.5"/><circle cx="10" cy="14" r="1.5"/><circle cx="14" cy="18" r="1.5"/><circle cx="20" cy="12" r="1.5"/>',
  compass: '<circle cx="12" cy="12" r="9"/><polygon points="14.5,9.5 12,15 9.5,14.5 15,12"/>',
  meal: '<path d="M6 3v18"/><path d="M6 8c2 0 4-1 4-3"/><path d="M18 3v10c0 1.5-1 3-3 3v5"/>',
  scale: '<path d="M4 6h16"/><path d="M12 6v14"/><path d="M6 6l-2 7c0 1.5 1 2.5 2 2.5s2-1 2-2.5l-2-7z"/><path d="M18 6l-2 7c0 1.5 1 2.5 2 2.5s2-1 2-2.5l-2-7z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><polyline points="12,7 12,12 15,15"/>',
}

export interface ReadingSection {
  key: string
  label: string
  icon?: keyof typeof ICONS
  content: string | null
}

export interface CoachNoteData {
  content: string | null
  coachName?: string
  coachPhotoUrl?: string
}

function ChipLabel({ icon, label }: { icon: keyof typeof ICONS; label: string }) {
  const svg = ICONS[icon] ?? ICONS.pin
  return (
    <div className="rh-label">
      <span className="rh-chip">
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </span>
      <span className="rh-label-text">{label}</span>
    </div>
  )
}

export default function ReadingHeroShell({
  eyebrow,
  heroTitle,
  heroSub,
  pill,
  clientName,
  aboutText,
  sections,
  coachNote,
}: {
  eyebrow: string
  heroTitle: string
  heroSub: string
  pill?: string | null
  clientName: string
  aboutText?: ReactNode
  sections: ReadingSection[]
  coachNote?: CoachNoteData | null
}) {
  const coachPhoto = coachNote?.coachPhotoUrl ?? `${brand().marketingDomain}/kade-circle.png`
  const coachName = coachNote?.coachName ?? 'Kade Dunstone'

  return (
    <>
      <style>{`
        .rh { font-family: ${SANS}; background: ${BG}; color: ${INK}; min-height: 100vh; position: relative; overflow: hidden; }
        .rh * { box-sizing: border-box; }
        .rh p, .rh h1, .rh h2 { margin: 0; padding: 0; }
        .rh-glow { position: absolute; top: -180px; left: 50%; transform: translateX(-50%); width: 760px; height: 420px; pointer-events: none; background: radial-gradient(circle, rgba(27,109,252,0.14), transparent 68%); }
        .rh-col { position: relative; max-width: 720px; margin: 0 auto; padding: 40px 24px 80px; }
        .rh-hero { position: relative; overflow: hidden; border-radius: 18px; padding: 32px 32px 34px; background: linear-gradient(140deg, #17191F 0%, #0C1B33 100%); box-shadow: 0 14px 34px rgba(11,31,51,0.28); margin-bottom: 26px; }
        .rh-hero-glow { position: absolute; top: -96px; right: -64px; width: 288px; height: 288px; border-radius: 999px; background: radial-gradient(circle, rgba(27,109,252,0.30), transparent 70%); pointer-events: none; }
        .rh-hero-inner { position: relative; }
        .rh-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #8FB4F5; margin-bottom: 12px; }
        .rh-hero h1 { font-size: 34px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.08; color: #fff; margin-bottom: 12px; }
        .rh-hero-sub { font-size: 14px; color: rgba(255,255,255,0.62); line-height: 1.6; margin-bottom: 18px; max-width: 52ch; }
        .rh-hero-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .rh-pill { font-size: 12px; font-weight: 700; color: #cfe0ff; background: rgba(27,109,252,0.18); border: 1px solid rgba(120,165,255,0.35); border-radius: 999px; padding: 5px 12px; }
        .rh-for { font-size: 12px; color: rgba(255,255,255,0.5); }
        .rh-about { border-left: 3px solid ${ACCENT}; background: #fff; border: 1px solid ${LINE}; border-radius: 14px; padding: 18px 20px; margin-bottom: 24px; box-shadow: 0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05); }
        .rh-about p { font-size: 13.5px; color: ${MUTED}; line-height: 1.7; }
        .rh-about b { color: ${INK}; font-weight: 600; }
        .rh-cards { display: flex; flex-direction: column; gap: 16px; }
        .rh-card { background: #fff; border: 1px solid ${LINE}; border-radius: 14px; padding: 24px 26px; box-shadow: 0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05); break-inside: avoid; }
        .rh-label { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
        .rh-chip { width: 32px; height: 32px; border-radius: 9px; background: rgba(27,109,252,0.10); color: ${ACCENT}; display: grid; place-items: center; flex: none; }
        .rh-label-text { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: ${ACCENT}; }
        .rh-body { font-size: 15px; color: ${BODY}; line-height: 1.72; white-space: pre-line; }
        .rh-coach { background: linear-gradient(180deg, #FFFFFF, #FAFBFF); }
        .rh-attn { display: flex; align-items: center; gap: 12px; margin-top: 18px; padding-top: 16px; border-top: 1px solid ${LINE}; }
        .rh-avatar { width: 44px; height: 44px; border-radius: 999px; object-fit: cover; flex: none; border: 1px solid ${LINE}; }
        .rh-who { font-size: 13px; color: ${MUTED}; }
        .rh-who b { color: ${INK}; font-weight: 700; display: block; font-size: 14px; }
        .rh-foot { text-align: center; margin-top: 34px; font-size: 11px; color: #98A2B3; }
        /* Print is a different medium and was being served the screen layout.
           Grey ground, drop shadows and 26px card padding read as depth on a
           display and as wasted space and dirty paper in a PDF. Tightened
           2026-08-01: white page, no shadows, no glows, denser type. Screen is
           untouched. */
        @media print {
          @page { margin: 11mm; size: A4; }
          html, body { background: #FFFFFF !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .rh { overflow: visible; min-height: 0; background: #FFFFFF !important; }
          .rh-col { padding: 0; max-width: none; }

          /* Radial glows render as grey smudges on paper. */
          .rh-glow, .rh-hero-glow { display: none !important; }

          .rh-hero { padding: 15px 18px 16px; margin-bottom: 8px; border-radius: 10px; box-shadow: none; }
          .rh-hero h1 { font-size: 23px; margin-bottom: 6px; }
          .rh-hero-sub { font-size: 11px; line-height: 1.45; margin-bottom: 9px; max-width: 78ch; }
          .rh-eyebrow { font-size: 9.5px; margin-bottom: 8px; }
          .rh-pill { font-size: 10px; padding: 3px 9px; }
          .rh-for { font-size: 10px; }

          .rh-about { padding: 8px 13px; margin-bottom: 6px; border-radius: 8px; box-shadow: none; }
          .rh-about p { font-size: 9.5px; line-height: 1.42; }

          .rh-cards { gap: 6px; }
          /* Cards FLOW across page breaks. break-inside:avoid pushed any long
             section wholesale onto the next page and left a third of the
             previous one blank, which is the "too much space" problem. A
             heading never orphans (break-after) and no single line is stranded
             (orphans/widows). */
          .rh-card { padding: 9px 13px; border-radius: 8px; box-shadow: none; break-inside: auto; }
          .rh-card p { orphans: 3; widows: 3; }
          .rh-label { margin-bottom: 5px; gap: 7px; break-after: avoid; }
          /* The coach note and its signature stay together. */
          .rh-coach { break-inside: avoid; }
          .rh-chip { width: 22px; height: 22px; border-radius: 6px; }
          .rh-chip svg { width: 13px; height: 13px; }
          .rh-label-text { font-size: 9.5px; }
          .rh-body { font-size: 10.5px; line-height: 1.4; }

          .rh-attn { margin-top: 9px; padding-top: 8px; gap: 9px; }
          .rh-avatar { width: 32px; height: 32px; }
          .rh-who { font-size: 10px; }
          .rh-who b { font-size: 11px; }

          .rh-foot { margin-top: 11px; font-size: 8.5px; }
        }
      `}</style>

      <div className="rh">
        <div className="rh-glow" />
        <div className="rh-col">

          <div className="rh-hero">
            <div className="rh-hero-glow" />
            <div className="rh-hero-inner">
              <p className="rh-eyebrow">{eyebrow}</p>
              <h1>{heroTitle}</h1>
              <p className="rh-hero-sub">{heroSub}</p>
              <div className="rh-hero-meta">
                {pill && <span className="rh-pill">{pill}</span>}
                <span className="rh-for">Prepared for {clientName}</span>
              </div>
            </div>
          </div>

          {aboutText && (
            <div className="rh-about">
              {typeof aboutText === 'string' ? <p>{aboutText}</p> : aboutText}
            </div>
          )}

          <div className="rh-cards">
            {sections.map(section => {
              if (!section.content) return null
              return (
                <div key={section.key} className="rh-card">
                  <ChipLabel icon={section.icon ?? 'pin'} label={section.label} />
                  <p className="rh-body">{section.content}</p>
                </div>
              )
            })}

            {coachNote?.content && (
              <div className="rh-card rh-coach">
                <ChipLabel icon="note" label="A note from your coach" />
                <p className="rh-body">{coachNote.content}</p>
                <div className="rh-attn">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="rh-avatar" src={coachPhoto} alt={coachName} />
                  <span className="rh-who"><b>{coachName}</b>your coach</span>
                </div>
              </div>
            )}
          </div>

          <p className="rh-foot">{brand().name} · Prepared for {clientName} · Confidential</p>
        </div>
      </div>
    </>
  )
}
