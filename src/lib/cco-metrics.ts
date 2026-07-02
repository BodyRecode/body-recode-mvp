/**
 * CCO metrics — client retention, at-risk signals, feedback triage, churn.
 *
 * Same pattern as cfo/cmo-metrics: null-safe, parallel queries, graceful
 * degradation. Coach dashboards must not crash on missing/empty tables.
 */

import { createAdminClient } from './supabase/admin'

export type CcoSnapshot = {
  // Client base
  activeClients: number | null
  clientsAdded30d: number | null
  clientsLifetime: number | null

  // Retention / churn
  churn30d: number | null                // cancelled subs in last 30d
  churn90d: number | null                // cancelled subs in last 90d
  churnRate30d: number | null            // % of active-at-window-start

  // Engagement signals
  activeClientsWithCheckin7d: number | null
  activeClientsWithoutCheckin14d: number | null   // at-risk signal
  checkinResponseRate30d: number | null            // % of expected

  // Feedback triage
  feedbackUnseen: number | null
  feedbackChurnRisk: number | null       // rows with churn_risk = true
  feedbackAwaitingConsent: number | null
  feedbackAvgAccuracy30d: number | null   // avg accuracy_score last 30d
  feedbackAvgNps30d: number | null         // avg nps_score last 30d

  computedAt: string
}

export async function getCcoSnapshot(): Promise<CcoSnapshot> {
  const admin = createAdminClient()
  const now = new Date()
  const cutoff7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const cutoff14d = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const cutoff30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const cutoff90d = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()

  const [
    activeClients,
    clientsAdded30d,
    clientsLifetime,
    churn30d,
    churn90d,
    activeAtStart30d,
    feedbackUnseen,
    feedbackChurn,
    feedbackAwaitingConsent,
    feedback30d,
  ] = await Promise.all([
    admin
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .then((r) => (r.error ? null : r.count ?? 0)),
    admin
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', cutoff30d)
      .then((r) => (r.error ? null : r.count ?? 0)),
    admin
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .then((r) => (r.error ? null : r.count ?? 0)),
    admin
      .from('client_subscriptions')
      .select('id', { count: 'exact', head: true })
      .gte('canceled_at', cutoff30d)
      .then((r) => (r.error ? null : r.count ?? 0)),
    admin
      .from('client_subscriptions')
      .select('id', { count: 'exact', head: true })
      .gte('canceled_at', cutoff90d)
      .then((r) => (r.error ? null : r.count ?? 0)),
    admin
      .from('client_subscriptions')
      .select('id', { count: 'exact', head: true })
      .or(`canceled_at.gte.${cutoff30d},canceled_at.is.null`)
      .lte('created_at', cutoff30d)
      .then((r) => (r.error ? null : r.count ?? 0)),
    admin
      .from('feedback_responses')
      .select('id', { count: 'exact', head: true })
      .is('coach_seen_at', null)
      .then((r) => (r.error ? null : r.count ?? 0)),
    admin
      .from('feedback_responses')
      .select('id', { count: 'exact', head: true })
      .eq('churn_risk', true)
      .then((r) => (r.error ? null : r.count ?? 0)),
    admin
      .from('feedback_responses')
      .select('id', { count: 'exact', head: true })
      .eq('permission_status', 'awaiting_consent')
      .then((r) => (r.error ? null : r.count ?? 0)),
    admin
      .from('feedback_responses')
      .select('accuracy_score, nps_score')
      .gte('created_at', cutoff30d)
      .then((r) => (r.error ? null : (r.data as Array<{ accuracy_score: number | null; nps_score: number | null }>))),
  ])

  // Compute check-in engagement — this requires a subquery on active clients + weekly_checkins
  let activeClientsWithCheckin7d: number | null = null
  let activeClientsWithoutCheckin14d: number | null = null
  let checkinResponseRate30d: number | null = null

  if (activeClients !== null && activeClients > 0) {
    const [{ data: recent7d }, { data: recent14d }, { data: checkins30d }] = await Promise.all([
      admin
        .from('weekly_checkins')
        .select('client_id')
        .gte('submitted_at', cutoff7d),
      admin
        .from('weekly_checkins')
        .select('client_id')
        .gte('submitted_at', cutoff14d),
      admin
        .from('weekly_checkins')
        .select('id')
        .gte('submitted_at', cutoff30d),
    ])

    if (recent7d && Array.isArray(recent7d)) {
      const unique = new Set(recent7d.map((r: { client_id: string }) => r.client_id))
      activeClientsWithCheckin7d = unique.size
    }
    if (recent14d && Array.isArray(recent14d)) {
      const uniqueRecent = new Set(recent14d.map((r: { client_id: string }) => r.client_id))
      // Active clients whose id is NOT in uniqueRecent — need to fetch active client ids
      const { data: activeClientIds } = await admin
        .from('clients')
        .select('id')
        .eq('status', 'active')
      if (activeClientIds) {
        const inactiveRecent = activeClientIds.filter(
          (c: { id: string }) => !uniqueRecent.has(c.id)
        )
        activeClientsWithoutCheckin14d = inactiveRecent.length
      }
    }
    if (checkins30d && Array.isArray(checkins30d)) {
      // Expected check-ins per active client per month ≈ 4.3
      const expected = activeClients * 4.3
      if (expected > 0) {
        checkinResponseRate30d = (checkins30d.length / expected) * 100
      }
    }
  }

  // Feedback averages
  let feedbackAvgAccuracy30d: number | null = null
  let feedbackAvgNps30d: number | null = null
  if (feedback30d && feedback30d.length > 0) {
    const accScores = feedback30d.map((r) => r.accuracy_score).filter((v): v is number => v !== null)
    const npsScores = feedback30d.map((r) => r.nps_score).filter((v): v is number => v !== null)
    feedbackAvgAccuracy30d = accScores.length > 0 ? accScores.reduce((a, b) => a + b, 0) / accScores.length : null
    feedbackAvgNps30d = npsScores.length > 0 ? npsScores.reduce((a, b) => a + b, 0) / npsScores.length : null
  }

  const churnRate30d =
    churn30d !== null && activeAtStart30d !== null && activeAtStart30d > 0
      ? (churn30d / activeAtStart30d) * 100
      : null

  return {
    activeClients,
    clientsAdded30d,
    clientsLifetime,
    churn30d,
    churn90d,
    churnRate30d,
    activeClientsWithCheckin7d,
    activeClientsWithoutCheckin14d,
    checkinResponseRate30d,
    feedbackUnseen,
    feedbackChurnRisk: feedbackChurn,
    feedbackAwaitingConsent,
    feedbackAvgAccuracy30d,
    feedbackAvgNps30d,
    computedAt: now.toISOString(),
  }
}
