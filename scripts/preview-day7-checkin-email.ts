// Preview the Day 7 Progress email (normal Day 7-13 submission branch
// of /api/challenge/quiz). Replicates the live composition using the
// shared builder. Sample data: firstName Kade, 6/8 progress score,
// realistic mixed marker ratings.
//
// Usage: cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/preview-day7-checkin-email.ts

import { Resend } from 'resend'
import { buildDay7ProgressEmail } from '../src/lib/challenge-checkin-emails'

const FIRST = 'Kade'

// Realistic mix of marker ratings for a Stress-Stored adult at Day 7.
// 6 improving / 1 same / 1 challenge = 6/8 progress score.
const SAMPLE_MARKER_RATINGS: Record<string, string> = {
  morning_energy:   'better',
  afternoon_energy: 'challenge',
  puffiness:        'better',
  sleep:            'better',
  cravings:         'same',
  clarity:          'better',
  mood:             'better',
  digestion:        'better',
}

const PROGRESS_SCORE = Object.values(SAMPLE_MARKER_RATINGS).filter(v => v === 'better').length

async function main() {
  const { subject, html } = buildDay7ProgressEmail({
    firstName: FIRST,
    progressScore: PROGRESS_SCORE,
    markerRatings: SAMPLE_MARKER_RATINGS,
  })
  const resend = new Resend(process.env.RESEND_API_KEY)
  const sent = await resend.emails.send({
    from: 'Kade at Body Recode <kade@bodyrecode.au>',
    to: 'kade@bodyrecode.au',
    subject: `[PREVIEW] ${subject}`,
    html,
  })
  if (sent.error) {
    console.error('Send error:', sent.error)
    process.exit(1)
  }
  console.log('[PREVIEW] Day 7 Progress email sent to kade@bodyrecode.au')
  console.log('  Subject:', `[PREVIEW] ${subject}`)
  console.log('  Sample data: firstName =', FIRST, '| progressScore =', PROGRESS_SCORE, '/ 8')
  console.log('  Marker ratings:', SAMPLE_MARKER_RATINGS)
  console.log('  Resend id:', sent.data?.id)
}

main().catch(err => {
  console.error('Preview send failed:', err)
  process.exit(1)
})
