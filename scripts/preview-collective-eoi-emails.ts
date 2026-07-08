// Preview both Collective EOI emails by sending [PREVIEW] copies to Kade.
// One applicant confirmation (as if Kade himself applied) + one Kade
// notification for a fictional ready-tier applicant. Zero DB writes.
//
// Usage:
//   cd ~/body-recode-mvp && set -a && source .env.local && set +a && \
//     npx tsx scripts/preview-collective-eoi-emails.ts

import { Resend } from 'resend'
import {
  buildApplicantConfirmationEmail,
  buildCoachApplicationNotifyEmail,
  type FitTier,
} from '../src/lib/collective-eoi-emails'
import { fromCoach, fromBrand } from '../src/lib/email-shell'
import { coach } from '../src/config/tenant'

async function main() {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY not set')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const to = coach().email

  console.log(`[preview] Sending 4 [PREVIEW] emails to ${to}\n`)

  // 1: applicant confirmation
  {
    const { subject, html } = buildApplicantConfirmationEmail({ firstName: 'Kade' })
    const res = await resend.emails.send({
      from: fromCoach(),
      to,
      subject: `[PREVIEW · applicant] ${subject}`,
      html,
    })
    if (res.error) console.error('  ✗ applicant:', res.error.message)
    else console.log('  ✓ applicant confirmation sent · id ' + res.data?.id)
  }

  // 2-4: Kade notify - one for each fit tier
  const applicantBase = {
    applicantName: 'Sam Rivera',
    email: 'sam@rivera.example',
    businessName: 'Rivera Movement Studio',
    phone: '+61 400 000 001',
    website: 'https://riveramovement.com',
    heardFrom: 'Kade Dunstone on LinkedIn',
    modality: 'strength',
    oneLiner: 'I coach mid-career professionals back into training their body wants to keep doing.',
    methodClarity: 'documented',
    trackRecord: '8 years in-person, 3 years online, ~40 active clients on rolling 6-week blocks',
    audience: 'engaged',
    audienceSize: '~1,200 IG · ~800 email · full referral pipeline',
    currentSetup: ['Trainerize', 'MyPT Hub', 'Notion', 'Stripe'],
    whatsBroken: 'Three tools, none reading the client. I write the plan; the software just delivers it. I want the read layer.',
    timeline: 'now',
    mindset: 'ownership',
    dimensions: { method: 'green', audience: 'green', modality: 'green', readiness: 'green' } as const,
  }

  const tiers: FitTier[] = ['ready', 'building', 'not_yet']
  for (const tier of tiers) {
    const { subject, html } = buildCoachApplicationNotifyEmail({
      ...applicantBase,
      tier,
      dimensions: tier === 'ready'
        ? { method: 'green', audience: 'green', modality: 'green', readiness: 'green' }
        : tier === 'building'
          ? { method: 'green', audience: 'amber', modality: 'green', readiness: 'amber' }
          : { method: 'amber', audience: 'red', modality: 'green', readiness: 'red' },
    })
    const res = await resend.emails.send({
      from: fromBrand(),
      to,
      subject: `[PREVIEW · ${tier}] ${subject}`,
      html,
    })
    if (res.error) console.error(`  ✗ notify · ${tier}:`, res.error.message)
    else console.log(`  ✓ notify · ${tier} sent · id ` + res.data?.id)
  }

  console.log(`\n[preview] Done. Check ${to}.`)
}

main().catch((err) => { console.error(err); process.exit(1) })
