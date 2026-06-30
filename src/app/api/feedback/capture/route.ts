// POST /api/feedback/capture
//
// Public endpoint. Captures a feedback response at a specific funnel stage +
// moment. Returns the permission token so the caller can show "we'll email you
// in 24h to ask if we can share this" confirmation.
//
// Body shape: see CaptureFeedbackInput in src/lib/feedback.ts.
//
// Rate-limited at the edge by IP hash later if abuse appears. For now relies on
// the funnel position itself (only people who reach Day 14 can submit Day 14
// feedback, etc) for natural throttling.

import { NextRequest, NextResponse } from 'next/server'
import { captureFeedback, hashIp } from '@/lib/feedback'

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const stage = body.stage as string | undefined
  const moment = body.moment as string | undefined

  if (!stage || !moment) {
    return NextResponse.json({ error: 'stage and moment required' }, { status: 400 })
  }

  // Validate stage enum
  const validStages = ['scorecard','challenge','blueprint','membership','coaching','churn']
  if (!validStages.includes(stage)) {
    return NextResponse.json({ error: 'invalid stage', valid: validStages }, { status: 400 })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const userAgent = request.headers.get('user-agent') ?? null

  const result = await captureFeedback({
    stage: stage as 'scorecard' | 'challenge' | 'blueprint' | 'membership' | 'coaching' | 'churn',
    moment,
    leadId: (body.leadId as string | undefined) ?? null,
    clientId: (body.clientId as string | undefined) ?? null,
    challengeEnrollmentId: (body.challengeEnrollmentId as string | undefined) ?? null,
    accuracyScore: (body.accuracyScore as number | undefined) ?? null,
    npsScore: (body.npsScore as number | undefined) ?? null,
    responseText: (body.responseText as string | undefined) ?? null,
    firstName: (body.firstName as string | undefined) ?? null,
    lastInitial: (body.lastInitial as string | undefined) ?? null,
    source: (body.source as string | undefined) ?? null,
    userAgent,
    ipHash: hashIp(ip),
  })

  if (!result.ok) {
    return NextResponse.json({ error: 'capture_failed', message: result.error }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    id: result.id,
    // Don't return the permissionToken to the client - keep it server-side
    // (token only goes in the consent email link)
  })
}
