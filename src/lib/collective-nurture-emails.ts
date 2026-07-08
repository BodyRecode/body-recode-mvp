import { Resend } from 'resend'
import { fromCoach } from './email-shell'
import { coach } from '@/config/tenant'
import {
  collectiveShell, collectiveLogo, collectiveEyebrow, collectiveHeading,
  collectiveDivider, collectiveBody, collectiveCard, collectiveCta,
  collectiveSignature,
  COLLECTIVE_INK, COLLECTIVE_ACCENT, COLLECTIVE_MUTED, COLLECTIVE_FF,
} from './collective-email-shell'

/**
 * Collective nurture-sequence emails for `not_yet` tier applicants.
 * Two emails over 14 days:
 *
 *   Email 1 (Day 0, ~2h after confirmation): "The pieces of Body Recode
 *   that answer what you asked." Matches each thing they said was
 *   broken to a specific BR engine-layer surface.
 *
 *   Email 2 (Day 14): "Where to keep watching." Soft invite to follow
 *   the pattern-breakdown IG content. Explicit "no next call" so the
 *   door is honestly closed for now - re-apply in 6 months if things
 *   change.
 *
 * DRAFT COPY awaiting Kade's approval before Inngest wire-in. Sends
 * happen via Inngest step.sleep chain triggered by `collective/applied`
 * event with `tier === 'not_yet'`.
 *
 * Sequence for `building` tier lives in the sibling file (queued).
 */

export type NotYetNurtureFirstName = string

// ──────────────────────────────────────────────────────────────────────
// Email 1 · Day 0 · "The pieces of Body Recode that answer what you asked"
// ──────────────────────────────────────────────────────────────────────
export function buildNotYetDay0Email({ firstName }: { firstName: string }): { subject: string; html: string } {
  const name = firstName?.trim() || 'there'
  const subject = `${name}, the pieces of Body Recode that answer what you asked.`

  const body = `
${collectiveLogo()}
${collectiveEyebrow('The engine layer · Day 0')}
${collectiveHeading(`This isn't the Collective. But it might be Body Recode.`)}
${collectiveDivider()}
${collectiveBody(`Hi ${name},`)}
${collectiveBody(`I read your application. The Collective isn't the fit right now - the shape you're at doesn't match the shape the Collective is for, and I don't want to pretend otherwise.`)}
${collectiveBody(`But most of the reasons coaches apply to the Collective are actually reasons to use the Body Recode engine itself - just as a practitioner, not as a licensed partner. The pieces are already built. Below is the honest match between what you told me on the form and what already exists.`)}
${collectiveCard(`
  <p style="margin:0 0 8px;font-size:15px;font-weight:800;color:${COLLECTIVE_INK};letter-spacing:-0.01em;line-height:1.35;font-family:${COLLECTIVE_FF};">If the problem is: "I write plans but the tools don't read the client."</p>
  <p style="margin:0 0 6px;font-size:14px;color:${COLLECTIVE_MUTED};line-height:1.7;font-family:${COLLECTIVE_FF};">The read layer is the free 14-Day Body Decode Challenge - on Day 14 the Report names the pattern your body has settled into. That is the read most tools are missing.</p>
  <p style="margin:0;font-size:12px;color:${COLLECTIVE_ACCENT};font-family:${COLLECTIVE_FF};"><a href="https://bodyrecode.au/challenge" style="color:${COLLECTIVE_ACCENT};text-decoration:underline;">bodyrecode.au/challenge</a></p>
`, { eyebrow: '01 · The read' })}
${collectiveCard(`
  <p style="margin:0 0 8px;font-size:15px;font-weight:800;color:${COLLECTIVE_INK};letter-spacing:-0.01em;line-height:1.35;font-family:${COLLECTIVE_FF};">If the problem is: "I want a prescription that changes based on the read, not a generic 12-week plan."</p>
  <p style="margin:0 0 6px;font-size:14px;color:${COLLECTIVE_MUTED};line-height:1.7;font-family:${COLLECTIVE_FF};">That is the 6-Week Body Rewire Blueprint. After the Day 14 Report the pattern is named; the Blueprint is six weeks of pattern-specific corrective work written to that named pattern.</p>
  <p style="margin:0;font-size:12px;color:${COLLECTIVE_ACCENT};font-family:${COLLECTIVE_FF};"><a href="https://bodyrecode.au/blueprint" style="color:${COLLECTIVE_ACCENT};text-decoration:underline;">bodyrecode.au/blueprint</a></p>
`, { eyebrow: '02 · The prescription' })}
${collectiveCard(`
  <p style="margin:0 0 8px;font-size:15px;font-weight:800;color:${COLLECTIVE_INK};letter-spacing:-0.01em;line-height:1.35;font-family:${COLLECTIVE_FF};">If the problem is: "I want ongoing coaching that reads me month to month, not a one-off programme."</p>
  <p style="margin:0 0 6px;font-size:14px;color:${COLLECTIVE_MUTED};line-height:1.7;font-family:${COLLECTIVE_FF};">That is the Body Recode Membership - rotating training blocks + weekly Check-Ins + a monthly Loom from me reading your data. The long-arc container.</p>
  <p style="margin:0;font-size:12px;color:${COLLECTIVE_ACCENT};font-family:${COLLECTIVE_FF};"><a href="https://bodyrecode.au/membership" style="color:${COLLECTIVE_ACCENT};text-decoration:underline;">bodyrecode.au/membership</a></p>
`, { eyebrow: '03 · The container' })}
${collectiveBody(`Start with the free Challenge. It gives you the read layer directly, and it costs nothing but 14 days of attention. If from there you want the Blueprint, or the Membership, those doors are open too.`, { bottom: 22 })}
${collectiveCta({ href: 'https://bodyrecode.au/challenge', label: 'Begin the 14-Day Challenge · free' })}
${collectiveBody(`I'll write once more in two weeks with where to keep watching if you'd rather not act now. After that I'll leave you alone.`, { muted: true, bottom: 6 })}
${collectiveSignature()}
`

  return {
    subject,
    html: collectiveShell(body, `Not the Collective. But the Body Recode engine already answers most of what you asked - here is the match.`),
  }
}

export async function sendNotYetDay0Email(
  to: string, firstName: string,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!process.env.RESEND_API_KEY) return { ok: false, error: 'RESEND_API_KEY not set' }
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { subject, html } = buildNotYetDay0Email({ firstName })
  try {
    const res = await resend.emails.send({
      from: fromCoach(),
      to,
      bcc: coach().email,
      subject,
      html,
    })
    if (res.error) return { ok: false, error: res.error.message }
    return { ok: true, id: res.data?.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// ──────────────────────────────────────────────────────────────────────
// Email 2 · Day 14 · "Where to keep watching."
// ──────────────────────────────────────────────────────────────────────
export function buildNotYetDay14Email({ firstName }: { firstName: string }): { subject: string; html: string } {
  const name = firstName?.trim() || 'there'
  const subject = `Where to keep watching, ${name}.`

  const body = `
${collectiveLogo()}
${collectiveEyebrow('The engine layer · Day 14')}
${collectiveHeading(`One more, then I'll leave you alone.`)}
${collectiveDivider()}
${collectiveBody(`Hi ${name},`)}
${collectiveBody(`Two weeks ago I sent you the map of where the Body Recode engine already answers what you asked. This is the last email from me in this thread. I'd rather stop clearly than keep sending soft-sell nudges.`)}
${collectiveBody(`If nothing has clicked yet, here are the two places worth watching. Neither costs you anything and both are honest about the work.`)}
${collectiveCard(`
  <p style="margin:0 0 6px;font-size:15px;font-weight:800;color:${COLLECTIVE_INK};letter-spacing:-0.01em;line-height:1.35;font-family:${COLLECTIVE_FF};">The pattern breakdowns.</p>
  <p style="margin:0 0 8px;font-size:14px;color:${COLLECTIVE_MUTED};line-height:1.7;font-family:${COLLECTIVE_FF};">@body_recode_ posts the four patterns and their tells. If you have never taken the Challenge, watching the breakdowns for a few weeks is the shortest way to see the read layer in practice.</p>
  <p style="margin:0;font-size:12px;color:${COLLECTIVE_ACCENT};font-family:${COLLECTIVE_FF};"><a href="https://www.instagram.com/body_recode_/" style="color:${COLLECTIVE_ACCENT};text-decoration:underline;">@body_recode_ on Instagram</a></p>
`, { eyebrow: 'Where the read gets shown' })}
${collectiveCard(`
  <p style="margin:0 0 6px;font-size:15px;font-weight:800;color:${COLLECTIVE_INK};letter-spacing:-0.01em;line-height:1.35;font-family:${COLLECTIVE_FF};">The build itself.</p>
  <p style="margin:0 0 8px;font-size:14px;color:${COLLECTIVE_MUTED};line-height:1.7;font-family:${COLLECTIVE_FF};">@kade_dunstone_ is where I write the founder side - what I'm building, what is not working, what the platform is doing next. If you want the honest inside view of what the Collective is being built into, that is where it lives.</p>
  <p style="margin:0;font-size:12px;color:${COLLECTIVE_ACCENT};font-family:${COLLECTIVE_FF};"><a href="https://www.instagram.com/kade_dunstone_/" style="color:${COLLECTIVE_ACCENT};text-decoration:underline;">@kade_dunstone_ on Instagram</a></p>
`, { eyebrow: 'Where the build gets talked about' })}
${collectiveBody(`No next call from me on this. If in six months something shifts - your method matures, your audience grows, the modality becomes supported, or the timing lands right - the Fit Scorecard is open again at bodyrecode.au/collective/apply and I read every submission personally.`, { bottom: 22 })}
${collectiveBody(`Take care, ${name}.`, { muted: true, bottom: 6 })}
${collectiveSignature()}
`

  return {
    subject,
    html: collectiveShell(body, `The last email in this thread. Where to keep watching if you want the honest inside view.`),
  }
}

export async function sendNotYetDay14Email(
  to: string, firstName: string,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!process.env.RESEND_API_KEY) return { ok: false, error: 'RESEND_API_KEY not set' }
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { subject, html } = buildNotYetDay14Email({ firstName })
  try {
    const res = await resend.emails.send({
      from: fromCoach(),
      to,
      bcc: coach().email,
      subject,
      html,
    })
    if (res.error) return { ok: false, error: res.error.message }
    return { ok: true, id: res.data?.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
