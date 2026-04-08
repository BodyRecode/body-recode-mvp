import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { logLeadEvent } from '@/lib/log-lead-event'
import { fireTrigger } from '@/lib/automation-engine'

const CORS = {
  'Access-Control-Allow-Origin': 'https://performance.bodyrecode.au',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

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
  const { first_name, email, score, body_state, source } = body as { first_name: string; email: string; score: number; body_state: string; source: string }
  console.log('[scorecard/submit] Received:', { first_name, email, score, body_state, source })

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
    const { data: newLead, error: leadError } = await supabase
      .from('leads')
      .insert({
        name: first_name.trim(),
        email: email.toLowerCase().trim(),
        source: source ?? 'other',
        source_detail: 'scorecard',
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

  // Log scorecard result as a lead event
  await logLeadEvent({
    leadId,
    type: 'scorecard_completed',
    subject: 'Scorecard completed',
    notes: `Score: ${score}/15. Body state: ${body_state}.`,
  })
  console.log('[scorecard/submit] Event logged for lead:', leadId)

  // Fire form_submitted trigger for scorecard-specific automations
  await fireTrigger('form_submitted', { leadId }, { form: 'scorecard' })
  console.log('[scorecard/submit] Automation triggered for lead:', leadId)

  // Notify coach
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Body Recode <kade@bodyrecode.au>',
      to: 'kade@bodyrecode.au',
      subject: `New Scorecard — ${first_name} (${body_state}, ${score}/15)`,
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background-color:#0c0a09;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#0c0a09" style="background-color:#0c0a09;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#111110" style="max-width:480px;background-color:#111110;border-radius:16px;border:1px solid #1c1917;overflow:hidden;">
          <tr>
            <td bgcolor="#111110" style="background-color:#111110;padding:28px 40px;border-bottom:1px solid #1c1917;">
              <img src="https://bodyrecode.au/logo-teal.png" width="110" alt="Body Recode" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td bgcolor="#111110" style="background-color:#111110;padding:32px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#ffffff;">${first_name} just completed the scorecard.</p>
              <p style="margin:0 0 24px;font-size:14px;color:#a8a29e;">${email}</p>
              <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;width:100%;">
                <tr>
                  <td style="padding:14px 20px;background:#1a1a1a;border-radius:10px;border:1px solid #222;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#57534e;letter-spacing:0.08em;text-transform:uppercase;">Score</p>
                    <p style="margin:0;font-size:24px;font-weight:900;color:#ffffff;">${score}<span style="font-size:14px;color:#57534e;font-weight:500;"> / 15</span></p>
                  </td>
                  <td style="width:12px;"></td>
                  <td style="padding:14px 20px;background:#1a1a1a;border-radius:10px;border:1px solid #222;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#57534e;letter-spacing:0.08em;text-transform:uppercase;">Body State</p>
                    <p style="margin:0;font-size:16px;font-weight:700;color:#14b8a6;">${body_state}</p>
                  </td>
                </tr>
              </table>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/leads" style="display:inline-block;padding:12px 24px;background:#14b8a6;color:#000;font-size:13px;font-weight:700;text-decoration:none;border-radius:8px;">View in dashboard</a>
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
