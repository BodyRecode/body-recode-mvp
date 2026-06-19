import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { logLeadEvent } from '@/lib/log-lead-event'
import { fireTrigger } from '@/lib/automation-engine'
import { generatePreCallBrief } from '@/lib/pre-call-brief'
import { appUrl } from '@/lib/app-url'
import { fireMetaCapiEvent, extractClientContext } from '@/lib/meta-capi'
import {
  darkEmailShell,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody,
  emailCta, emailStatusCard,
  EMAIL_FF,
} from '@/lib/email-shell'
import { darkEmailSignature } from '@/lib/email-signature'

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

  // Lead quality color — traffic-light convention so the colour
  // actually matches the word (green = green, not Signal Blue).
  const qualityColor =
    leadQuality === 'red' ? '#DC2626' :
    leadQuality === 'yellow' ? '#D97706' :
    leadQuality === 'green' ? '#16A34A' :
    '#999999'

  // Notify coach
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)

    // Score + Body State stat cards (two-column, matching the /challenge stats-grid pattern).
    // Score number colour mirrors the Body State semantic colour
    // (Depleted = red, Transitioning = amber, Ready = Signal Blue)
    // so the two cards read as a pair, not two unrelated stats.
    const statsBlock = `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 16px;">
        <tr>
          <td width="50%" style="padding-right:6px;vertical-align:top;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#FFFFFF" style="background-color:#FFFFFF;">
              <tr>
                <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:14px 18px;border:1px solid #E5E5E5;border-radius:12px;font-family:${EMAIL_FF};">
                  <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#6B6B6B;letter-spacing:0.12em;text-transform:uppercase;font-family:${EMAIL_FF};">Score</p>
                  <p style="margin:0;font-size:28px;font-weight:900;color:${stateColor};letter-spacing:-0.02em;font-family:${EMAIL_FF};">${score}<span style="font-size:14px;color:#6B6B6B;font-weight:600;letter-spacing:0;"> / 15</span></p>
                </td>
              </tr>
            </table>
          </td>
          <td width="50%" style="padding-left:6px;vertical-align:top;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#FFFFFF" style="background-color:#FFFFFF;">
              <tr>
                <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:14px 18px;border:1px solid #E5E5E5;border-radius:12px;font-family:${EMAIL_FF};">
                  <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#6B6B6B;letter-spacing:0.12em;text-transform:uppercase;font-family:${EMAIL_FF};">Body State</p>
                  <p style="margin:0;font-size:16px;font-weight:800;color:${stateColor};letter-spacing:-0.01em;font-family:${EMAIL_FF};">${body_state}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`

    // Lead quality card (colored by quality, only shown if qualifiers were answered)
    const leadQualityRgba =
      leadQuality === 'red' ? '220,38,38' :
      leadQuality === 'yellow' ? '217,119,6' :
      leadQuality === 'green' ? '22,163,74' :
      '107,107,107'
    const leadQualityBlock = leadQuality
      ? `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="rgba(${leadQualityRgba},0.08)" style="background-color:rgba(${leadQualityRgba},0.08);margin:0 0 16px;">
        <tr>
          <td style="padding:16px 20px;border:1px solid rgba(${leadQualityRgba},0.25);border-left:3px solid ${qualityColor};border-radius:12px;font-family:${EMAIL_FF};">
            <p style="margin:0 0 6px;font-size:10px;font-weight:700;color:${qualityColor};letter-spacing:0.12em;text-transform:uppercase;font-family:${EMAIL_FF};">Lead Quality</p>
            <p style="margin:0 0 8px;font-size:18px;font-weight:800;color:${qualityColor};font-family:${EMAIL_FF};letter-spacing:-0.01em;">${leadQuality.toUpperCase()}${redFlag ? ' · Red Flag' : ''}</p>
            <p style="margin:0;font-size:13px;color:#4A4A4A;line-height:1.6;font-family:${EMAIL_FF};">Approach: <strong style="color:#1A1A1A;">${approach_response}</strong> · Investment: <strong style="color:#1A1A1A;">${investment_readiness}</strong></p>
          </td>
        </tr>
      </table>`
      : ''

    const coachInner = `
${emailLogo()}
${emailEyebrow('New Scorecard')}
${emailHeading(`${first_name} just completed the scorecard.`)}
${emailDivider()}
${emailBody(email, { color: '#6B6B6B', size: 14, bottom: 22 })}
${statsBlock}
${leadQualityBlock}
${emailStatusCard({
  eyebrow: 'Next step',
  headline: 'Review the lead in the dashboard',
  body: 'Full scorecard breakdown, qualifier answers, pre-call brief and all lead context available in one place.',
})}
${emailCta({ href: `${appUrl()}/dashboard/leads`, label: 'Open dashboard' })}
${darkEmailSignature()}
`

    await resend.emails.send({
      from: 'Body Recode <kade@bodyrecode.au>',
      to: 'kade@bodyrecode.au',
      subject: `New Scorecard — ${first_name} (${body_state}, ${score}/15)`,
      html: darkEmailShell(coachInner, { previewText: `${first_name} just completed the scorecard — ${body_state}, ${score}/15.` }),
    })
  }

  // Fire Meta Conversions API event server-side.
  // Mirrors the browser-side Lead event the scorecard frontend fires, but
  // hashes PII and includes IP/UA so we recover iOS-blocked attribution.
  // Non-blocking — failure here must not break the user response.
  try {
    const { clientIp, clientUserAgent } = extractClientContext(request)
    await fireMetaCapiEvent({
      eventName: 'CompleteRegistration',
      eventSourceUrl: 'https://performance.bodyrecode.au/scorecard',
      actionSource: 'website',
      userData: {
        email,
        firstName: first_name,
        lastName: last_name || undefined,
        country: 'AU',
        clientIp,
        clientUserAgent,
      },
      customData: {
        content_name: 'scorecard_complete',
        content_category: body_state,
        value: score,
        currency: 'AUD',
        source,
      },
    })
  } catch (capiErr) {
    console.error('[scorecard/submit] CAPI fire threw (non-fatal):', capiErr)
  }

  return NextResponse.json({ success: true, lead_id: leadId }, { headers: CORS })
}
