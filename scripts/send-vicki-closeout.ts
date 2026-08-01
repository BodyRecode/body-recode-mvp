/**
 * One-off: send Kade the close-out email for Vicki S to approve, with her
 * Foundational Reading attached as a PDF.
 *
 * Goes to Kade, not to Vicki. Her address is suppressed and her access is
 * revoked; he forwards it himself once he is happy.
 *
 *   npm run send:vicki-closeout
 */
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const CLIENT_ID = 'e1f414f2-e68c-4b1d-82c8-c736d73756e7'
const APPROVE_TO = 'kade@bodyrecode.au'
// The subject Vicki would actually see. Kept here so the preview Kade receives
// is byte-identical to her copy apart from the recipient.
const CLIENT_SUBJECT = 'Your Foundational Reading'

// Body Recode palette, matching email-shell.ts and the design language.
async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: client } = await db.from('clients').select('name, email').eq('id', CLIENT_ID).single()

  // The REAL branded PDF: a puppeteer render of ReadingHeroShell, fetched from
  // production with CRON_SECRET. Not a hand-built imitation. Two earlier
  // attempts at reproducing the layout were wrong, which is why the route now
  // accepts an internal token.
  const secret = process.env.CRON_SECRET
  if (!secret) throw new Error('CRON_SECRET missing; cannot fetch the reading PDF')
  const pdfRes = await fetch(
    `https://app.bodyrecode.au/api/dashboard/clients/${CLIENT_ID}/foundational-reading/pdf`,
    { headers: { Authorization: `Bearer ${secret}` } },
  )
  if (!pdfRes.ok) throw new Error(`PDF fetch failed: ${pdfRes.status} ${await pdfRes.text()}`)
  const pdf = Buffer.from(await pdfRes.arrayBuffer())
  console.log(`Reading PDF fetched: ${(pdf.length / 1024).toFixed(1)} KB`)

  const message = [
    "That's all sorted. Your portal access has been removed and you won't hear from the system again.",
    "I've attached your Foundational Reading so you have it.",
    'Thanks for the work you put into that intake. It was genuinely thorough.',
    'All the best for the walk in October.',
  ]

  const { darkEmailShell, emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody } =
    await import('../src/lib/email-shell')
  // The canonical signature: circular headshot, name, credentials, links.
  // src/lib/email-signature.ts, used by 20+ senders.
  const { darkEmailSignature } = await import('../src/lib/email-signature')

  const inner = [
    emailLogo(130),
    emailEyebrow('Coaching'),
    emailHeading('Your access has been closed', { size: 26 }),
    emailDivider(),
    emailBody('Vicki,'),
    ...message.map(p => emailBody(p)),
    emailBody('Kade'),
    darkEmailSignature(),
  ].join('\n')

  const html = darkEmailShell(inner, {
    previewText: 'Your portal access has been removed. Your Foundational Reading is attached.',
  })

  const resend = new Resend(process.env.RESEND_API_KEY!)
  const sent = await resend.emails.send({
    from: 'Kade Dunstone <kade@send.bodyrecode.au>',
    to: APPROVE_TO,
    subject: CLIENT_SUBJECT,
    attachments: [{ filename: 'Vicki_S_Foundational_Reading.pdf', content: pdf.toString('base64') }],
    html,
  })

  if (sent.error) { console.error('SEND FAILED:', sent.error); process.exit(1) }
  console.log(`Sent to ${APPROVE_TO} (id ${sent.data?.id})`)
}

main().catch(e => { console.error(e); process.exit(1) })
