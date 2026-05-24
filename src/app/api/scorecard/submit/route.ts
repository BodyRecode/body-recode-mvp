import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { logLeadEvent } from '@/lib/log-lead-event'
import { fireTrigger } from '@/lib/automation-engine'
import { generatePreCallBrief } from '@/lib/pre-call-brief'
import { appUrl } from '@/lib/app-url'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// Map source URL params to allowed leads.source CHECK constraint values.
// Anything not in this map AND not in the allowed list falls through to 'other'.
const SOURCE_MAP: Record<string, string> = {
  // QR codes (gym floor face-to-face)
  qr_floor_banner: 'gym_floor',
  qr_window: 'gym_floor',
  qr_card: 'gym_floor',
  qr_flyer: 'gym_floor',
  // Gym DM follow-ups (complementary first session bookings)
  gym_complementary: 'gym_floor',
  // LinkedIn (Body Recode executive reframe channel)
  // All linkedin_* variants collapse to the single 'linkedin' constraint value;
  // the original param is preserved on the lead row as source_detail.
  linkedin_post: 'linkedin',
  linkedin_comment: 'linkedin',
  linkedin_profile: 'linkedin',
}

// Source values the leads.source CHECK constraint accepts directly.
const ALLOWED_SOURCES = new Set(['quiz', 'other', 'gym_floor', 'instagram', 'facebook', 'direct', 'linkedin'])

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

// POST /api/scorecard/submit
// Creates or finds a lead, logs their scorecard result, fires automation trigger

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch (e) {
    console.error('[scorecard/submit] Failed to parse JSON body:', e)
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400, headers: CORS })
  }
  const { first_name, last_name, email, score, body_state, source, section_scores, approach_response, investment_readiness } = body as {
    first_name: string
    last_name?: string
    email: string
    score: number
    body_state: string
    source: string
    section_scores?: Record<string, number>
    approach_response?: 'A' | 'B' | 'C' | 'D'
    investment_readiness?: 'A' | 'B' | 'C' | 'D'
  }
  console.log('[scorecard/submit] Received:', { first_name, last_name, email, score, body_state, source, approach_response, investment_readiness })

  // Compose full name for leads.name. Surname optional on legacy callers
  // (existing scorecard variants and any external clients still posting
  // just first_name keep working — they get name = first_name only).
  const fullName = last_name?.trim()
    ? `${first_name.trim()} ${last_name.trim()}`
    : first_name.trim()

  // Compute lead quality from qualifier answers.
  // Behaviour red flag: approach C/D (push harder / get frustrated).
  // Investment red flag: investment C/D (just exploring / free only).
  // Two reds = red, one = yellow, zero = green.
  let redCount = 0
  if (approach_response === 'C' || approach_response === 'D') redCount++
  if (investment_readiness === 'C' || investment_readiness === 'D') redCount++
  const leadQuality: 'green' | 'yellow' | 'red' | null =
    !approach_response || !investment_readiness ? null
    : redCount === 0 ? 'green'
    : redCount === 1 ? 'yellow'
    : 'red'
  const redFlag = redCount >= 1

  if (!first_name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Name and email are required.' }, { status: 400, headers: CORS })
  }

  const supabase = createAdminClient()

  // Find or create lead — fetch all rows by email, take first in JS to avoid PostgREST single-row errors
  const { data: existingRows, error: lookupError } = await supabase
    .from('leads')
    .select('id, coach_id')
    .eq('email', email.toLowerCase().trim())

  if (lookupError) {
    console.error('[scorecard/submit] Lead lookup error:', lookupError)
    return NextResponse.json({ error: 'Database error.' }, { status: 500, headers: CORS })
  }

  const existing = existingRows?.[0] ?? null

  let leadId: string

  if (existing) {
    leadId = existing.id
    console.log('[scorecard/submit] Found existing lead:', leadId)
  } else {
    // Resolve to a constraint-safe source while preserving the original as source_detail.
    let dbSource: string
    let dbSourceDetail: string
    if (SOURCE_MAP[source]) {
      dbSource = SOURCE_MAP[source]
      dbSourceDetail = source
    } else if (source && ALLOWED_SOURCES.has(source)) {
      dbSource = source
      dbSourceDetail = 'scorecard'
    } else {
      dbSource = 'other'
      dbSourceDetail = source || 'scorecard'
    }

    const { data: newLead, error: leadError } = await supabase
      .from('leads')
      .insert({
        name: fullName,
        email: email.toLowerCase().trim(),
        source: dbSource,
        source_detail: dbSourceDetail,
        status: 'new_check_in',
        active: true,
      })
      .select('id')
      .single()

    if (leadError || !newLead) {
      console.error('[scorecard/submit] Lead insert error:', leadError)
      return NextResponse.json({ error: 'Failed to create lead.' }, { status: 500, headers: CORS })
    }

    leadId = newLead.id
    console.log('[scorecard/submit] Created new lead:', leadId)

    // Fire lead_created automation
    await fireTrigger('lead_created', { leadId })
  }

  // Persist scorecard result directly on the lead record
  await supabase
    .from('leads')
    .update({
      scorecard_score: score,
      scorecard_body_state: body_state,
      scorecard_section_scores: section_scores ?? null,
      approach_response: approach_response ?? null,
      investment_readiness: investment_readiness ?? null,
      red_flag: redFlag,
      lead_quality: leadQuality,
      updated_at: new Date().toISOString(),
    })
    .eq('id', leadId)

  // Auto-generate the pre-call brief from the scorecard data.
  // Wrapped so any failure here never blocks the submit flow.
  try {
    const brief = generatePreCallBrief({
      name: first_name.trim(),
      scorecard_score: score,
      scorecard_body_state: body_state as 'Depleted State' | 'Transitioning State' | 'Ready State',
      scorecard_section_scores: section_scores ?? {},
      approach_response: approach_response ?? null,
      investment_readiness: investment_readiness ?? null,
      lead_quality: leadQuality,
    })
    await supabase.from('leads').update({ pre_call_brief: brief }).eq('id', leadId)
    console.log('[scorecard/submit] Pre-call brief generated for lead:', leadId)
  } catch (briefErr) {
    console.error('[scorecard/submit] Pre-call brief generation failed:', briefErr)
    // Don't fail the request - the brief can be regenerated later via the backfill route.
  }

  // Log scorecard result as a lead event
  const qualifierNote = leadQuality
    ? ` Quality: ${leadQuality}${redFlag ? ' (RED FLAG)' : ''}. Approach: ${approach_response}. Investment: ${investment_readiness}.`
    : ''
  await logLeadEvent({
    leadId,
    type: 'scorecard_completed',
    subject: 'Scorecard completed',
    notes: `Score: ${score}/15. Body state: ${body_state}.${qualifierNote}${section_scores ? ' Sections: ' + JSON.stringify(section_scores) : ''}`,
  })
  console.log('[scorecard/submit] Event logged for lead:', leadId)

  // Fire form_submitted trigger for scorecard-specific automations
  await fireTrigger('form_submitted', { leadId }, { form: 'scorecard' })
  console.log('[scorecard/submit] Automation triggered for lead:', leadId)

  // Map body state to its display color
  const stateColor =
    body_state === 'Depleted State' ? '#DC2626' :
    body_state === 'Transitioning State' ? '#B7791F' :
    '#1B6DFC' // Ready State

  // Lead quality color
  const qualityColor =
    leadQuality === 'red' ? '#DC2626' :
    leadQuality === 'yellow' ? '#B7791F' :
    leadQuality === 'green' ? '#1B6DFC' :
    '#999999'

  // Notify coach
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Body Recode <kade@bodyrecode.au>',
      to: 'kade@bodyrecode.au',
      subject: `New Scorecard — ${first_name} (${body_state}, ${score}/15)`,
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background-color:#FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="max-width:480px;background-color:#FFFFFF;border-radius:16px;border:1px solid #E5E5E5;overflow:hidden;">
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:28px 40px;border-bottom:1px solid #E5E5E5;">
              <img src="https://bodyrecode.au/logo-black.png" width="110" alt="Body Recode" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:32px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#1A1A1A;">${first_name} just completed the scorecard.</p>
              <p style="margin:0 0 24px;font-size:14px;color:#6B6B6B;">${email}</p>
              <table cellpadding="0" cellspacing="0" style="margin-bottom:16px;width:100%;">
                <tr>
                  <td style="padding:14px 20px;background:#1A1A1A;border-radius:10px;border:1px solid #222;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#999999;letter-spacing:0.08em;text-transform:uppercase;">Score</p>
                    <p style="margin:0;font-size:24px;font-weight:900;color:#1A1A1A;">${score}<span style="font-size:14px;color:#999999;font-weight:500;"> / 15</span></p>
                  </td>
                  <td style="width:12px;"></td>
                  <td style="padding:14px 20px;background:#1A1A1A;border-radius:10px;border:1px solid #222;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#999999;letter-spacing:0.08em;text-transform:uppercase;">Body State</p>
                    <p style="margin:0;font-size:16px;font-weight:700;color:${stateColor};">${body_state}</p>
                  </td>
                </tr>
              </table>
              ${leadQuality ? `
              <div style="padding:14px 20px;background:${leadQuality === 'red' ? 'rgba(239,68,68,0.08)' : leadQuality === 'yellow' ? 'rgba(245,158,11,0.08)' : 'rgba(27,109,252,0.08)'};border-radius:10px;border:1px solid ${qualityColor}33;margin-bottom:24px;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#999999;letter-spacing:0.08em;text-transform:uppercase;">Lead Quality</p>
                <p style="margin:0 0 10px;font-size:16px;font-weight:800;color:${qualityColor};text-transform:uppercase;letter-spacing:0.04em;">${leadQuality}${redFlag ? ' — Red Flag' : ''}</p>
                <p style="margin:0;font-size:13px;color:#6B6B6B;line-height:1.6;">Approach: ${approach_response} · Investment: ${investment_readiness}</p>
              </div>
              ` : ''}
              <a href="${appUrl()}/dashboard/leads" style="display:inline-block;padding:12px 24px;background:#1B6DFC;color:#000;font-size:13px;font-weight:700;text-decoration:none;border-radius:8px;">View in dashboard</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body></html>`,
    })
  }

  return NextResponse.json({ success: true, lead_id: leadId }, { headers: CORS })
}
