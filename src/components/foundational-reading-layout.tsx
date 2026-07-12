import { brand } from "@/config/tenant";

/**
 * Shared layout for the Foundational Reading.
 *
 * Used by:
 *   - /dashboard/clients/[id]/foundational-reading-preview  (Kade preview / PDF source)
 *   - /portal/[token]/foundational-reading                  (client view)
 *   - /api/.../foundational-reading/pdf                     (puppeteer, print media)
 *
 * Redesigned 2026-07-12 to match the client PORTAL design language (dark
 * welcome-style hero, tinted #F5F7FA ground, floating white cards with blue
 * icon-chip section labels, 720 column, Signal Blue). Same content, presented
 * as part of the portal rather than as a separate editorial document. The coach
 * note carries the coach's photo + name.
 *
 * NOTE (white-label): coach photo/name are Kade's for now; make per-tenant when
 * the white-label packaging ships (same as the co-pilot avatar decision).
 * NOTE (series consistency): Program/Nutrition/Trajectory readings have their
 * own layout files and still use the older editorial style — apply this
 * treatment to them in a follow-up.
 *
 * Prints via print media (PDF route sets printBackground:true), so the tinted
 * ground, dark hero, and cards all render in the download.
 */

const ACCENT = '#1B6DFC'
const INK = '#1A1A1A'
const BODY = '#2B2B2B'
const MUTED = '#667085'
const LINE = '#ECEEF2'
const BG = '#F5F7FA'
const SANS = "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif"

export interface ReadingData {
  cr_where_you_are: string | null
  cr_what_your_body_is_telling_us: string | null
  cr_what_were_focusing_on_first: string | null
  cr_what_were_not_doing_yet: string | null
  cr_coach_note: string | null
  body_state_classification: string | null
  generated_at: string
  client_reading_published_at: string | null
}

export interface ClientMeta {
  name: string
}

// Section icons (lucide-style, inline so they render in-app and in the PDF).
const ICONS: Record<string, string> = {
  pin: '<path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/>',
  pulse: '<path d="M3 12h4l2.5 7 5-14L18 12h3"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  hold: '<circle cx="12" cy="12" r="9"/><line x1="9.5" y1="9.5" x2="9.5" y2="14.5"/><line x1="14.5" y1="9.5" x2="14.5" y2="14.5"/>',
  note: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
}

function ChipLabel({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="fr-label">
      <span className="fr-chip">
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          dangerouslySetInnerHTML={{ __html: ICONS[icon] }}
        />
      </span>
      <span className="fr-label-text">{label}</span>
    </div>
  )
}

const SECTIONS: Array<{ key: keyof ReadingData; label: string; icon: string }> = [
  { key: 'cr_where_you_are',                label: 'Where you are right now',        icon: 'pin' },
  { key: 'cr_what_your_body_is_telling_us', label: 'What your body is telling us',    icon: 'pulse' },
  { key: 'cr_what_were_focusing_on_first',  label: 'What we are focusing on first',   icon: 'target' },
  { key: 'cr_what_were_not_doing_yet',      label: 'What we are not doing yet',       icon: 'hold' },
]

export default function ReadingLayout({
  reading,
  client,
}: {
  reading: ReadingData
  client: ClientMeta
}) {
  const coachPhoto = `${brand().marketingDomain}/kade-circle.png`
  const coachName = 'Kade Dunstone'

  return (
    <>
      <style>{`
        .fr { font-family: ${SANS}; background: ${BG}; color: ${INK}; min-height: 100vh; position: relative; overflow: hidden; }
        .fr * { box-sizing: border-box; }
        .fr p, .fr h1, .fr h2 { margin: 0; padding: 0; }
        .fr-glow { position: absolute; top: -180px; left: 50%; transform: translateX(-50%); width: 760px; height: 420px; pointer-events: none; background: radial-gradient(circle, rgba(27,109,252,0.14), transparent 68%); }
        .fr-col { position: relative; max-width: 720px; margin: 0 auto; padding: 40px 24px 80px; }
        .fr-hero { position: relative; overflow: hidden; border-radius: 18px; padding: 32px 32px 34px; background: linear-gradient(140deg, #17191F 0%, #0C1B33 100%); box-shadow: 0 14px 34px rgba(11,31,51,0.28); margin-bottom: 26px; }
        .fr-hero-glow { position: absolute; top: -96px; right: -64px; width: 288px; height: 288px; border-radius: 999px; background: radial-gradient(circle, rgba(27,109,252,0.30), transparent 70%); pointer-events: none; }
        .fr-hero-inner { position: relative; }
        .fr-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #8FB4F5; margin-bottom: 12px; }
        .fr-hero h1 { font-size: 34px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.08; color: #fff; margin-bottom: 12px; }
        .fr-hero-sub { font-size: 14px; color: rgba(255,255,255,0.62); line-height: 1.6; margin-bottom: 18px; max-width: 52ch; }
        .fr-hero-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .fr-state { font-size: 12px; font-weight: 700; color: #cfe0ff; background: rgba(27,109,252,0.18); border: 1px solid rgba(120,165,255,0.35); border-radius: 999px; padding: 5px 12px; }
        .fr-for { font-size: 12px; color: rgba(255,255,255,0.5); }
        .fr-about { border-left: 3px solid ${ACCENT}; background: #fff; border: 1px solid ${LINE}; border-radius: 14px; padding: 18px 20px; margin-bottom: 24px; box-shadow: 0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05); }
        .fr-about p { font-size: 13.5px; color: ${MUTED}; line-height: 1.7; }
        .fr-about b { color: ${INK}; font-weight: 600; }
        .fr-cards { display: flex; flex-direction: column; gap: 16px; }
        .fr-card { background: #fff; border: 1px solid ${LINE}; border-radius: 14px; padding: 24px 26px; box-shadow: 0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05); break-inside: avoid; }
        .fr-label { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
        .fr-chip { width: 32px; height: 32px; border-radius: 9px; background: rgba(27,109,252,0.10); color: ${ACCENT}; display: grid; place-items: center; flex: none; }
        .fr-label-text { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: ${ACCENT}; }
        .fr-body { font-size: 15px; color: ${BODY}; line-height: 1.72; white-space: pre-line; }
        .fr-coach { background: linear-gradient(180deg, #FFFFFF, #FAFBFF); }
        .fr-attn { display: flex; align-items: center; gap: 12px; margin-top: 18px; padding-top: 16px; border-top: 1px solid ${LINE}; }
        .fr-avatar { width: 44px; height: 44px; border-radius: 999px; object-fit: cover; flex: none; border: 1px solid ${LINE}; }
        .fr-who { font-size: 13px; color: ${MUTED}; }
        .fr-who b { color: ${INK}; font-weight: 700; display: block; font-size: 14px; }
        .fr-foot { text-align: center; margin-top: 34px; font-size: 11px; color: #98A2B3; }
        @media print {
          @page { margin: 12mm; size: A4; }
          html, body { background: ${BG} !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .fr { overflow: visible; min-height: 0; }
          .fr-col { padding: 0; }
          .fr-card, .fr-hero, .fr-about { break-inside: avoid; }
        }
      `}</style>

      <div className="fr">
        <div className="fr-glow" />
        <div className="fr-col">

          <div className="fr-hero">
            <div className="fr-hero-glow" />
            <div className="fr-hero-inner">
              <p className="fr-eyebrow">Foundational Reading</p>
              <h1>Your Starting Position</h1>
              <p className="fr-hero-sub">A read of how your body is currently organising itself, across energy, recovery, sleep, stress, and training response. Not a verdict, a foundation we build from together.</p>
              <div className="fr-hero-meta">
                {reading.body_state_classification && (
                  <span className="fr-state">{reading.body_state_classification}</span>
                )}
                <span className="fr-for">Prepared for {client.name}</span>
              </div>
            </div>
          </div>

          <div className="fr-about">
            <p><b>About this reading.</b> The intake you completed gave us a picture of how your system is currently working, across energy, recovery, sleep, stress, and training response. What follows is what stood out: where you are, what your body is signalling, and what we are deliberately doing and not doing in response. Nothing here diagnoses or prescribes. It is the foundation we build from together.</p>
          </div>

          <div className="fr-cards">
            {SECTIONS.map(section => {
              const content = reading[section.key] as string | null
              if (!content) return null
              return (
                <div key={section.key} className="fr-card">
                  <ChipLabel icon={section.icon} label={section.label} />
                  <p className="fr-body">{content}</p>
                </div>
              )
            })}

            {reading.cr_coach_note && (
              <div className="fr-card fr-coach">
                <ChipLabel icon="note" label="A note from your coach" />
                <p className="fr-body">{reading.cr_coach_note}</p>
                <div className="fr-attn">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="fr-avatar" src={coachPhoto} alt={coachName} />
                  <span className="fr-who"><b>{coachName}</b>your coach</span>
                </div>
              </div>
            )}
          </div>

          <p className="fr-foot">{brand().name} · Prepared for {client.name} · Confidential</p>
        </div>
      </div>
    </>
  )
}
