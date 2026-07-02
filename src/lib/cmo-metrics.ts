/**
 * CMO metrics — funnel + acquisition + content signals from live Supabase data.
 *
 * Same pattern as cfo-metrics.ts: null-safe fallbacks, parallel queries,
 * graceful degradation when tables are empty or missing. Coach dashboards
 * must not crash on partial data.
 *
 * All time windows are naive (now - N * 24h). Good enough for weekly CMO
 * reviews; can add timezone-aware windows later if needed.
 */

import { createAdminClient } from './supabase/admin'
import { getWaveStatus } from './challenge-waves'

export type CmoSnapshot = {
  // Funnel volumes (trailing 30 days)
  scorecardsCompleted30d: number | null
  leadsCaptured30d: number | null
  challengeEnrollments30d: number | null
  blueprintPurchases30d: number | null
  membershipStarts30d: number | null

  // Conversion rates
  scorecardToChallengeCvr: number | null   // %
  challengeToBlueprintCvr: number | null   // %
  blueprintToMembershipCvr: number | null  // %

  // Wave status
  waveNumber: number | null
  waveLabel: string | null
  waveCap: number | null
  waveFilled: number | null
  waveFillPct: number | null                // %

  // Ad performance
  adSpend30d: number | null
  adLeads30d: number | null
  costPerLead30d: number | null
  activeAdCampaigns: number | null

  // Content pulse
  contentPosts7d: number | null
  contentPosts30d: number | null

  computedAt: string
}

export async function getCmoSnapshot(): Promise<CmoSnapshot> {
  const admin = createAdminClient()
  const now = new Date()
  const cutoff7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const cutoff30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    scorecards30d,
    leads30d,
    challenges30d,
    blueprints30d,
    memberships30d,
    waveStatus,
    posts7d,
    posts30d,
  ] = await Promise.all([
    admin
      .from('scorecard_reports')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', cutoff30d)
      .then((r) => (r.error ? null : r.count ?? 0)),
    admin
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', cutoff30d)
      .then((r) => (r.error ? null : r.count ?? 0)),
    admin
      .from('challenge_enrollments')
      .select('id', { count: 'exact', head: true })
      .gte('enrolled_at', cutoff30d)
      .then((r) => (r.error ? null : r.count ?? 0)),
    admin
      .from('blueprint_enrollments')
      .select('id', { count: 'exact', head: true })
      .gte('purchase_date', cutoff30d)
      .then((r) => (r.error ? null : r.count ?? 0)),
    admin
      .from('membership_enrollments')
      .select('id', { count: 'exact', head: true })
      .gte('joined_at', cutoff30d)
      .then((r) => (r.error ? null : r.count ?? 0)),
    getWaveStatus(admin).catch(() => null),
    admin
      .from('calendar_posts')
      .select('id', { count: 'exact', head: true })
      .gte('date', cutoff7d.slice(0, 10))
      .then((r) => (r.error ? null : r.count ?? 0)),
    admin
      .from('calendar_posts')
      .select('id', { count: 'exact', head: true })
      .gte('date', cutoff30d.slice(0, 10))
      .then((r) => (r.error ? null : r.count ?? 0)),
  ])

  // Ad campaigns active during the last 30d
  let adSpend30d: number | null = null
  let adLeads30d: number | null = null
  let costPerLead30d: number | null = null
  let activeAdCampaigns: number | null = null

  const adRes = await admin
    .from('be_ad_campaigns')
    .select('spend, leads_count, date_from, date_to')
    .or(`date_from.gte.${cutoff30d.slice(0, 10)},date_to.gte.${cutoff30d.slice(0, 10)}`)
  if (!adRes.error) {
    const rows = (adRes.data ?? []) as Array<{
      spend: number | string
      leads_count: number | string | null
      date_from: string | null
      date_to: string | null
    }>
    activeAdCampaigns = rows.length
    adSpend30d = rows.reduce((sum, r) => sum + Number(r.spend || 0), 0)
    adLeads30d = rows.reduce((sum, r) => sum + Number(r.leads_count || 0), 0)
    costPerLead30d = adLeads30d > 0 ? adSpend30d / adLeads30d : null
  }

  // Conversion rates
  const scorecardToChallengeCvr =
    scorecards30d !== null && scorecards30d > 0 && challenges30d !== null
      ? (challenges30d / scorecards30d) * 100
      : null

  const challengeToBlueprintCvr =
    challenges30d !== null && challenges30d > 0 && blueprints30d !== null
      ? (blueprints30d / challenges30d) * 100
      : null

  const blueprintToMembershipCvr =
    blueprints30d !== null && blueprints30d > 0 && memberships30d !== null
      ? (memberships30d / blueprints30d) * 100
      : null

  return {
    scorecardsCompleted30d: scorecards30d,
    leadsCaptured30d: leads30d,
    challengeEnrollments30d: challenges30d,
    blueprintPurchases30d: blueprints30d,
    membershipStarts30d: memberships30d,
    scorecardToChallengeCvr,
    challengeToBlueprintCvr,
    blueprintToMembershipCvr,
    waveNumber: waveStatus?.current?.number ?? null,
    waveLabel: waveStatus?.current?.label ?? null,
    waveCap: waveStatus?.current?.cap ?? null,
    waveFilled: waveStatus?.taken ?? null,
    waveFillPct:
      waveStatus?.current?.cap && waveStatus.current.cap > 0
        ? ((waveStatus.taken ?? 0) / waveStatus.current.cap) * 100
        : null,
    adSpend30d,
    adLeads30d,
    costPerLead30d,
    activeAdCampaigns,
    contentPosts7d: posts7d,
    contentPosts30d: posts30d,
    computedAt: now.toISOString(),
  }
}
