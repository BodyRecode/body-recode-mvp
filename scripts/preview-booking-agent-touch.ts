// Preview a Booking Agent touch WITHOUT touching the database or any real lead.
//
// Generates the copy for a given sequence step against a synthetic scorecard
// lead, prints the paragraphs, and writes the full branded email HTML to the
// scratchpad so it can be eyeballed in a browser.
//
//   cd ~/body-recode-mvp && set -a && source .env.local && set +a && \
//     npx tsx scripts/preview-booking-agent-touch.ts touch_1_intro

import { writeFileSync } from 'fs'
import { EMAIL_SEQUENCE } from '@/lib/booking-agent/sequence'
import { writeTouch, type TouchLeadContext } from '@/lib/booking-agent/write-touch'
import { assembleTouchHtml } from '@/lib/booking-agent/assemble-email'
import { brand } from '@/config/tenant'

const OUT_DIR = '/private/tmp/claude-501/-Users-kadedunstone/d3780ec9-3023-40f4-baac-7e7ceb5771c5/scratchpad'

// Synthetic lead: 41yo woman, Depleted State, Stress-Stored pattern — the
// most common BR scorecard profile.
const LEAD: TouchLeadContext = {
  firstName: 'Sarah',
  bodyState: 'Depleted State',
  score: 6,
  fatStorage: 'Stress-Stored',
  leadQuality: 'green',
  preCallBrief: `SNAPSHOT: 41, likely Depleted State with a Stress-Stored pattern (weight sitting around the stomach and waist). Foundations of sleep and energy are low; body is in protection mode. Reads as motivated but worn down, moderate readiness to invest.
WHAT SHE WANTS: To stop feeling puffy and exhausted, and to see effort in the gym actually show up. Underneath it: to feel like herself again.
WHAT'S LIKELY GOING ON: Chronic stress load keeping cortisol high, driving central storage and blunting recovery. Training harder has stopped working because the limiter is regulation, not effort.
PROBE ON CALL: sleep quality, stress sources, how long the plateau has run, what "trying hard" currently looks like.
LIKELY OBJECTION: "I've tried everything." Angle: everything she tried assumed a discipline problem; this is a physiology problem, and it's readable.`,
}

async function main() {
  const stepKey = process.argv[2] || 'touch_1_intro'
  const touch = EMAIL_SEQUENCE.find(t => t.key === stepKey)
  if (!touch) {
    console.error(`Unknown step "${stepKey}". Options: ${EMAIL_SEQUENCE.map(t => t.key).join(', ')}`)
    process.exit(1)
  }

  const slots = touch.offerSlots ? ['Tuesday 22 July, 5:00pm', 'Wednesday 23 July, 5:45pm', 'Thursday 24 July, 6:30pm'] : []
  const written = await writeTouch(LEAD, touch, { slots })

  console.log('\n══════════════════════════════════════════════════')
  console.log(`  ${touch.label.toUpperCase()}  (${touch.key})`)
  console.log('══════════════════════════════════════════════════')
  console.log(`Source:   ${written.fallback ? 'FALLBACK TEMPLATE (no AI)' : 'AI draft (Haiku)'}`)
  console.log(`Subject:  ${written.subject}`)
  console.log(`Preview:  ${written.previewText}`)
  console.log(`CTA:      [ ${written.ctaLabel} ]`)
  console.log('\nBody:')
  console.log(`  Hi ${LEAD.firstName},\n`)
  written.paragraphs.forEach(p => console.log(`  ${p}\n`))
  if (slots.length) { console.log('  Times I have held open (Brisbane):'); slots.forEach(s => console.log(`    - ${s}`)); console.log() }
  console.log('  Talk soon,\n  Kade')

  const html = assembleTouchHtml({
    firstName: LEAD.firstName,
    paragraphs: written.paragraphs,
    ctaLabel: written.ctaLabel,
    ctaUrl: `${brand().marketingDomain}/book`,
    previewText: written.previewText,
    slots,
  })
  const outPath = `${OUT_DIR}/booking-agent-${stepKey}.html`
  writeFileSync(outPath, html)
  console.log(`\nFull branded email HTML written to:\n  ${outPath}\n`)
}

main().catch(e => { console.error(e); process.exit(1) })
