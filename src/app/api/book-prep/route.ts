import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { logLeadEvent } from '@/lib/log-lead-event'
import { darkEmailSignature } from '@/lib/email-signature'
import { appUrl } from '@/lib/app-url'
import { fromBrand } from '@/lib/email-shell'
import { coach, logoUrl } from '@/config/tenant'
import { generateCallPrepReport, type PrepAnswers } from '@/lib/call-prep-report'

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
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="color-scheme" content="light only"/></head>
<body style="margin:0;padding:0;background-color:#FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="max-width:560px;background-color:#FFFFFF;border-radius:16px;border:1px solid #E5E5E5;overflow:hidden;">
        <tr>
          <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:28px 40px;border-bottom:1px solid #E5E5E5;">
            <img src="${logoUrl()}" width="110" alt="Body Recode" style="display:block;"/>
          </td>
        </tr>
        <tr>
          <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:32px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#1A1A1A;">Call prep — ${esc(name)}</p>
            <p style="margin:0 0 20px;font-size:14px;color:#6B6B6B;">${esc(cleanEmail)}</p>
            <p style="margin:0 0 20px;font-size:13px;color:#666666;">They completed the pre-call form. Here is your prep read.</p>
            <div style="padding:20px 22px;background:#F7F7F7;border-radius:12px;border:1px solid #E5E5E5;margin-bottom:24px;">
              <pre style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;line-height:1.6;color:#1A1A1A;white-space:pre-wrap;word-wrap:break-word;">${esc(report)}</pre>
            </div>
            <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#999999;letter-spacing:0.08em;text-transform:uppercase;">Their raw answers</p>
            <div style="padding:16px 20px;background:#1a1a1a;border-radius:10px;border:1px solid #222;margin-bottom:24px;">
              <pre style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;line-height:1.6;color:#E5E5E5;white-space:pre-wrap;word-wrap:break-word;">${esc(rawAnswers || '(none)')}</pre>
            </div>
            <a href="${leadUrl}" style="display:inline-block;padding:12px 20px;border:1px solid #333;color:#6B6B6B;font-size:13px;text-decoration:none;border-radius:8px;">View Lead →</a>
            ${darkEmailSignature()}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
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
