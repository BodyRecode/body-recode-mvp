import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { readFileSync } from 'fs'

readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
})

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const resend = new Resend(process.env.RESEND_API_KEY!)

const DRAFTS_PATH = '/Users/kadedunstone/Library/CloudStorage/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/2026-06-10_reengagement_drafts.json'

// Optional flags:
//   --preview      -> only send the first 3 to kade@bodyrecode.au (subject prefixed [PREVIEW])
//   --live         -> send to real recipients
//   --only=email   -> only send to a specific email (testing)
async function main() {
  const args = process.argv.slice(2)
  const isPreview = args.includes('--preview')
  const isLive = args.includes('--live')
  const onlyArg = args.find(a => a.startsWith('--only='))
  const onlyEmail = onlyArg?.split('=')[1]

  if (!isPreview && !isLive && !onlyEmail) {
    console.error('Usage: --preview (sends first 3 to kade for review), --live (sends to real recipients), or --only=email@x.com')
    process.exit(1)
  }

  const { drafts } = JSON.parse(readFileSync(DRAFTS_PATH, 'utf8')) as {
    generated_at: string
    drafts: Array<{
      lead_id: string
      name: string
      email: string
      state: string
      score: number
      quality: string
      days_ago: number
      draft: { subject: string; preheader: string; body_html: string }
    }>
  }

  let targets = drafts
  if (isPreview) targets = drafts.slice(0, 3)
  if (onlyEmail) targets = drafts.filter(d => d.email.toLowerCase() === onlyEmail.toLowerCase())

  console.log(`Sending ${targets.length} emails${isPreview ? ' (PREVIEW to kade)' : ''}...`)

  // Render the HTML body with a Body Recode-style minimal shell (light theme).
  function wrap(body_html: string, preheader: string) {
    return `<!doctype html>
<html><head>
<meta charset="utf-8" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light" />
<style>
  body { background: #FFFFFF; color: #1A1A1A; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.7; }
  .preheader { display: none; opacity: 0; visibility: hidden; height: 0; width: 0; overflow: hidden; }
  .container { max-width: 540px; margin: 0 auto; padding: 36px 24px; }
  .logo { width: 120px; }
  p { font-size: 15px; color: #2B2B2B; margin: 0 0 16px; }
  a { color: #1B6DFC; text-decoration: underline; }
  .signoff { margin-top: 24px; padding-top: 18px; border-top: 1px solid #E5E5E5; font-size: 12px; color: #6B6B6B; }
</style>
</head><body>
  <span class="preheader">${preheader}</span>
  <div class="container">
    <img class="logo" src="https://bodyrecode.au/logo-black.png" alt="Body Recode" />
    <div style="height: 28px"></div>
    ${body_html}
    <div class="signoff">
      You're getting this because you completed the Body State Scorecard at bodyrecode.au. Reply to this email if you'd rather not hear from me again.
    </div>
  </div>
</body></html>`
  }

  let sent = 0, failed = 0
  for (const d of targets) {
    const to = isPreview ? 'kade@bodyrecode.au' : d.email
    const subject = isPreview ? `[PREVIEW for ${d.name}] ${d.draft.subject}` : d.draft.subject
    const html = wrap(d.draft.body_html, d.draft.preheader)

    try {
      const r = await resend.emails.send({
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
        to,
        subject,
        html,
        replyTo: 'kade@bodyrecode.au',
      })
      if (r.error) {
        console.error(`  ! ${d.email}: ${r.error.message}`)
        failed++
      } else {
        sent++
        console.log(`  ✓ ${d.email}  (${d.state} ${d.score}/15)`)
        if (!isPreview) {
          // Log to lead_events so the timeline shows the send
          await admin.from('lead_events').insert({
            lead_id: d.lead_id,
            event_type: 'reengagement_email_sent',
            metadata: {
              subject: d.draft.subject,
              state: d.state,
              score: d.score,
              days_ago: d.days_ago,
              resend_id: r.data?.id,
            },
          }).catch(() => {/* lead_events may not exist or have different schema; non-blocking */})
        }
      }
    } catch (e) {
      console.error(`  ! ${d.email}: ${(e as Error).message}`)
      failed++
    }
    // Throttle to 600ms per send to stay under Resend's 2 req/sec cap
    await new Promise(r => setTimeout(r, 600))
  }
  console.log(`\nDone. Sent ${sent}, failed ${failed}.`)
}
main()
