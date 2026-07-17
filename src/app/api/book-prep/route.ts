import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { logLeadEvent } from '@/lib/log-lead-event'
import { darkEmailSignature } from '@/lib/email-signature'
import { appUrl } from '@/lib/app-url'
import {
  fromBrand,
  darkEmailShell,
  emailLogo,
  emailEyebrow,
  emailHeading,
  emailBody,
  emailFeaturedCard,
  emailCta,
  EMAIL_GRAPHITE,
  EMAIL_BODY,
  EMAIL_MUTED,
  EMAIL_FF,
} from '@/lib/email-shell'
import { coach } from '@/config/tenant'
import { generateCallPrepReport, type PrepAnswers } from '@/lib/call-prep-report'

/** Preformatted multi-line block for AI report / raw answers inside a card. */
function preBlock(text: string, color: string): string {
  return `<pre style="margin:0;font-family:${EMAIL_FF};font-size:14px;line-height:1.65;color:${color};white-space:pre-wrap;word-wrap:break-word;">${text}</pre>`
}

// The AI synthesis can take a few seconds; give the route room.
export const maxDuration = 120

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const leadId = typeof body.leadId === 'string' ? body.leadId : ''
  const answers: PrepAnswers = {
    goal: str(body.goal),
    frustration: str(body.frustration),
    tried: str(body.tried),
    age: str(body.age),
    sex: str(body.sex),
    height: str(body.height),
    weight: str(body.weight),
    routine: str(body.routine),
    other: str(body.other),
  }

  if (!leadId || !answers.goal) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: lead } = await admin
    .from('leads')
    .select(
      'id, name, email, scorecard_score, scorecard_body_state, scorecard_section_scores, approach_response, investment_readiness, lead_quality, biological_sex, age_band, fat_storage, cycle_status',
    )
    .eq('id', leadId)
    .maybeSingle()

  if (!lead) {
    return NextResponse.json({ error: 'We could not find your booking. Please use the link from your confirmation email.' }, { status: 404 })
  }

  const name = (lead.name as string) || 'there'

  // Persist the answers to the lead timeline first — never lose them even if
  // the AI report or email fails.
  const notesLines = [
    answers.goal ? `#1 goal: ${answers.goal}` : '',
    answers.frustration ? `Biggest frustration: ${answers.frustration}` : '',
    answers.tried ? `Already tried: ${answers.tried}` : '',
    [answers.age && `Age ${answers.age}`, answers.sex, answers.height && `${answers.height}`, answers.weight && `${answers.weight}`]
      .filter(Boolean).length
      ? `Stats: ${[answers.age && `age ${answers.age}`, answers.sex, answers.height, answers.weight].filter(Boolean).join(', ')}`
      : '',
    answers.routine ? `Normal week: ${answers.routine}` : '',
    answers.other ? `Other: ${answers.other}` : '',
  ].filter(Boolean)
  await logLeadEvent({
    leadId: lead.id as string,
    type: 'prep_form_completed',
    subject: 'Call prep form completed',
    notes: notesLines.join('\n'),
  })

  // Generate the AI prep report. If it fails, fall back to the raw answers so
  // Kade still gets the email.
  let report: string
  try {
    report = await generateCallPrepReport({
      name,
      answers,
      scorecard_score: lead.scorecard_score as number | null,
      scorecard_body_state: lead.scorecard_body_state as string | null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      scorecard_section_scores: lead.scorecard_section_scores as any,
      approach_response: lead.approach_response as 'A' | 'B' | 'C' | 'D' | null,
      investment_readiness: lead.investment_readiness as 'A' | 'B' | 'C' | 'D' | null,
      lead_quality: lead.lead_quality as 'green' | 'yellow' | 'red' | null,
      biological_sex: lead.biological_sex as string | null,
      age_band: lead.age_band as string | null,
      fat_storage: lead.fat_storage as string | null,
      cycle_status: lead.cycle_status as string | null,
    })
  } catch (e) {
    console.error('[book-prep] report generation failed:', e)
    report = 'AI report could not be generated this time. Their raw answers are below.'
  }

  // Email Kade the prep report.
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const leadUrl = `${appUrl()}/dashboard/leads/${lead.id}`
    const cleanEmail = (lead.email as string) || ''
    const rawAnswers = notesLines.join('\n')
    try {
      await resend.emails.send({
        from: fromBrand(),
        to: coach().email,
        replyTo: cleanEmail || undefined,
        subject: `Call prep — ${name}`,
        html: darkEmailShell(
          `${emailLogo(130)}
${emailEyebrow('Pre-call brief')}
${emailHeading(`Call prep — ${esc(name)}`, { size: 26 })}
${emailBody(esc(cleanEmail), { color: EMAIL_MUTED, size: 14, bottom: 10 })}
${emailBody('They completed the pre-call form. Here is your prep read.', { size: 15, bottom: 22 })}
${emailFeaturedCard(preBlock(esc(report), EMAIL_GRAPHITE))}
${emailFeaturedCard(preBlock(esc(rawAnswers || '(none)'), EMAIL_BODY), { eyebrow: 'Their raw answers' })}
${emailCta({ href: leadUrl, label: 'View lead →' })}
${darkEmailSignature()}`,
          { previewText: `Pre-call brief for ${esc(name)}` },
        ),
      })
    } catch (e) {
      console.error('[book-prep] email send failed:', e)
    }
  }

  return NextResponse.json({ success: true })
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null
}
