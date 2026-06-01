// Branded "what's new in your portal" update email to active coaching clients.
//
// Headlines the new Health Markers (blood test upload) feature, then rounds up
// the other recent client-facing additions (Readings, weekly check-in feedback,
// in-gym workout logging). Composed entirely from the email design helpers so it
// matches the system look (Pure White / Signal Blue), same as Samantha's refund
// email.
//
// Default mode is PREVIEW: sends a single [PREVIEW] copy to kade@bodyrecode.au
// with a sample name + the portal login link, so Kade sees the exact look first.
//
// Pass --live to broadcast: loops every active client and sends each a
// personalised copy with their own first name + their own portal link.
//
// Usage:
//   cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/client-product-update-email.ts
//   cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/client-product-update-email.ts --live

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import {
  darkEmailShell,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody,
  emailFeaturedCard, emailStatusCard, emailCta, emailUrlFallback,
} from '../src/lib/email-shell'
import { darkEmailSignature } from '../src/lib/email-signature'
import { portalUrl, portalLoginUrl } from '../src/lib/app-url'

const LIVE = process.argv.includes('--live')

const SUBJECT_LIVE = 'A few new things inside your portal'
const PREVIEW_TEXT = 'Health Markers, your Readings, check-in feedback and in-gym logging are now live.'

function firstNameOf(name: string | null): string {
  if (!name) return 'there'
  return name.trim().split(/\s+/)[0] || 'there'
}

function buildHtml(firstName: string, portalLink: string): string {
  const inner = `
${emailLogo()}
${emailEyebrow("What's new")}
${emailHeading('A few new things inside your portal')}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody('A quick walk-through of what has been added to your portal over the last few weeks. None of it changes what we are doing together. It gives both of us more signal to work with, and gives you more to see.', { bottom: 16 })}
${emailBody('<strong style="color:#1A1A1A;">First, the look.</strong> You will have noticed the whole platform has moved from the old dark theme to a clean, light one. That was deliberate: your information is easier to read at a glance, it holds up far better on a phone (the old dark screens inverted badly in some apps), and the calmer layout keeps the focus on what your body is actually telling us rather than the interface around it.', { bottom: 28 })}
${emailFeaturedCard(
  `${emailBody('If you have recent blood work, you can now upload it straight from your portal: a PDF, or even a photo of the page. The system reads every marker against your lab’s own reference ranges and flags anything sitting outside them so we can account for it in your training and nutrition.', { size: 15, bottom: 14 })}${emailBody('To be clear, I am not your doctor and this is never a diagnosis. Anything medical stays with your GP, and I will always point you back to them when that is the right call. It is simply one more signal alongside everything else.', { size: 15, bottom: 0 })}`,
  { eyebrow: 'New · Health Markers' },
)}
${emailBody('<strong style="color:#1A1A1A;">Your Readings.</strong> Your program and nutrition plan now sit underneath plain-English readings that explain the why, not just the what. There is a reading for your training block, one for your nutrition plan, and one that accounts for any medications or supports you have told me about.', { bottom: 16 })}
${emailBody('<strong style="color:#1A1A1A;">Written feedback on every check-in.</strong> When you submit a weekly check-in you now get a written response back from me, on the portal and by email: how I am reading the week, any reframe if the picture has shifted, and the one thing to hold for the week ahead.', { bottom: 16 })}
${emailBody('<strong style="color:#1A1A1A;">Log your sets while you train.</strong> You can now log your training set by set, in the gym, as you go. It snapshots what was prescribed so we can both see how the actual work compared to the plan when we look back.', { bottom: 28 })}
${emailStatusCard({
  eyebrow: 'No action needed',
  headline: 'Use what is useful, ignore what is not.',
  body: 'Nothing here needs doing today. The blood upload is there the moment you want it, and everything else is already on your portal.',
})}
${emailCta({ href: portalLink, label: 'Open your portal' })}
${emailUrlFallback(portalLink)}
${emailBody('Any questions, just hit reply.', { size: 15, bottom: 4 })}
${darkEmailSignature()}
`
  return darkEmailShell(inner, { previewText: PREVIEW_TEXT })
}

async function main() {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY missing.')
    process.exit(1)
  }
  const resend = new Resend(process.env.RESEND_API_KEY)
  const FROM = 'Kade at Body Recode <kade@bodyrecode.au>'

  if (!LIVE) {
    const html = buildHtml('Kade', portalLoginUrl())
    console.log('Mode      : PREVIEW (sending one copy to Kade only)')
    console.log(`Subject   : [PREVIEW] ${SUBJECT_LIVE}`)
    console.log('To        : kade@bodyrecode.au')
    const result = await resend.emails.send({
      from: FROM,
      to: 'kade@bodyrecode.au',
      subject: `[PREVIEW] ${SUBJECT_LIVE}`,
      html,
    })
    console.log('\nResend result:')
    console.log(JSON.stringify(result, null, 2))
    return
  }

  // LIVE broadcast to every active client.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }
  const admin = createClient(url, key)

  const { data: clients, error } = await admin
    .from('clients')
    .select('id, name, email, onboarding_token, active')
    .eq('active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to load clients:', error)
    process.exit(1)
  }

  const recipients = (clients ?? []).filter(c => c.email && c.onboarding_token)
  const skipped = (clients ?? []).filter(c => !c.email || !c.onboarding_token)

  console.log(`Mode      : LIVE broadcast`)
  console.log(`Active    : ${(clients ?? []).length}`)
  console.log(`Sendable  : ${recipients.length}`)
  if (skipped.length) {
    console.log(`Skipped   : ${skipped.length} (missing email or portal token)`)
    skipped.forEach(c => console.log(`            - ${c.name ?? c.id} (${c.email ?? 'no email'})`))
  }
  console.log('')

  let sent = 0
  for (const c of recipients) {
    const firstName = firstNameOf(c.name)
    const html = buildHtml(firstName, portalUrl(c.onboarding_token as string))
    try {
      const result = await resend.emails.send({
        from: FROM,
        to: c.email as string,
        subject: SUBJECT_LIVE,
        html,
      })
      if (result.error) {
        console.log(`  FAIL  ${c.email}  ${JSON.stringify(result.error)}`)
      } else {
        sent++
        console.log(`  sent  ${c.email}  (${result.data?.id})`)
      }
    } catch (err) {
      console.log(`  FAIL  ${c.email}  ${err}`)
    }
  }

  console.log(`\nDone. ${sent}/${recipients.length} sent.`)
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1) })
