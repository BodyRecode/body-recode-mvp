import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { scoreFit, type FitAnswers } from '@/lib/collective-fit'
import {
  sendApplicantConfirmationEmail,
  sendCoachApplicationNotifyEmail,
  type FitTier,
} from '@/lib/collective-eoi-emails'

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

  // Two Collective-branded emails. Both non-fatal - a send failure must
  // never lose the application. Each wrapped in its own try/catch so one
  // failure doesn't block the other.
  const firstName = (name.split(' ')[0] || name).trim()

  // (1) Applicant confirmation (to the coach who applied, BCC Kade).
  try {
    await sendApplicantConfirmationEmail({ to: email, firstName })
  } catch (e) {
    console.error('[collective/submit] applicant confirmation failed (non-fatal):', e)
  }

  // (2) Kade coach notification (structured tier + dimensions + full details).
  try {
    await sendCoachApplicationNotifyEmail({
      applicantName: name,
      email,
      businessName: (body.business_name as string) || null,
      phone: (body.phone as string) || null,
      website: (body.website as string) || null,
      heardFrom: (body.heard_from as string) || null,
      modality: fitAnswers.modality,
      oneLiner: (body.one_liner as string) || null,
      methodClarity: fitAnswers.method_clarity,
      trackRecord: (body.track_record as string) || null,
      audience: fitAnswers.audience,
      audienceSize: (body.audience_size as string) || null,
      currentSetup: Array.isArray(body.current_setup) ? (body.current_setup as string[]) : null,
      whatsBroken: (body.whats_broken as string) || null,
      timeline: fitAnswers.timeline,
      mindset: fitAnswers.mindset,
      tier: fit.tier as FitTier,
      dimensions: fit.dimensions,
    })
  } catch (e) {
    console.error('[collective/submit] coach notify failed (non-fatal):', e)
  }

  return NextResponse.json(
    { ok: true, id: inserted?.id, tier: fit.tier, dimensions: fit.dimensions },
    { headers: CORS },
  )
}
