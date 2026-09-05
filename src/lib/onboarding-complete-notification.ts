/**
 * Coach notification fired when a client has completed BOTH the foundational
 * intake and the baseline submission. The trigger is whichever of the two
 * is submitted second. Both submit-intake and submit-baseline routes call
 * this helper; the helper itself decides whether the conditions are met.
 *
 * Subject + body branch on whether a CFFS already exists for the client:
 *  - No CFFS yet  → "CFFS ready for generation" (fresh onboarding path)
 *  - CFFS exists  → "Baseline submitted, regenerate with new photos" (re-capture
 *                    path, or coach-already-generated case)
 *
 * Failure is logged but never thrown — onboarding submission must not fail
 * because a notification email failed.
 */

import { Resend } from 'resend'
import type { SupabaseClient } from '@supabase/supabase-js'
import { buildCoachNotificationEmail } from './coach-notification-email'
import { appUrl } from '@/lib/app-url'
import { fromBrand } from '@/lib/email-shell'
import { coach } from '@/config/tenant'

export interface NotifyOptions {
  /** Which form was just submitted; lets the email name the trigger. */
  trigger: 'intake' | 'baseline'
}

export async function notifyOnboardingCompleteIfReady(
  admin: SupabaseClient,
  clientId: string,
  opts: NotifyOptions,
): Promise<{ sent: boolean; reason?: string }> {
  // Bail early if we don't have a Resend key configured (local dev, etc.)
  if (!process.env.RESEND_API_KEY) return { sent: false, reason: 'no resend key' }

  // Pull client, intake (existence), baseline (existence), and any active CFFS
  const [
    { data: client },
    { data: intakes },
    { data: baselines },
    { data: existingCffs },
  ] = await Promise.all([
    admin.from('clients').select('id, name').eq('id', clientId).maybeSingle(),
    admin.from('intakes').select('id, submitted_at').eq('client_id', clientId).limit(1),
    admin.from('baselines').select('id, captured_at').eq('client_id', clientId).limit(1),
    admin.from('cffs').select('id').eq('client_id', clientId).eq('is_archived', false).limit(1),
  ])

  if (!client) return { sent: false, reason: 'client not found' }
  if (!intakes || intakes.length === 0) return { sent: false, reason: 'intake not submitted' }
  if (!baselines || baselines.length === 0) return { sent: false, reason: 'baseline not submitted' }

  const hasActiveCFFS = !!(existingCffs && existingCffs.length > 0)
  const baseUrl = appUrl()
  const clientProfileUrl = `${baseUrl}/dashboard/clients/${clientId}`

  let subject: string
  let eyebrow: string
  let heading: string
  let body: string
  let footnote: string

  if (hasActiveCFFS) {
    // A CFFS already exists. The baseline arrival (or intake re-submit) is
    // a regeneration opportunity, not a fresh generation. Tell the coach
    // that explicitly so they decide whether to regen.
    subject = `${client.name} submitted baseline - CFFS can be regenerated with the new photos`
    eyebrow = 'Baseline Update'
    heading = `${client.name} submitted a new baseline`
    body =
      `A CFFS already exists for ${client.name}. The new baseline (including any updated photos) is now available. ` +
      `If you want the Fat Map's Spatial Patterning to read the new visual evidence, click Regenerate CFFS on the client profile. ` +
      `Existing program, nutrition plan, FR, PR, and NR will continue to read the prior CFFS until you do.`
    footnote = 'Optional. Regenerate only if the new photos materially differ from the original baseline.'
  } else {
    // Fresh onboarding path. Both forms are in, no CFFS yet. Coach manually
    // generates from the dashboard when ready.
    subject = `${client.name} completed onboarding - CFFS ready for generation`
    eyebrow = 'Onboarding Complete'
    heading = `${client.name} has completed all onboarding forms`
    body =
      `${client.name} has now submitted both their foundational intake (234 questions) and their baseline (measurements plus front, side, and back photos). ` +
      `All inputs the Fat Map and CFFS engine need are in place. ` +
      `Open the client profile to review the inputs, then click Generate CFFS on the Foundational Synthesis panel when you're ready to begin interpretation. ` +
      `The CFFS reads the photos as part of Spatial Patterning, so the visual evidence will flow into the interpretation automatically.`
    footnote =
      opts.trigger === 'baseline'
        ? 'Baseline was the final form. Their portal now waits on the Foundational Reading you publish.'
        : 'Intake was the final form. Their portal now waits on the Foundational Reading you publish.'
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: fromBrand(),
      to: coach().email,
      subject,
      html: buildCoachNotificationEmail({
        eyebrow,
        heading,
        body,
        ctaLabel: 'Open client profile',
        ctaUrl: clientProfileUrl,
        footnote,
      }),
    })
    return { sent: true }
  } catch (err) {
    console.error('Onboarding-complete notification failed:', err)
    return { sent: false, reason: err instanceof Error ? err.message : 'send error' }
  }
}
