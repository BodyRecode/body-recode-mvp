import { BrandMark } from './brand-mark'
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

const ACCENT = '#0F1115'
const INK = '#0F1115'
const BODY = '#0F1115'
const MUTED = '#6E747D'
const LINE = '#E4E4E0'
/** For the footnote under the read: present, not competing with it. */
const FAINT = '#9CA2AB'
const BG = '#F2F2EF'
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

/**
 * Paragraphs, rendered as paragraphs.
 *
 * The engine returns each section as ONE unbroken block of five to eight
 * sentences, and this used to print it into a single <p>, so any break it did
 * write was collapsed on the way to the page. The prompt now asks for two or
 * three paragraphs; this is the half that makes that visible. Content with no
 * breaks renders exactly as before, so nothing already published changes shape.
 */
function Prose({ text }: { text: string | null }) {
  if (!text) return null
  const paras = text.split(/\n\s*\n/).map(t => t.trim()).filter(Boolean)
  return <>{paras.map((t, i) => <p key={i} className="rh-body">{t}</p>)}</>
}

function ChipLabel({ icon, label, num }: { icon: keyof typeof ICONS; label: string; num?: number }) {
  const svg = ICONS[icon] ?? ICONS.pin
  return (
    <div className="rh-label">
      {num && <span className="rh-num">{String(num).padStart(2, '0')}</span>}
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
  dateLine,
  accent,
  accentOnDark,
  aboutText,
  sections,
  coachNote,
}: {
  eyebrow: string
  heroTitle: string
  heroSub: string
  pill?: string | null
  clientName: string
  /** When this was written. A client should never have to guess how old
   *  their own read is, and until 25 Sep 2026 the document did not say. */
  dateLine?: string | null
  /**
   * THE ONE COLOUR ON THIS DOCUMENT, and it is different for every client.
   *
   * Kade, 25 Sep: "still looks boring because there is no colour". The rule we
   * locked is that colour appears only where it MEANS something, and on a read
   * exactly one thing does: the readiness it concludes. So the document is
   * coloured by the client's own state rather than by a brand colour, which is
   * also the more interesting answer — two clients' reads do not look the same.
   */
  accent?: string | null
  /** The same readiness, legible on the dark hero. */
  accentOnDark?: string | null
  aboutText?: ReactNode
  sections: ReadingSection[]
  coachNote?: CoachNoteData | null
}) {
  const coachPhoto = coachNote?.coachPhotoUrl ?? `${brand().marketingDomain}/kade-circle.png`
  const coachName = coachNote?.coachName ?? 'Kade Dunstone'
  /** The client's readiness colour, or graphite when there is not one. */
  const ink = accent ?? ACCENT

  return (
    <>
      {/* THE ONE COLOUR, RUN THROUGH THE WHOLE DOCUMENT. Kade wants more colour
          and he is right that one coloured rule on a cover is not enough. The
          answer is not a second colour: it is letting the client's readiness be
          the document's accent everywhere a document has one — the numbers, the
          rules between sections, the coach's note, the cover. Two clients' reads
          are then visibly different documents, which is true of the reads
          themselves. 25 Sep 2026. */}
      <style>{`
        .rh { font-family: ${SANS}; background: ${BG}; color: ${INK}; min-height: 100vh; position: relative; overflow: hidden; }
        .rh * { box-sizing: border-box; }
        .rh p, .rh h1, .rh h2 { margin: 0; padding: 0; }
        .rh-glow { position: absolute; top: -180px; left: 50%; transform: translateX(-50%); width: 760px; height: 420px; pointer-events: none; background: radial-gradient(circle, rgba(15,17,21,0.08), transparent 68%); }
        .rh-col { position: relative; max-width: 720px; margin: 0 auto; padding: 40px 24px 80px; }
        .rh-hero { position: relative; overflow: hidden; border-radius: 18px; padding: 32px 32px 34px; background: linear-gradient(140deg, #0F1115 0%, #0F1115 100%); box-shadow: 0 14px 34px rgba(15,17,21,0.24); margin-bottom: 26px; }
        .rh-hero-glow { position: absolute; top: -96px; right: -64px; width: 288px; height: 288px; border-radius: 999px; background: radial-gradient(circle, rgba(15,17,21,0.16), transparent 70%); pointer-events: none; }
        .rh-hero-inner { position: relative; }
        .rh-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #DCDCD7; margin-bottom: 12px; }
        .rh-hero h1 { font-size: 34px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.08; color: #FFFFFF; margin-bottom: 12px; }
        .rh-hero-sub { font-size: 14px; color: rgba(255,255,255,0.62); line-height: 1.6; margin-bottom: 18px; max-width: 52ch; }
        .rh-hero-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .rh-body + .rh-body { margin-top: 0.85em; }
        .rh-num, .rh-about-label { display: none; }
        .rh-pill { font-size: 12px; font-weight: 700; color: #DCDCD7; background: rgba(15,17,21,0.10); border: 1px solid rgba(15,17,21,0.12); border-radius: 999px; padding: 5px 12px; }
        .rh-for { font-size: 12px; color: rgba(255,255,255,0.5); }
        .rh-about { background: transparent; border: 0; border-top: 1px solid ${LINE}; border-radius: 0; padding: 18px 2px 0; margin: 4px 0 20px; box-shadow: none; }
        .rh-about p { font-size: 12.5px; color: ${FAINT}; line-height: 1.7; }
        .rh-about b { color: ${INK}; font-weight: 600; }
        .rh-cards { display: flex; flex-direction: column; gap: 16px; }
        .rh-card { background: #FFFFFF; border: 1px solid ${LINE}; border-radius: 14px; padding: 24px 26px; box-shadow: 0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05); break-inside: avoid; }
        .rh-label { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
        .rh-chip { width: 32px; height: 32px; border-radius: 9px; background: rgba(15,17,21,0.06); color: ${ACCENT}; display: grid; place-items: center; flex: none; }
        .rh-label-text { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: ${ACCENT}; }
        .rh-body { font-size: 15px; color: ${BODY}; line-height: 1.72; white-space: pre-line; }
        .rh-coach { background: linear-gradient(180deg, #FFFFFF, #FAFAF8); }
        .rh-attn { display: flex; align-items: center; gap: 12px; margin-top: 18px; padding-top: 16px; border-top: 1px solid ${LINE}; }
        .rh-avatar { width: 44px; height: 44px; border-radius: 999px; object-fit: cover; flex: none; border: 1px solid ${LINE}; }
        .rh-who { font-size: 13px; color: ${MUTED}; }
        .rh-who b { color: ${INK}; font-weight: 700; display: block; font-size: 14px; }
        .rh-foot { text-align: center; margin-top: 34px; font-size: 11px; color: #9CA2AB; }
        /* Print is a different medium and was being served the screen layout.
           Grey ground, drop shadows and 26px card padding read as depth on a
           display and as wasted space and dirty paper in a PDF. Tightened
           2026-08-01: white page, no shadows, no glows, denser type. Screen is
           untouched. */
        /* The cover is a paper-only object. */
        .rh-cover { display: none; }

        @media print {
          /* THE COVER. Mirrors the ops PDF builder so a read and a guide look
             like documents from the same place. */
          .rh-cover {
            display: flex; flex-direction: column; justify-content: space-between;
            height: 245mm; break-after: page; page-break-after: always;
          }
          .rh-cover-top { display: flex; align-items: flex-start; justify-content: space-between; }
          .rh-cover-badge {
            font-size: 8.5px; letter-spacing: 0.16em; text-transform: uppercase;
            color: ${ink}; border: 1px solid ${ink}66; border-radius: 4px; padding: 5px 10px;
          }
          .rh-cover-mid { margin-top: auto; margin-bottom: auto; }
          .rh-cover-for {
            font-size: 9.5px; letter-spacing: 0.16em; text-transform: uppercase;
            color: ${ink}; margin-bottom: 14px;
          }
          .rh-cover-title {
            font-size: 42px; line-height: 1.06; letter-spacing: -0.03em;
            font-weight: 700; color: ${INK}; max-width: 15ch; margin: 0;
          }
          .rh-cover-rule { display: block; width: 86px; height: 3px; background: ${INK}; margin: 22px 0 20px; }
          .rh-cover-sub { font-size: 11.5px; line-height: 1.65; color: ${MUTED}; max-width: 56ch; }
          .rh-cover-foot {
            display: flex; gap: 34px; border-top: 1px solid ${LINE}; padding-top: 14px;
          }
          .rh-cover-k {
            font-size: 8px; letter-spacing: 0.16em; text-transform: uppercase;
            color: ${FAINT}; margin-bottom: 5px;
          }
          .rh-cover-v { font-size: 10.5px; color: ${INK}; font-weight: 600; }
          /* The readiness is the conclusion, so it is the one thing on the cover
             set larger than the labels around it. */
          .rh-cover-state { font-size: 15px; letter-spacing: -0.01em; }

          /* The dark hero is what the cover replaced. Two of them is one too
             many, and a black slab on page two of a printed document is a
             toner bill rather than a design. */
          .rh-hero { display: none !important; }

          /* Room to breathe. It was 11mm, which is a memo margin. */
          @page { margin: 18mm 16mm; size: A4; }
          html, body { background: #FFFFFF !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .rh { overflow: visible; min-height: 0; background: #FFFFFF !important; }
          .rh-col { padding: 0; max-width: none; }

          /* Radial glows render as grey smudges on paper. */
          .rh-glow, .rh-hero-glow { display: none !important; }

          /* THIS WAS SET TO FIT, NOT TO BE READ. Kade, 25 Sep, on the PDF a
             client downloads: "boring as fuck". He was right and the cause was
             not the writing. Body type at 10.5px on 1.4 leading, 9px of padding
             and 6px between sections, all to keep it on two pages. PAGES ARE
             FREE. This is the thing somebody paid for, and it was set like a
             receipt. */
          .rh-hero { padding: 26px 26px 24px; margin-bottom: 26px; border-radius: 12px; box-shadow: none; }
          .rh-hero h1 { font-size: 30px; margin-bottom: 10px; letter-spacing: -0.02em; }
          .rh-hero-sub { font-size: 11.5px; line-height: 1.6; margin-bottom: 16px; max-width: 62ch; }
          .rh-eyebrow { font-size: 9px; margin-bottom: 12px; }
          .rh-pill { font-size: 10.5px; padding: 4px 11px; }
          .rh-for { font-size: 10.5px; }

          .rh-about {
            display: grid; grid-template-columns: 32mm 1fr; column-gap: 9mm;
            border-top: 2px solid ${ink}; border-radius: 0; box-shadow: none;
            padding: 13px 0 0; margin: 4px 0 0;
          }
          .rh-about-label {
            /* display, because the screen rule hides it and display:none takes
               an element OUT OF THE GRID, so without this the paragraph slid
               into the 32mm label column and set itself in a ribbon. */
            display: block;
            font-size: 9px; font-weight: 700; letter-spacing: 0.07em;
            text-transform: uppercase; color: ${ink}; line-height: 1.45;
          }
          .rh-about p { font-size: 9.5px; line-height: 1.65; color: ${FAINT}; }
          .rh-about b { color: ${MUTED}; }

          /* NO BOXES ON PAPER. Five bordered panels stacked down a page reads
             as a form to fill in. The same five sections with a heading and
             room around them read as something a person wrote for you, which
             is what this is. The space between them does the work the borders
             were doing. */
          .rh-cards { gap: 0; }
          .rh-card {
            padding: 0; margin-bottom: 26px; border: 0 !important; border-radius: 0;
            background: transparent !important; box-shadow: none; break-inside: auto;
          }
          .rh-card p { orphans: 3; widows: 3; }
          /* THE PAGE IS A GRID NOW, NOT A STACK.
             Every section was a label with a paragraph under it, four times,
             left-aligned in one column. That is a list of blocks, and no amount
             of adjusting type on top of it was going to make it read as a
             designed document. Kade, plainly: design this whole document
             better.
             The label moves into its own narrow column in the margin and the
             prose sits beside it, which is how a report or a long essay is set.
             It gives the page a structure the eye can hold, and it is what was
             missing rather than any single property. */
          .rh-card {
            display: grid; grid-template-columns: 32mm 1fr; column-gap: 9mm;
            border-top: 2px solid ${ink}; padding-top: 13px !important;
            margin-bottom: 20px !important;
          }
          .rh-label { display: block; margin: 0; break-after: avoid; }
          /* The chips are interface furniture. On paper the number does the
             work and does it more quietly. */
          .rh-chip { display: none !important; }
          /* The number is the loudest coloured thing on each spread, and there
             is one per section, so the colour runs the length of the document
             rather than sitting on the cover alone. */
          .rh-num {
            display: block; font-size: 22px; font-weight: 700; color: ${ink};
            letter-spacing: -0.02em; line-height: 1; margin-bottom: 8px;
          }
          /* The coach note is the one thing that stays whole: it is signed, and
             a signature on its own page is not a signature. */
          /* The coach's note is the one human voice in the document, so it is
             the one block that sits on a ground rather than on the page. */
          .rh-coach {
            break-inside: avoid; border-top: 2px solid ${ink} !important;
            padding: 16px 16px 16px 0 !important;
            background: ${ink}0D !important;
          }
          .rh-coach .rh-label, .rh-coach .rh-prose { padding-left: 14px; }
          .rh-chip { width: 24px; height: 24px; border-radius: 7px; }
          .rh-chip svg { width: 14px; height: 14px; }
          /* 0.14em on 9.5px uppercase pulled words apart so far they read as
             separate ones: "WHERE YO U A RE". Tracking is for small caps, not
             for decoration. */
          .rh-label-text {
            font-size: 9px; letter-spacing: 0.07em; color: ${MUTED};
            line-height: 1.45; display: block;
          }
          .rh-body + .rh-body { margin-top: 0.9em; }
          /* JUSTIFIED, WITH HYPHENATION ON. Kade asked for justified copy and it
             is right on paper, but only with hyphens: without them the browser
             stretches word spacing to fill the line and the page fills with
             rivers of white running down it, which looks worse than ragged
             right. Books justify AND hyphenate; one without the other is the
             mistake.
             The measure comes in from 74 to 68 characters, which is the range
             a line of prose is comfortable to read at this size. */
          /* THE COLUMN WAS FLOATING IN THE LEFT TWO-THIRDS OF THE PAGE. A
             68-character measure is right for the eye, but on A4 it leaves
             about 70mm of dead margin down the right-hand side, so a justified
             block sat in a narrow strip with a void beside it. Kade: "looks
             shit, can the right border be extended".
             The measure cap is gone and the PAGE sets the width instead. The
             type goes up with it, because a longer line needs more leading and
             a bigger size to stay readable — the two have to move together. */
          /* RAGGED RIGHT. Justification was solving the narrow column, not the
             page: with the measure capped at 68 characters a straight right
             edge was the only thing holding the block together. Now the text
             uses the full width, and Kade is right that it no longer needs it.
             Hyphenation stays on, because it stops the ragged edge tearing on a
             long word. 25 Sep 2026. */
          /* NO HYPHENS EITHER. They were earning their place when the copy was
             justified in a narrow column. Ragged right at this measure has room
             for any word, so all hyphenation buys now is a broken word at the
             end of nearly every line, which is fussier than the ragged edge it
             was tidying. */
          .rh-body {
            font-size: 12.5px; line-height: 1.72; max-width: none;
            text-align: left; hyphens: none; -webkit-hyphens: none;
          }

          .rh-attn { margin-top: 16px; padding-top: 14px; gap: 11px; }
          .rh-avatar { width: 38px; height: 38px; }
          .rh-who { font-size: 10.5px; }
          .rh-who b { font-size: 11.5px; }

          /* Left-aligned with the prose rather than centred: the page has one
             text edge now and the footer was the last thing ignoring it. */
          .rh-foot {
            margin: 22px 0 0; padding-top: 12px; border-top: 1px solid ${LINE};
            font-size: 8.5px; color: ${FAINT}; text-align: left;
          }
        }
      `}</style>

      <div className="rh">
        <div className="rh-glow" />
        <div className="rh-col">

          {/* A COVER, ON PAPER ONLY.
              The document opened straight into content, which is what a
              printout does. A read is the thing a client paid for and keeps,
              and the house style for a Body Recode document already exists in
              the ops PDF builder: mark top-left, category top-right, a large
              title over a rule, and a row of meta along the bottom. The read
              now looks like the same house as the guides. 25 Sep 2026.
              Screen never sees it: on screen the dark hero already does this
              job, and a cover you have to scroll past is an obstacle. */}
          <div className="rh-cover">
            <div className="rh-cover-top">
              <BrandMark tone="dark" size="sm" />
              <span className="rh-cover-badge">{eyebrow}</span>
            </div>
            <div className="rh-cover-mid">
              <p className="rh-cover-for">for {clientName}</p>
              <h1 className="rh-cover-title">{heroTitle}</h1>
              <span className="rh-cover-rule" style={accent ? { background: accent } : undefined} />
              <p className="rh-cover-sub">{heroSub}</p>
            </div>
            <div className="rh-cover-foot">
              {pill && (
                <div>
                  <p className="rh-cover-k">Readiness</p>
                  <p className="rh-cover-v rh-cover-state" style={accent ? { color: accent } : undefined}>{pill}</p>
                </div>
              )}
              {dateLine && (
                <div>
                  <p className="rh-cover-k">Written</p>
                  <p className="rh-cover-v">{dateLine}</p>
                </div>
              )}
              <div>
                <p className="rh-cover-k">Brand</p>
                <p className="rh-cover-v">bodyrecode.au</p>
              </div>
            </div>
          </div>

          <div className="rh-hero">
            <div className="rh-hero-glow" />
            <div className="rh-hero-inner">
              <p className="rh-eyebrow">{eyebrow}</p>
              <h1>{heroTitle}</h1>
              <p className="rh-hero-sub">{heroSub}</p>
              <div className="rh-hero-meta">
                {pill && (
                  <span className="rh-pill" style={accentOnDark ? { color: accentOnDark, background: `${accentOnDark}1F`, borderColor: `${accentOnDark}44` } : undefined}>{pill}</span>
                )}
                <span className="rh-for">Prepared for {clientName}{dateLine ? ` · ${dateLine}` : ''}</span>
              </div>
            </div>
          </div>

          {/* THE PREAMBLE USED TO SIT HERE, ABOVE THE READ. Eight lines of
              explanation and caveat between a client and the thing they paid
              for, so the first scroll of their own read was about what the read
              is not. It is worth saying, and it is worth saying AFTER. A client
              opening this wants the first sentence to be about them.
              25 Sep 2026. */}
          <div className="rh-cards">
            {sections.map((section, i) => {
              if (!section.content) return null
              // THE DOCUMENT HAD NO OPENING STATEMENT. Five blocks of solid
              // prose, all set the same, so there was nothing to land on and
              // nowhere for the eye to start. An editorial document opens with
              // one line held up on its own; this takes the first sentence of
              // the read and does exactly that.
              return (
                <div key={section.key} className="rh-card">
                  <ChipLabel icon={section.icon ?? 'pin'} label={section.label} num={i + 1} />
                  <div className="rh-prose">
                    <Prose text={section.content} />
                  </div>
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

          {aboutText && (
            <div className="rh-about">
              {/* In the grid like everything else. It was the one block of text
                  starting at a different left edge, which is the kind of thing
                  that makes a page look unconsidered without anybody being able
                  to say why. */}
              <span className="rh-about-label">About this read</span>
              <div className="rh-about-body">
                {typeof aboutText === 'string' ? <p>{aboutText}</p> : aboutText}
              </div>
            </div>
          )}

          <p className="rh-foot">{brand().name} · Prepared for {clientName} · Confidential</p>
        </div>
      </div>
    </>
  )
}
