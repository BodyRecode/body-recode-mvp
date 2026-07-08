import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { scoreFit, type FitAnswers } from '@/lib/collective-fit'
import { coach } from '@/config/tenant'
import { fromCoach } from '@/lib/email-shell'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

// POST /api/collective/submit — capture a Collective Fit Scorecard application,
// score its tier, and notify Kade. Returns the tier so the page can render the result.
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400, headers: CORS })
  }

  const name = String(body.name ?? '').trim()
  const email = String(body.email ?? '').trim()
  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required.' }, { status: 400, headers: CORS })
  }

  const fitAnswers: FitAnswers = {
    modality: (body.modality as FitAnswers['modality']) ?? 'other',
    method_clarity: (body.method_clarity as FitAnswers['method_clarity']) ?? 'figuring_out',
    audience: (body.audience as FitAnswers['audience']) ?? 'not_yet',
    timeline: (body.timeline as FitAnswers['timeline']) ?? 'exploring',
    mindset: (body.mindset as FitAnswers['mindset']) ?? 'ownership',
  }
  const fit = scoreFit(fitAnswers)

  const admin = createAdminClient()
  const { data: inserted, error } = await admin
    .from('collective_applications')
    .insert({
      name,
      email,
      business_name: (body.business_name as string) || null,
      phone: (body.phone as string) || null,
      website: (body.website as string) || null,
      heard_from: (body.heard_from as string) || null,
      modality: fitAnswers.modality,
      one_liner: (body.one_liner as string) || null,
      method_clarity: fitAnswers.method_clarity,
      track_record: (body.track_record as string) || null,
      audience: fitAnswers.audience,
      audience_size: (body.audience_size as string) || null,
      current_setup: Array.isArray(body.current_setup) ? (body.current_setup as string[]) : null,
      whats_broken: (body.whats_broken as string) || null,
      timeline: fitAnswers.timeline,
      mindset: fitAnswers.mindset,
      answers: body,
      tier: fit.tier,
      dimension_scores: fit.dimensions,
      status: 'new',
    })
    .select('id')
    .single()

  if (error) {
    console.error('[collective/submit] insert failed:', error)
    return NextResponse.json({ error: 'Could not save your application.' }, { status: 500, headers: CORS })
  }

  // Notify Kade. Non-fatal — a notify failure must not lose the application.
  try {
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const tierLabel = fit.tier === 'ready' ? '🟢 Collective-ready' : fit.tier === 'building' ? '🟡 Building' : '🔴 Not yet'
      const row = (k: string, v: unknown) => v ? `<tr><td style="padding:4px 12px 4px 0;color:#6B6B6B;">${k}</td><td style="padding:4px 0;color:#1A1A1A;">${String(v)}</td></tr>` : ''
      await resend.emails.send({
        from: fromCoach(),
        to: coach().adminEmail,
        subject: `New Collective application — ${name} (${fit.tier})`,
        html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;color:#1A1A1A;">
          <p style="font-size:18px;font-weight:700;margin:0 0 4px;">${tierLabel}</p>
          <p style="font-size:13px;color:#6B6B6B;margin:0 0 16px;">Method ${fit.dimensions.method} · Audience ${fit.dimensions.audience} · Modality ${fit.dimensions.modality} · Readiness ${fit.dimensions.readiness}</p>
          <table style="font-size:14px;border-collapse:collapse;">
            ${row('Name', name)}${row('Business', body.business_name)}${row('Email', email)}${row('Phone', body.phone)}${row('Website', body.website)}
            ${row('Modality', fitAnswers.modality)}${row('One-liner', body.one_liner)}${row('Method', fitAnswers.method_clarity)}${row('Track record', body.track_record)}
            ${row('Audience', `${fitAnswers.audience} (${body.audience_size ?? '—'})`)}${row('Setup', Array.isArray(body.current_setup) ? (body.current_setup as string[]).join(', ') : '')}${row("What's broken", body.whats_broken)}
            ${row('Timeline', fitAnswers.timeline)}${row('Mindset', fitAnswers.mindset)}${row('Heard via', body.heard_from)}
          </table>
        </div>`,
      })
    }
  } catch (e) {
    console.error('[collective/submit] notify failed (non-fatal):', e)
  }

  return NextResponse.json(
    { ok: true, id: inserted?.id, tier: fit.tier, dimensions: fit.dimensions },
    { headers: CORS },
  )
}
