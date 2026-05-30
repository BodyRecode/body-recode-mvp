// Preview the Day 14 Body Decode Report email (pattern-focused rebuild).
// Uses the shared buildDay14BodyDecodeReportEmail() so the preview is
// byte-identical to what the API route and Inngest Day 14 step will send.
//
// Sample data: firstName Kade, Stress-Stored pattern, 6/8 progress score
// (referenced only in the bridge callback line at the top).
//
// Usage: cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/preview-day14-result-reveal-email.ts

import { Resend } from 'resend'
import { buildDay14BodyDecodeReportEmail } from '../src/lib/challenge-checkin-emails'

const FIRST = 'Kade'
const PATTERN_SLUG = 'stress-stored'
const PROGRESS_SCORE = 6 // out of 8 — appears in the bridge callback line only

async function main() {
  const { subject, html } = buildDay14BodyDecodeReportEmail({
    firstName: FIRST,
    patternSlug: PATTERN_SLUG,
    progressScore: PROGRESS_SCORE,
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

  console.log('[PREVIEW] Day 14 Body Decode Report email sent to kade@bodyrecode.au')
  console.log('  Subject:', `[PREVIEW] ${subject}`)
  console.log('  Sample data: firstName =', FIRST, '| pattern =', PATTERN_SLUG, '| progressScore =', PROGRESS_SCORE, '/ 8')
  console.log('  Resend id:', sent.data?.id)
}

main().catch(err => {
  console.error('Preview send failed:', err)
  process.exit(1)
})
