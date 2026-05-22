// Send [PREVIEW] copies of the Phase 2 migrated emails to Kade.
// Covers: buildCoachNotificationEmail (one example shown — same helper
// renders all 16 coach-notification surfaces) + Blueprint / Membership /
// Extension delivery + coach notification (6 emails).
// Usage: cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/preview-phase2-emails.ts

import { Resend } from 'resend'
import {
  darkEmailShell, emailUrlFallback,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody,
  emailCta, emailFeaturedCard, emailNumberedList, emailStatusCard,
} from '../src/lib/email-shell'
import { darkEmailSignature } from '../src/lib/email-signature'
import { buildCoachNotificationEmail } from '../src/lib/coach-notification-email'

const APP = 'https://app.bodyrecode.au'
const SAMPLE_TOKEN = 'preview-token-1234567890abcdef'

const previews: Array<{ subject: string; html: string }> = []

// 1. Coach notification — example: weekly check-in submitted (default teal accent)
previews.push({
  subject: '[PREVIEW] Coach Notification example - Weekly check-in submitted',
  html: buildCoachNotificationEmail({
    eyebrow: 'Weekly Check-in',
    heading: 'Sample Client submitted their Week 4 check-in.',
    body: [
      'Energy 7/10, sleep 6.5h average, training intensity holding. They flagged left knee sensation during Wednesday session.',
      'CFFS shows no drift signals. Volume tolerance stable.',
    ],
    details: [
      'Adherence: 4/4 sessions completed',
      'RPE: average 7.5 across all sets',
      'Body weight: -0.4kg week-over-week',
    ],
    ctaLabel: 'Review check-in',
    ctaUrl: `${APP}/dashboard/clients/${SAMPLE_TOKEN}#weekly-checkins`,
    footnote: 'Auto-generated when the client submits the weekly check-in form on the portal.',
  }),
})

// 2. Coach notification — amber accent example: medical clearance required
previews.push({
  subject: '[PREVIEW] Coach Notification example - Clearance required (amber)',
  html: buildCoachNotificationEmail({
    eyebrow: 'Medical Clearance',
    heading: 'Sample Client needs clearance before starting.',
    body: [
      'Their health declaration flagged cardiovascular symptoms on Question 4 (chest discomfort during exertion). The Medical Clearance card has been auto-emailed to them.',
      'They cannot start training until the signed clearance is uploaded and you approve it from the client profile.',
    ],
    details: [
      'Flag: Cardiovascular (Q4)',
      'Auto-email sent: clearance request',
    ],
    ctaLabel: 'View client',
    ctaUrl: `${APP}/dashboard/clients/${SAMPLE_TOKEN}`,
    footnote: 'No further action needed until they upload the signed clearance form.',
    accent: 'amber',
  }),
})

// 3. Blueprint delivery (client)
{
  const portalUrl = `${APP}/blueprint/${SAMPLE_TOKEN}`
  const firstName = 'Sample'
  const patternDisplay = 'Stress-Stored'
  const phaseLines = [
    '<strong style="color:#1A1A1A;">Phase 1 — Regulate</strong> (Weeks 1-2). Re-establish structure and biological rhythm.',
    '<strong style="color:#1A1A1A;">Phase 2 — Adapt</strong> (Weeks 3-4). Drive adaptation through progressive load.',
    '<strong style="color:#1A1A1A;">Phase 3 — Embed</strong> (Weeks 5-6). Lock in the new baseline before Stage 3.',
  ]
  const patternLine = `Your programme has been built around your <strong style="color:#1A1A1A;">${patternDisplay}</strong> pattern.`
  const inner = `
${emailLogo()}
${emailEyebrow('Body Rewire Blueprint')}
${emailHeading('Your 6-week programme is ready.')}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody(patternLine)}
${emailBody('The programme runs across three phases:')}
${emailFeaturedCard(emailNumberedList(phaseLines), { eyebrow: 'How the six weeks unfold' })}
${emailCta({ href: portalUrl, label: 'Open my Blueprint' })}
${emailUrlFallback(portalUrl, 'Bookmark this link — your portal for the full 6 weeks')}
${darkEmailSignature()}
`
  previews.push({
    subject: '[PREVIEW] Your 6-Week Body Rewire Blueprint is ready',
    html: darkEmailShell(inner, { previewText: `${firstName}, your Blueprint is ready.` }),
  })
}

// 4. Blueprint coach notification
{
  const inner = `
${emailLogo()}
${emailEyebrow('Blueprint Purchased')}
${emailHeading('Sample Client bought the Blueprint.')}
${emailDivider()}
${emailStatusCard({
  eyebrow: 'New enrollment',
  headline: 'Email: sample.client@example.com',
  body: 'Pattern: Stress-Stored. Week-advance sequence has been fired via Inngest.',
})}
${darkEmailSignature()}
`
  previews.push({
    subject: '[PREVIEW] Blueprint purchased - Sample Client',
    html: darkEmailShell(inner, { previewText: 'Sample Client bought the Blueprint.' }),
  })
}

// 5. Membership delivery (client)
{
  const portalUrl = `${APP}/blueprint/${SAMPLE_TOKEN}`
  const firstName = 'Sample'
  const inner = `
${emailLogo()}
${emailEyebrow('Body Recode Membership')}
${emailHeading(`Welcome to the Membership, ${firstName}.`)}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody('You are in. Your Body Recode Membership is active and <strong style="color:#1A1A1A;">Block A is loaded into your portal</strong>.')}
${emailBody('Block A — Consolidate picks up directly from where the Blueprint ended. Your pattern rules carry forward. The training and nutrition have been built on top of the foundation you have already established.', { bottom: 28 })}
${emailCta({ href: portalUrl, label: 'Open my portal' })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
${emailStatusCard({
  eyebrow: 'What is next',
  headline: 'Week 4 coach Loom · monthly group Q&A',
  body: 'Your first monthly coach Loom will be sent at the end of Week 4. Monthly group Q&A call details to follow.',
})}
${darkEmailSignature()}
`
  previews.push({
    subject: '[PREVIEW] Welcome to the Body Recode Membership',
    html: darkEmailShell(inner, { previewText: `Welcome ${firstName}, your Membership is active.` }),
  })
}

// 6. Membership coach notification
{
  const firstName = 'Sample'
  const inner = `
${emailLogo()}
${emailEyebrow('Membership Purchased')}
${emailHeading(`${firstName} joined the Membership.`)}
${emailDivider()}
${emailStatusCard({
  eyebrow: 'New enrollment',
  headline: 'Email: sample.client@example.com',
  body: 'Pattern: Stress-Stored. Blueprint token: preview-token-... Week-advance sequence fired via Inngest.',
})}
${darkEmailSignature()}
`
  previews.push({
    subject: '[PREVIEW] Membership purchased - Sample',
    html: darkEmailShell(inner, { previewText: `${firstName} joined the Membership.` }),
  })
}

// 7. Extension delivery (client)
{
  const portalUrl = `${APP}/extension/${SAMPLE_TOKEN}`
  const firstName = 'Sample'
  const inner = `
${emailLogo()}
${emailEyebrow('Body Rewire Extension')}
${emailHeading('Your 90-day extension is ready.')}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody('Your 90-Day Body Rewire Extension is active. Your portal is ready — 12 weeks of progressive programming that picks up exactly where the Blueprint ended.')}
${emailBody('Weeks 1-6 run <strong style="color:#1A1A1A;">Block A (Consolidate)</strong>. Weeks 7-12 run <strong style="color:#1A1A1A;">Block B (Advance)</strong>. Same pattern, same portal structure you already know.', { bottom: 28 })}
${emailCta({ href: portalUrl, label: 'Open my Extension portal' })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
${darkEmailSignature()}
`
  previews.push({
    subject: '[PREVIEW] Your 90-Day Body Rewire Extension is ready',
    html: darkEmailShell(inner, { previewText: `${firstName}, your 90-Day Extension is ready.` }),
  })
}

// 8. Extension coach notification
{
  const firstName = 'Sample'
  const inner = `
${emailLogo()}
${emailEyebrow('Extension Purchased')}
${emailHeading(`${firstName} bought the 90-Day Extension.`)}
${emailDivider()}
${emailStatusCard({
  eyebrow: 'New enrollment',
  headline: 'Email: sample.client@example.com',
  body: 'Pattern: Stress-Stored. Week-advance sequence fired via Inngest.',
})}
${darkEmailSignature()}
`
  previews.push({
    subject: '[PREVIEW] Extension purchased - Sample',
    html: darkEmailShell(inner, { previewText: `${firstName} bought the 90-Day Extension.` }),
  })
}

async function main() {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY missing.')
    process.exit(1)
  }
  const resend = new Resend(process.env.RESEND_API_KEY)

  console.log(`Sending ${previews.length} Phase 2 previews to kade@bodyrecode.au...`)
  for (const p of previews) {
    const result = await resend.emails.send({
      from: 'Body Recode <kade@bodyrecode.au>',
      to: 'kade@bodyrecode.au',
      subject: p.subject,
      html: p.html,
    })
    console.log(`  ${p.subject}`)
    console.log(`    → ${result.data?.id ?? 'NO ID'}`)
    if (result.error) console.error('    error:', result.error)
    await new Promise(r => setTimeout(r, 600))
  }
  console.log('\nDone.')
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1) })
