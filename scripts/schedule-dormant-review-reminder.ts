/**
 * Schedules the 27 August dormant reactivation review, as a real email.
 *
 * Kade asked for a reminder for Wednesday 27 August, the day the dormant
 * sequence is finished and can honestly be judged. An in-session cron would
 * have died the moment the Claude session closed, and a calendar note only
 * tells him to go and count something.
 *
 * Resend can hold a send for up to 30 days, and 27 August is 14 away, so this
 * hands the email to Resend now. It survives deploys, restarts and closed
 * laptops, because from this point it is not our infrastructure holding it.
 *
 * It carries the decision table with it, so the reminder is the thing he needs
 * rather than a pointer to the thing he needs.
 *
 * Run once:  npx dotenv -e .env.local -- npx tsx scripts/schedule-dormant-review-reminder.ts
 */
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// 27 Aug 2026, 8:00am Brisbane. Brisbane is UTC+10 year round, no DST.
const SEND_AT = '2026-08-26T22:00:00.000Z'

const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#0E0E0E;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0E0E0E;padding:32px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#161616;border-radius:16px;padding:32px;font-family:Helvetica,Arial,sans-serif;">

  <tr><td style="color:#1B6DFC;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding-bottom:10px;">
    Decision due today
  </td></tr>

  <tr><td style="color:#FFFFFF;font-size:23px;font-weight:700;line-height:1.3;padding-bottom:18px;">
    Judge the dormant reactivation
  </td></tr>

  <tr><td style="color:#C4C4C4;font-size:15px;line-height:1.65;padding-bottom:22px;">
    You sent it to 55 leads on 13 August. All three touches have landed. Today is
    the day it can be judged honestly, and not before.
    <br><br>
    <strong style="color:#FFFFFF;">Count booked calls. Not opens, not clicks, not replies.</strong>
    Your lifetime total before this was 7 calls from 136 leads.
  </td></tr>

  <tr><td style="padding-bottom:22px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
      <tr>
        <td style="color:#FFFFFF;font-weight:700;padding:11px 0;border-top:1px solid #2A2A2A;width:34%;vertical-align:top;">5 or more</td>
        <td style="color:#C4C4C4;padding:11px 0;border-top:1px solid #2A2A2A;line-height:1.55;">Follow-up was the whole problem. Make it permanent, then turn the ads back on.</td>
      </tr>
      <tr>
        <td style="color:#FFFFFF;font-weight:700;padding:11px 0;border-top:1px solid #2A2A2A;vertical-align:top;">1 to 2</td>
        <td style="color:#C4C4C4;padding:11px 0;border-top:1px solid #2A2A2A;line-height:1.55;">The list was colder than the count. Fix the Day 0 intake gate before spending on traffic.</td>
      </tr>
      <tr>
        <td style="color:#FFFFFF;font-weight:700;padding:11px 0;border-top:1px solid #2A2A2A;vertical-align:top;">0, but replies</td>
        <td style="color:#C4C4C4;padding:11px 0;border-top:1px solid #2A2A2A;line-height:1.55;">The audience is alive, the ask is wrong. Their words are the fix.</td>
      </tr>
      <tr>
        <td style="color:#FFFFFF;font-weight:700;padding:11px 0;border-top:1px solid #2A2A2A;border-bottom:1px solid #2A2A2A;vertical-align:top;">0 and silent</td>
        <td style="color:#C4C4C4;padding:11px 0;border-top:1px solid #2A2A2A;border-bottom:1px solid #2A2A2A;line-height:1.55;">Check deliverability in Resend first. Do not blame the offer until you have.</td>
      </tr>
    </table>
  </td></tr>

  <tr><td style="padding-bottom:26px;">
    <a href="https://app.bodyrecode.au/dashboard/leads"
       style="display:inline-block;background:#1B6DFC;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;padding:13px 26px;border-radius:9px;">
      Open leads
    </a>
  </td></tr>

  <tr><td style="color:#7A7A7A;font-size:13px;line-height:1.6;border-top:1px solid #2A2A2A;padding-top:18px;">
    Full runsheet is in Dropbox: 00_PLAYBOOK / 2026-08-13_Dormant_Reactivation_Runsheet.pdf
    <br><br>
    Whatever the number is, write it down. The next decision after this one is
    whether the Day 0 intake gate gets fixed before the ads come back on.
  </td></tr>

</table>
</td></tr></table>
</body></html>`

async function main() {
  const { data, error } = await resend.emails.send({
    from: 'Body Recode <kade@bodyrecode.au>',
    to: 'kade@bodyrecode.au',
    subject: 'Dormant reactivation: count the calls today',
    html,
    scheduledAt: SEND_AT,
  })

  if (error) {
    console.error('Could not schedule:', error)
    process.exit(1)
  }
  console.log(`Scheduled for 27 Aug 2026, 8:00am Brisbane. Resend id: ${data?.id}`)
}

main()
