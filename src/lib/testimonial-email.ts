/**
 * The email a coach sends when they ask a client for a testimonial.
 *
 * Light, because a client reads it: a tool is dark, a document is light, and an
 * email is something a person reads. darkEmailShell is the branded shell that
 * renders ON WHITE; the name is historical.
 *
 * IT ASKS ONCE AND SAYS WHAT HAPPENS TO THE ANSWER. No follow-up chase is wired
 * on purpose. Chasing somebody for a compliment is the fastest way to get a
 * polite one, which is worth nothing to a coach and embarrassing to publish.
 */

import { Resend } from 'resend'
import { createAdminClient } from './supabase/admin'
import {
  darkEmailShell, emailLogo, emailEyebrow, emailHeading, emailDivider,
  emailBody, emailCta, emailUrlFallback, fromCoach,
} from './email-shell'
import { darkEmailSignature } from './email-signature'
import { appUrl } from './app-url'
import { coach } from '@/config/tenant'

export function buildTestimonialAskEmail(ctx: { firstName: string; token: string }): { subject: string; html: string } {
  const url = `${appUrl()}/feedback/testimonial/${ctx.token}`
  const me = coach().firstName
  const subject = `${ctx.firstName}, would you write a few lines about how it has gone?`

  const body = `
${emailLogo()}
${emailEyebrow('A small ask')}
${emailHeading(`${ctx.firstName}, would you write a few lines?`)}
${emailDivider()}
${emailBody(`Hi ${ctx.firstName},<br /><br />I would like to be able to show people what working through this is actually like, in the words of someone who has done it rather than mine.`, { color: '#3A3A3A', size: 16, bottom: 16 })}
${emailBody('A few sentences is plenty. What it was like before, what changed, and whether you would tell someone else to do it.', { color: '#3A3A3A', size: 15, bottom: 12 })}
${emailBody('You choose how you are named on the same page: your first name, your first name and last initial, or anonymously. Nothing appears anywhere until you have chosen, and you can say no on that page without writing anything.', { color: '#3A3A3A', size: 14, bottom: 20 })}

${emailCta({ href: url, label: 'Write a few lines' })}
${emailUrlFallback(url)}

${emailBody(`Thank you either way.<br />${me}`, { color: '#6B6B6B', size: 13, bottom: 20 })}
${darkEmailSignature()}
`

  return {
    subject,
    html: darkEmailShell(body, { previewText: 'A few sentences about how it has gone, and you choose how you are named.' }),
  }
}

export async function sendTestimonialAsk(feedbackId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!process.env.RESEND_API_KEY) return { ok: false, error: 'RESEND_API_KEY missing' }

  const admin = createAdminClient()
  const { data: row } = await admin
    .from('feedback_responses')
    .select('id, client_id, first_name, permission_token')
    .eq('id', feedbackId)
    .maybeSingle()
  if (!row) return { ok: false, error: 'request not found' }
  if (!row.permission_token) return { ok: false, error: 'no link on this request' }

  const { data: client } = await admin
    .from('clients')
    .select('email, name')
    .eq('id', row.client_id as string)
    .maybeSingle()
  const email = client?.email as string | null
  if (!email) return { ok: false, error: 'this client has no email address on file' }

  const built = buildTestimonialAskEmail({
    firstName: (row.first_name as string | null) ?? ((client?.name as string | null) ?? '').split(' ')[0] ?? 'there',
    token: row.permission_token as string,
  })

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: fromCoach(),
    to: email,
    subject: built.subject,
    html: built.html,
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
