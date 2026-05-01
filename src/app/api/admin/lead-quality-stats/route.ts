import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

type Tier = 'green' | 'yellow' | 'red'
type StatusCounts = Record<string, number>

interface TierStats {
  total: number
  by_status: StatusCounts
  zoom_booked: number
  zoom_completed: number
  closed_no_show: number
  closed_declined: number
  commencement_fee_paid: number
  show_rate: number | null
  close_rate: number | null
}

const ZOOM_BOOKED_STATUSES = new Set(['zoom_booked', 'zoom_1_booked'])
const ZOOM_COMPLETED_STATUSES = new Set(['zoom_completed', 'closed_declined', 'commencement_fee_paid', 'active_deliberate_start', 'active_coaching'])
const CLOSED_STATUSES = new Set(['commencement_fee_paid', 'active_deliberate_start', 'active_coaching'])

function emptyStats(): TierStats {
  return {
    total: 0,
    by_status: {},
    zoom_booked: 0,
    zoom_completed: 0,
    closed_no_show: 0,
    closed_declined: 0,
    commencement_fee_paid: 0,
    show_rate: null,
    close_rate: null,
  }
}

function rate(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null
  return Math.round((numerator / denominator) * 1000) / 10
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const secret = url.searchParams.get('secret') ?? request.headers.get('x-admin-secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const windowDays = Number(url.searchParams.get('days') ?? '7')
  const sinceIso = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString()

  const supabase = createAdminClient()

  // Window: leads created in the last N days that have a quality score.
  const { data: windowLeads, error: windowErr } = await supabase
    .from('leads')
    .select('lead_quality, red_flag, status')
    .gte('created_at', sinceIso)
    .not('lead_quality', 'is', null)

  // All-time: every scored lead (full sample for show/close rate, since
  // 7-day windows are too small for meaningful conversion stats).
  const { data: allLeads, error: allErr } = await supabase
    .from('leads')
    .select('lead_quality, red_flag, status, approach_response, investment_readiness')
    .not('lead_quality', 'is', null)

  if (windowErr || allErr) {
    return NextResponse.json({ error: windowErr?.message ?? allErr?.message }, { status: 500 })
  }

  const tiers: Tier[] = ['green', 'yellow', 'red']
  const windowCounts: Record<Tier, number> = { green: 0, yellow: 0, red: 0 }
  for (const l of windowLeads ?? []) {
    const tier = l.lead_quality as Tier | null
    if (tier && tier in windowCounts) windowCounts[tier]++
  }

  const allTime: Record<Tier, TierStats> = {
    green: emptyStats(),
    yellow: emptyStats(),
    red: emptyStats(),
  }

  for (const l of allLeads ?? []) {
    const tier = l.lead_quality as Tier | null
    if (!tier || !(tier in allTime)) continue
    const s = allTime[tier]
    s.total++
    s.by_status[l.status] = (s.by_status[l.status] ?? 0) + 1
    if (ZOOM_BOOKED_STATUSES.has(l.status) || ZOOM_COMPLETED_STATUSES.has(l.status) || l.status === 'closed_no_show') s.zoom_booked++
    if (ZOOM_COMPLETED_STATUSES.has(l.status)) s.zoom_completed++
    if (l.status === 'closed_no_show') s.closed_no_show++
    if (l.status === 'closed_declined') s.closed_declined++
    if (CLOSED_STATUSES.has(l.status)) s.commencement_fee_paid++
  }

  for (const tier of tiers) {
    const s = allTime[tier]
    s.show_rate = rate(s.zoom_completed, s.zoom_booked)
    s.close_rate = rate(s.commencement_fee_paid, s.zoom_completed)
  }

  // Aggregate red vs not-red comparison
  const redFlagged = emptyStats()
  const cleanLeads = emptyStats()
  for (const l of allLeads ?? []) {
    const target = l.red_flag ? redFlagged : cleanLeads
    target.total++
    if (ZOOM_BOOKED_STATUSES.has(l.status) || ZOOM_COMPLETED_STATUSES.has(l.status) || l.status === 'closed_no_show') target.zoom_booked++
    if (ZOOM_COMPLETED_STATUSES.has(l.status)) target.zoom_completed++
    if (l.status === 'closed_no_show') target.closed_no_show++
    if (CLOSED_STATUSES.has(l.status)) target.commencement_fee_paid++
  }
  redFlagged.show_rate = rate(redFlagged.zoom_completed, redFlagged.zoom_booked)
  redFlagged.close_rate = rate(redFlagged.commencement_fee_paid, redFlagged.zoom_completed)
  cleanLeads.show_rate = rate(cleanLeads.zoom_completed, cleanLeads.zoom_booked)
  cleanLeads.close_rate = rate(cleanLeads.commencement_fee_paid, cleanLeads.zoom_completed)

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    window_days: windowDays,
    new_leads_in_window: {
      total: (windowLeads ?? []).length,
      by_tier: windowCounts,
    },
    all_time: allTime,
    comparison: {
      red_flagged: redFlagged,
      clean: cleanLeads,
    },
    notes: {
      show_rate_definition: 'zoom_completed / zoom_booked',
      close_rate_definition: 'commencement_fee_paid / zoom_completed',
      hormozi_hypothesis: 'Red-flagged leads should show ~half the show rate and ~half the close rate of clean leads.',
    },
  })
}
