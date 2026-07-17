// Preview all four booking-flow emails. Composes via the shared builders in
// src/lib/booking-emails.ts, so what lands in the inbox is byte-for-byte what
// the live routes send.
//
// Sample data mirrors the real Vicki lead (custom time request + pre-call
// brief) so the cards are exercised with realistic multi-line content.
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

const SAMPLE_REPORT = `VICKI S - PRE-CALL BRIEF
52F | 70kg | 158cm | Scorecard: 8/15 Depleted | GREEN lead

---

SNAPSHOT

52-year-old woman coming off a brutal medical year - breast cancer surgery (Jan/Feb), radiotherapy (April), BCC removal (June) - plus chronic facial pain from a 2021 cycling accident and long-term ankle restrictions. Confirmed Depleted, Stress-Stored.

---

WHAT THEY WANT

Goal: stamina and strength back, and shift the 10kg that arrived during treatment.

---

LIKELY OBJECTION + ANGLE

She will probably question whether now is the right time - she may say she wants to wait until she's "more recovered" before investing in coaching.`

const SAMPLE_RAW_ANSWERS = `#1 goal: Working on getting back stamina and strength. Coming back from medical drama (see last question).
Biggest frustration: Not having sufficient energy to do everything and can't seem to lose the weight I put on over the past 6 months (about 10kg).
Stats: age 52, Female, 158, 70kg
Other: Surgery in January and February for breast cancer (DCIS Stage 0) then radiotherapy throughout April.`

async function main() {
  const resend = new Resend(process.env.RESEND_API_KEY)

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
        name: 'Vicki S',
        email: 'dragonkindred@optusnet.com.au',
        report: SAMPLE_REPORT,
        rawAnswers: SAMPLE_RAW_ANSWERS,
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
