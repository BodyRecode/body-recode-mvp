'use client'

import { ListChecks, FileText, PlayCircle } from 'lucide-react'

/**
 * B-roll canvas: The Body Decode flow
 *
 * Screen-record as B-roll for the /decode landing explainer, covering:
 *
 *   "You'll answer a short set of questions... about two minutes later you'll
 *    have your report. All of it... Then over five days, one short video a
 *    day, we walk you through it."
 *
 * REPLACES /broll/14-day-flow, which still describes the retired Challenge
 * ("fourteen days of structure... on Day 7 a Check-In... on Day 14"). That one
 * is dead; recording it would show the old product.
 *
 * Three viewport zones, so it can be scrolled through in one take:
 *
 *   Zone 1: about two minutes of questions
 *   Zone 2: the whole report, straight away, nothing held back
 *   Zone 3: then five short videos, one a day
 *
 * RECORD AT 1920 x 1080. Every video that plays inside a page is 16:9
 * landscape; only social cuts are vertical. See reference_video_aspect_ratios.
 *
 * URL: /broll/body-decode-flow (noindex - see /broll/layout.tsx)
 */

const BLUE = '#1B6DFC'
const INK = '#1A1A1A'
const BODY = '#4A4A4A'

const PARTS = [
  'Which of the four is yours',
  'Why it is happening',
  'Where you will recognise it',
  'What it is not',
  'Where to start',
]

const DAYS = [
  ['Day 1', 'Your two lowest scores'],
  ['Day 2', 'Why it is happening'],
  ['Day 3', 'Where this shows up'],
  ['Day 4', 'What this is not'],
  ['Day 5', 'What moves it'],
]

function Glow() {
  return (
    <div aria-hidden style={{
      position: 'absolute', top: '-220px', right: '-220px', width: '620px', height: '620px',
      borderRadius: '50%', background: 'radial-gradient(circle, rgba(27,109,252,0.12) 0%, transparent 65%)',
      pointerEvents: 'none',
    }} />
  )
}

const zone: React.CSSProperties = {
  // Fixed 1080px, NOT 100vh. This is a recording canvas: 100vh is the browser
  // viewport minus whatever chrome is showing, so a zone would never be exactly
  // one 1920x1080 frame and the framing would shift between machines. Fixed
  // height means one zone is one frame, every time.
  minHeight: '1080px', display: 'flex', flexDirection: 'column', justifyContent: 'center',
  padding: '80px 96px', position: 'relative', overflow: 'hidden',
}
const eyebrow: React.CSSProperties = {
  fontSize: '19px', fontWeight: 800, color: BLUE, letterSpacing: '0.16em',
  textTransform: 'uppercase', margin: '0 0 22px',
}
const h: React.CSSProperties = {
  fontSize: '76px', fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.03,
  color: INK, margin: '0 0 26px', maxWidth: '20ch',
}
const lead: React.CSSProperties = {
  fontSize: '27px', color: BODY, lineHeight: 1.5, margin: 0, maxWidth: '34ch',
}

export default function BodyDecodeFlowPage() {
  return (
    <div style={{ background: '#FFFFFF', color: INK, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* ZONE 1 · the questions */}
      <section id="z1" style={zone}>
        <Glow />
        <div style={{ position: 'relative' }}>
          <p style={eyebrow}><ListChecks size={20} style={{ verticalAlign: '-3px', marginRight: 10 }} />Step one</p>
          <h1 style={h}>About two minutes of questions.</h1>
          <p style={lead}>Five things about you, scored out of three. Sleep, stress load, energy, and how your body responds to training and to fat loss.</p>

          <div style={{ display: 'flex', gap: '14px', marginTop: '46px', flexWrap: 'wrap' }}>
            {['Sleep', 'Stress load', 'Energy', 'Training response', 'Fat loss response'].map(s => (
              <div key={s} style={{
                border: `1.5px solid ${BLUE}`, background: 'rgba(27,109,252,0.06)',
                borderRadius: '999px', padding: '14px 28px', fontSize: '22px', fontWeight: 700, color: INK,
              }}>{s}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ZONE 2 · the report, all of it */}
      <section id="z2" style={{ ...zone, background: '#F7F7F7', borderTop: '1px solid #E5E5E5', borderBottom: '1px solid #E5E5E5' }}>
        <div style={{ position: 'relative' }}>
          <p style={eyebrow}><FileText size={20} style={{ verticalAlign: '-3px', marginRight: 10 }} />Step two</p>
          <h1 style={h}>Then the whole report, straight away.</h1>
          <p style={{ ...lead, marginBottom: '46px' }}>Nothing kept back and nothing unlocks later.</p>

          <div style={{ display: 'grid', gap: '14px', maxWidth: '900px' }}>
            {PARTS.map((p, i) => (
              <div key={p} style={{
                display: 'flex', alignItems: 'center', gap: '22px',
                background: '#FFFFFF', border: '1px solid #E5E5E5', borderLeft: `5px solid ${BLUE}`,
                borderRadius: '14px', padding: '22px 28px',
              }}>
                <span style={{
                  width: '46px', height: '46px', borderRadius: '50%', background: BLUE, color: '#FFFFFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '21px', fontWeight: 900, flexShrink: 0,
                }}>{i + 1}</span>
                <span style={{ fontSize: '27px', fontWeight: 700 }}>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ZONE 3 · the five days */}
      <section id="z3" style={zone}>
        <Glow />
        <div style={{ position: 'relative' }}>
          <p style={eyebrow}><PlayCircle size={20} style={{ verticalAlign: '-3px', marginRight: 10 }} />Step three</p>
          <h1 style={h}>Then five short videos, one a day.</h1>
          <p style={{ ...lead, marginBottom: '46px' }}>Walking you through it a part at a time, because it is a lot to take in at once.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
            {DAYS.map(([d, t], i) => (
              <div key={d} style={{
                background: '#FFFFFF', border: `1.5px solid ${i === 0 ? BLUE : '#E5E5E5'}`,
                borderRadius: '16px', padding: '28px 22px', minHeight: '200px',
              }}>
                <p style={{ fontSize: '17px', fontWeight: 800, color: BLUE, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 14px' }}>{d}</p>
                <p style={{ fontSize: '25px', fontWeight: 700, lineHeight: 1.22, margin: 0 }}>{t}</p>
              </div>
            ))}
          </div>

          <p style={{ fontSize: '25px', color: BODY, margin: '46px 0 0' }}>
            Free. No card. Nothing to buy to get the report.
          </p>
        </div>
      </section>
    </div>
  )
}
