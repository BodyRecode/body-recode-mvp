import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { inngest } from '@/lib/inngest'
import {
  ineligibleReason, INELIGIBLE_LABELS,
  type DormantCandidate, type Ineligible,
} from '@/lib/dormant-lead-eligibility'
import { buildDormantReadEmail, buildDormantOfferEmail, buildDormantSms } from '@/lib/dormant-lead-emails'

/**
 * Dormant lead reactivation: dry run, then send.
 *
 * GET  = dry run. Who would receive what, and who is excluded and why.
 * POST = actually enqueue the sequence. Requires ?confirm=1.
 *
 * The dry run is not optional politeness. The first thing this does is email 84
 * real people, seven of whom turned out to be test records including Kade's own
 * two addresses, and eighteen of whom have no body state so there is no read to
 * send them. Nobody should find that out by sending.
 */

async function loadCandidates() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('leads')
    .select('id, name, email, scorecard_body_state, scorecard_score, scorecard_profile, scorecard_profile_confidence, storage_direction, active, sms_opted_out_at, converted_to_client_id')
    .eq('status', 'new_check_in')
    .order('created_at', { ascending: true })
  return (data ?? []) as DormantCandidate[]
}

async function didChallengeMap(ids: string[]): Promise<Set<string>> {
  if (!ids.length) return new Set()
  const admin = createAdminClient()
  const { data } = await admin.from('challenge_enrollments').select('lead_id').in('lead_id', ids)
  return new Set((data ?? []).map(r => r.lead_id as string))
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const candidates = await loadCandidates()
  const eligible: DormantCandidate[] = []
  const excluded: Array<{ name: string | null; email: string | null; reason: string }> = []

  for (const c of candidates) {
    const reason = ineligibleReason(c)
    if (reason) excluded.push({ name: c.name, email: c.email, reason: INELIGIBLE_LABELS[reason] })
    else eligible.push(c)
  }

  const challenge = await didChallengeMap(eligible.map(c => c.id))

  const preview = eligible.map(c => {
    const ctx = {
      firstName: (c.name ?? '').split(' ')[0] || 'there',
      bodyState: c.scorecard_body_state as string,
      score: c.scorecard_score,
      profile: c.scorecard_profile,
      provisional: c.scorecard_profile_confidence === 'low',
      didChallenge: challenge.has(c.id),
      storageDirection: c.storage_direction as never,
    }
    return {
      name: c.name,
      email: c.email,
      state: c.scorecard_body_state,
      pattern: c.scorecard_profile ?? 'none named',
      touch1_subject: buildDormantReadEmail(ctx).subject,
      touch2_sms: c.sms_opted_out_at ? '(opted out of SMS)' : buildDormantSms(ctx),
      touch3_subject: buildDormantOfferEmail(ctx).subject,
    }
  })

  const byReason = excluded.reduce<Record<string, number>>((acc, e) => {
    acc[e.reason] = (acc[e.reason] ?? 0) + 1
    return acc
  }, {})

  return NextResponse.json({
    dryRun: true,
    totalDormant: candidates.length,
    wouldSend: eligible.length,
    excludedCount: excluded.length,
    excludedByReason: byReason,
    excluded,
    preview,
    note: 'Nothing has been sent. POST to this route with ?confirm=1 to enqueue.',
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (new URL(request.url).searchParams.get('confirm') !== '1') {
    return NextResponse.json(
      { error: 'Refusing to send without ?confirm=1. Run the GET dry run first.' },
      { status: 400 },
    )
  }

  const candidates = await loadCandidates()
  const eligible = candidates.filter(c => ineligibleReason(c) === null)

  let enqueued = 0
  for (const lead of eligible) {
    try {
      await inngest.send({ name: 'lead/dormant-reactivation', data: { leadId: lead.id } })
      enqueued++
    } catch (e) {
      console.error(`[dormant-reactivation] enqueue failed for ${lead.id}:`, e)
    }
  }

  return NextResponse.json({
    enqueued,
    skipped: candidates.length - eligible.length,
    note: 'Touch 1 sends immediately, SMS at +4 days, offer at +6 days after that. Each step re-checks and stops if they reply, book or convert.',
  })
}
