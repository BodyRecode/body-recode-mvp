/**
 * COO metrics — capacity, service delivery, system health, ops queues.
 *
 * Same pattern as cfo/cmo/cco-metrics: null-safe, parallel queries.
 */

import { createAdminClient } from './supabase/admin'

const COACHING_CAPACITY_CAP = 15  // Kade's stated 1:1 client cap

export type CooSnapshot = {
  // Capacity
  activeClients: number | null
  capacityCap: number
  capacityPct: number | null

  // Reading pipeline (things awaiting coach approval)
  foundationalReadingsPending: number | null       // has CFFS, no client_reading_published_at
  programReadingsPending: number | null
  nutritionReadingsPending: number | null
  medicationsReadingsPending: number | null
  trajectoryReadingsPending: number | null
  totalPendingApproval: number | null

  // Time-to-first-reading (median hours)
  medianHoursToFirstReading: number | null

  // Testimonial / feedback ops
  testimonialsPublishedLifetime: number | null
  feedbackAwaitingApproval: number | null   // permission_status = granted, not yet marked published

  // Onboarding pipeline
  clientsInOnboarding: number | null         // status = scheduled or first 30 days
  clientsAwaitingHealthDeclaration: number | null

  computedAt: string
}

export async function getCooSnapshot(): Promise<CooSnapshot> {
  const admin = createAdminClient()
  const now = new Date()
  const cutoff30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    activeClients,
    foundationalPending,
    programPending,
    nutritionPending,
    medicationsPending,
    trajectoryPending,
    firstReadings,
    testimonialsLifetime,
    feedbackAwaitingApproval,
    clientsInOnboarding,
    clientsAwaitingHD,
  ] = await Promise.all([
    admin
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .then((r) => (r.error ? null : r.count ?? 0)),
    // Foundational reading pending = client has CFFS but no client_reading_published_at
    admin
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .not('cffs_generated_at', 'is', null)
      .is('client_reading_published_at', null)
      .then((r) => (r.error ? null : r.count ?? 0)),
    // Program reading pending = active clients with program generated but not published
    admin
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .is('program_reading_published_at', null)
      .then((r) => (r.error ? null : r.count ?? 0)),
    admin
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .is('nutrition_reading_published_at', null)
      .then((r) => (r.error ? null : r.count ?? 0)),
    admin
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .not('medications_reading_generated_at', 'is', null)
      .is('medications_reading_published_at', null)
      .then((r) => (r.error ? null : r.count ?? 0)),
    admin
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .is('trajectory_reading_published_at', null)
      .then((r) => (r.error ? null : r.count ?? 0)),
    // TTFR — active clients with cffs_generated_at + client_reading_published_at
    admin
      .from('clients')
      .select('cffs_generated_at, client_reading_published_at')
      .eq('status', 'active')
      .not('cffs_generated_at', 'is', null)
      .not('client_reading_published_at', 'is', null)
      .gte('created_at', cutoff30d)
      .then((r) => (r.error ? null : (r.data as Array<{ cffs_generated_at: string; client_reading_published_at: string }>))),
    admin
      .from('feedback_responses')
      .select('id', { count: 'exact', head: true })
      .not('testimonial_published_at', 'is', null)
      .then((r) => (r.error ? null : r.count ?? 0)),
    admin
      .from('feedback_responses')
      .select('id', { count: 'exact', head: true })
      .eq('permission_status', 'granted')
      .is('testimonial_published_at', null)
      .then((r) => (r.error ? null : r.count ?? 0)),
    admin
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .in('status', ['scheduled', 'active'])
      .gte('coaching_started_at', cutoff30d)
      .then((r) => (r.error ? null : r.count ?? 0)),
    admin
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .is('health_declaration_submitted_at', null)
      .then((r) => (r.error ? null : r.count ?? 0)),
  ])

  // Median TTFR (hours from CFFS generation to reading published)
  let medianHoursToFirstReading: number | null = null
  if (firstReadings && firstReadings.length > 0) {
    const hours = firstReadings
      .map((r) => {
        const start = new Date(r.cffs_generated_at).getTime()
        const end = new Date(r.client_reading_published_at).getTime()
        return (end - start) / (1000 * 60 * 60)
      })
      .filter((h) => h >= 0)
      .sort((a, b) => a - b)
    if (hours.length > 0) {
      const mid = Math.floor(hours.length / 2)
      medianHoursToFirstReading =
        hours.length % 2 === 0 ? (hours[mid - 1] + hours[mid]) / 2 : hours[mid]
    }
  }

  const totalPendingApproval =
    (foundationalPending ?? 0) +
    (programPending ?? 0) +
    (nutritionPending ?? 0) +
    (medicationsPending ?? 0) +
    (trajectoryPending ?? 0)

  const capacityPct =
    activeClients !== null ? (activeClients / COACHING_CAPACITY_CAP) * 100 : null

  return {
    activeClients,
    capacityCap: COACHING_CAPACITY_CAP,
    capacityPct,
    foundationalReadingsPending: foundationalPending,
    programReadingsPending: programPending,
    nutritionReadingsPending: nutritionPending,
    medicationsReadingsPending: medicationsPending,
    trajectoryReadingsPending: trajectoryPending,
    totalPendingApproval,
    medianHoursToFirstReading,
    testimonialsPublishedLifetime: testimonialsLifetime,
    feedbackAwaitingApproval,
    clientsInOnboarding,
    clientsAwaitingHealthDeclaration: clientsAwaitingHD,
    computedAt: now.toISOString(),
  }
}
