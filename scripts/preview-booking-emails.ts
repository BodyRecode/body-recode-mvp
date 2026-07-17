// Preview all four booking-flow emails. Composes via the shared builders in
// src/lib/booking-emails.ts, so what lands in the inbox is byte-for-byte what
// the live routes send.
//
// The call-prep preview pulls the REAL stored brief (leads.pre_call_brief) and
// the REAL raw answers (lead_events.notes) for SAMPLE_LEAD_EMAIL. It used to
// use a hand-typed abridged sample, which rendered ~8% of the true content and
// made the email look like it had lost information. A preview that shortens its
// own input is worse than no preview - if you change the sample lead, change it
// to another real lead, never to invented text.
//
// Usage: cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/preview-booking-emails.ts

import { Resend } from 'resend'
import {
  buildCustomTimeRequestEmail,
  buildBookingConfirmationEmail,
  buildCallPrepEmail,
  buildSessionConfirmedEmail,
} from '../src/lib/booking-emails'

const TO = 'kade@bodyrecode.au'
const FROM = 'Kade at Body Recode <kade@bodyrecode.au>'
const LEAD_URL = 'https://performance.bodyrecode.au/dashboard/leads/preview-sample'
const PREP_URL = 'https://bodyrecode.au/book/prep/preview-sample'

const PREFERRED_TIME = 'Friday before 11am or after 3pm; other weekdays after 6pm'

// Real lead the previews are rendered from.
const SAMPLE_LEAD_EMAIL = 'dragonkindred@optusnet.com.au'

/** Pull the real stored brief + raw answers so the preview renders true content. */
async function loadRealLeadContent(): Promise<{ name: string; email: string; report: string; rawAnswers: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  const headers = { apikey: key, Authorization: `Bearer ${key}` }

  const leadRes = await fetch(
    `${url}/rest/v1/leads?select=id,name,email,pre_call_brief&email=ilike.${encodeURIComponent(SAMPLE_LEAD_EMAIL)}`,
    { headers },
  )
  const leads = (await leadRes.json()) as Array<{ id: string; name: string; email: string; pre_call_brief: string | null }>
  const lead = leads?.[0]
  if (!lead) throw new Error(`No lead found for ${SAMPLE_LEAD_EMAIL}`)
  if (!lead.pre_call_brief) throw new Error(`Lead ${SAMPLE_LEAD_EMAIL} has no stored pre_call_brief to preview`)

  // NB: lead_events has no created_at column - it orders by sent_at.
  const evRes = await fetch(
    `${url}/rest/v1/lead_events?select=notes&lead_id=eq.${lead.id}&type=eq.prep_form_completed&order=sent_at.desc&limit=1`,
    { headers },
  )
  const events = await evRes.json()
  if (!Array.isArray(events)) {
    throw new Error(`lead_events query failed: ${JSON.stringify(events)}`)
  }
  const rawAnswers = (events[0] as { notes: string | null } | undefined)?.notes ?? ''
  if (!rawAnswers) {
    throw new Error(`No prep_form_completed answers found for ${SAMPLE_LEAD_EMAIL} - preview would render "(none)" and misrepresent the email`)
  }

  return { name: lead.name, email: lead.email, report: lead.pre_call_brief, rawAnswers }
}

async function main() {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const real = await loadRealLeadContent()
  console.log(`Loaded real content for ${real.name}: brief ${real.report.length} chars, raw answers ${real.rawAnswers.length} chars\n`)

  const emails = [
    {
      tag: '1/4 coach: custom time request',
      ...buildCustomTimeRequestEmail({
        name: 'Vicki S',
        email: 'dragonkindred@optusnet.com.au',
        phone: null,
        preferredTime: PREFERRED_TIME,
        note: null,
        leadUrl: LEAD_URL,
      }),
    },
    {
      tag: '2/4 lead: booking confirmation',
      ...buildBookingConfirmationEmail({
        firstName: 'Vicki',
        preferredTime: PREFERRED_TIME,
        prepUrl: PREP_URL,
      }),
    },
    {
      tag: '3/4 coach: call prep brief',
      ...buildCallPrepEmail({
        name: real.name,
        email: real.email,
        report: real.report,
        rawAnswers: real.rawAnswers,
        leadUrl: LEAD_URL,
      }),
    },
    {
      tag: '4/4 client: session confirmed',
      ...buildSessionConfirmedEmail({
        firstName: 'Vicki',
        displayDate: 'Friday, 24 July 2026',
        displayTime: '9:30am',
        durationMinutes: 60,
      }),
    },
  ]

  for (const { tag, subject, html } of emails) {
    const sent = await resend.emails.send({
      from: FROM,
      to: TO,
      subject: `[PREVIEW] ${subject}`,
      html,
    })
    if (sent.error) {
      console.error(`Send error (${tag}):`, sent.error)
      process.exit(1)
    }
    console.log(`sent ${tag} -> ${sent.data?.id}`)
  }

  console.log(`\nAll 4 booking-flow previews sent to ${TO}.`)
}

main().catch(err => {
  console.error('Preview send failed:', err)
  process.exit(1)
})
