// Permission-to-share consent emails for the feedback system.
// Fired ~24h after captureFeedback() with the response text quoted back +
// accept/deny links keyed by permission_token.

import { Resend } from 'resend'
import { createAdminClient } from './supabase/admin'
import {
  darkEmailShell, emailLogo, emailEyebrow, emailHeading, emailDivider,
  emailBody, emailCta, emailFeaturedCard, emailUrlFallback,
} from './email-shell'
import { darkEmailSignature } from './email-signature'
import { appUrl } from './app-url'
import { markPermissionRequested } from './feedback'
import { fromCoach } from '@/lib/email-shell'
import { coach } from '@/config/tenant'

interface ConsentEmailContext {
  feedbackId: string
  permissionToken: string
  email: string
  firstName: string
  stage: string
  responseText: string
}

export function buildConsentEmail(ctx: ConsentEmailContext): { subject: string; html: string } {
  const consentUrl = `${appUrl()}/feedback/consent/${ctx.permissionToken}`
  const stageLabel = ctx.stage === 'challenge' ? '14-Day Body Decode Challenge' : ctx.stage
  const subject = `${ctx.firstName}, can we share what you said about the ${stageLabel}?`

  const body = `
${emailLogo()}
${emailEyebrow('Permission to share')}
${emailHeading(`${ctx.firstName}, your words are powerful.`)}
${emailDivider()}
${emailBody(`Hi ${ctx.firstName},<br /><br />A few days ago you shared this feedback after your ${stageLabel}:`, { color: '#3A3A3A', size: 16, bottom: 16 })}

${emailFeaturedCard(`
  <p style="margin:0;font-size:16px;color:#1A1A1A;line-height:1.65;font-style:italic;">&ldquo;${ctx.responseText}&rdquo;</p>
`, { eyebrow: 'Your feedback' })}

${emailBody('We would love to use what you said as a testimonial - on the Body Recode website, in marketing emails, or on Instagram. With your explicit permission.', { color: '#3A3A3A', size: 15, bottom: 12 })}
${emailBody('Click below to choose how you would like to be attributed (first name only, first name + last initial, or anonymous) and confirm permission. Or decline if you would rather keep this private.', { color: '#3A3A3A', size: 14, bottom: 20 })}

${emailCta({ href: consentUrl, label: 'Choose attribution + decide' })}
${emailUrlFallback(consentUrl)}

${emailBody('Either way, your feedback stays in our internal records as coaching data. The difference is only whether the quote can appear publicly.', { color: '#6B6B6B', size: 13, bottom: 20 })}
${darkEmailSignature()}
`

  return {
    subject,
    html: darkEmailShell(body, { previewText: `Tap to choose how you would like to be attributed, or decline if you would prefer to keep this private.` }),
  }
}

/**
 * Fires the consent email for a feedback record. Caller passes the feedback id;
 * we fetch the needed context, send the email, and flip permission_status to
 * 'requested'. Idempotent on the row's permission_status (won't double-send).
 */
export async function sendConsentEmail(feedbackId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!process.env.RESEND_API_KEY) return { ok: false, error: 'RESEND_API_KEY missing' }

  const admin = createAdminClient()
  const { data: feedback, error } = await admin
    .from('feedback_responses')
    .select('id, permission_status, permission_token, lead_id, client_id, stage, response_text, first_name')
    .eq('id', feedbackId)
    .single()
  if (error || !feedback) return { ok: false, error: error?.message ?? 'feedback not found' }
  if (feedback.permission_status !== 'pending') {
    return { ok: false, error: `permission already in state: ${feedback.permission_status}` }
  }
  if (!feedback.response_text || feedback.response_text.trim().length === 0) {
    return { ok: false, error: 'no response_text to request permission for' }
  }
  if (!feedback.permission_token) return { ok: false, error: 'no permission_token on row' }

  // Find email + first name from lead_id or client_id
  let email: string | null = null
  let firstName: string | null = feedback.first_name as string | null

  if (feedback.lead_id) {
    const { data: lead } = await admin.from('leads').select('email, name').eq('id', feedback.lead_id).single()
    if (lead) {
      email = lead.email
      if (!firstName && lead.name) firstName = (lead.name as string).split(' ')[0]
    }
  }
  if (!email && feedback.client_id) {
    const { data: client } = await admin.from('clients').select('email, first_name').eq('id', feedback.client_id).single()
    if (client) {
      email = client.email
      if (!firstName) firstName = client.first_name as string | null
    }
  }
  if (!email) return { ok: false, error: 'could not resolve recipient email from lead_id or client_id' }

  const built = buildConsentEmail({
    feedbackId: feedback.id as string,
    permissionToken: feedback.permission_token as string,
    email,
    firstName: firstName ?? 'there',
    stage: feedback.stage as string,
    responseText: feedback.response_text as string,
  })

  const resend = new Resend(process.env.RESEND_API_KEY)
  const r = await resend.emails.send({
    from: fromCoach(),
    to: email,
    bcc: coach().email,
    subject: built.subject,
    html: built.html,
  })
  if (r.error) return { ok: false, error: r.error.message }

  await markPermissionRequested(feedbackId)
  return { ok: true }
}
