import { createAdminClient } from '@/lib/supabase/admin'
import FunnelClient from './funnel-client'

// Always fetch fresh - the funnel dashboard must reflect new enrollments
// the moment they happen, not the cached version from page-build time.
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function FunnelPage() {
  const admin = createAdminClient()

  const [
    { data: challengeEnrollments },
    { data: blueprintEnrollments },
    { data: membershipEnrollments },
    { data: blueprintCheckins },
    { data: membershipCheckins },
    { data: testClient },
    { data: foundationalIntake },
    { data: supplementaryIntake },
    { data: scorecardReport },
  ] = await Promise.all([
    admin
      .from('challenge_enrollments')
      .select('id, token, current_day, enrolled_at, quiz_result, quiz_completed_at, leads(name, email, phone)')
      .order('enrolled_at', { ascending: false }),
    admin
      .from('blueprint_enrollments')
      .select('id, token, email, first_name, pattern, current_week, purchase_date')
      .order('purchase_date', { ascending: false }),
    admin
      .from('membership_enrollments')
      .select('id, token, email, first_name, pattern, current_block, current_week, joined_at, cancelled_at, blueprint_token')
      .order('joined_at', { ascending: false }),
    admin
      .from('blueprint_checkins')
      .select('enrollment_id, week_number, energy_levels, morning_energy, sleep_quality, afternoon_crash, hunger_cravings, training_recovery, mood_stability, physical_changes, submitted_at'),
    admin
      .from('membership_checkins')
      .select('enrollment_id, week_number, energy_levels, morning_energy, sleep_quality, afternoon_crash, hunger_cravings, training_recovery, mood_stability, physical_changes, submitted_at'),
    // Test Client seed for Stage 4 {token} routes (Pages tab)
    admin
      .from('clients')
      .select('id, onboarding_token, checkin_token, baseline_token')
      .eq('email', 'test-client@bodyrecode.au')
      .maybeSingle(),
    admin
      .from('intake_invitations')
      .select('token')
      .eq('kind', 'foundational')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('intake_invitations')
      .select('token')
      .eq('kind', 'supplementary')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('scorecard_reports')
      .select('token')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  // Build blueprint token set for cross-referencing
  const blueprintEmails = new Set((blueprintEnrollments ?? []).map(b => b.email.toLowerCase()))
  const membershipEmails = new Set((membershipEnrollments ?? []).map(m => m.email.toLowerCase()))

  // Aggregate last check-in per blueprint enrollment
  const blueprintCheckinMap: Record<string, { week: number; avg: number; date: string }> = {}
  for (const c of blueprintCheckins ?? []) {
    const avg = (c.energy_levels + c.morning_energy + c.sleep_quality + c.afternoon_crash + c.hunger_cravings + c.training_recovery + c.mood_stability + c.physical_changes) / 8
    const existing = blueprintCheckinMap[c.enrollment_id]
    if (!existing || c.week_number > existing.week) {
      blueprintCheckinMap[c.enrollment_id] = { week: c.week_number, avg: Math.round(avg * 10) / 10, date: c.submitted_at }
    }
  }

  // Aggregate last check-in per membership enrollment
  const membershipCheckinMap: Record<string, { week: number; avg: number; date: string }> = {}
  for (const c of membershipCheckins ?? []) {
    const avg = (c.energy_levels + c.morning_energy + c.sleep_quality + c.afternoon_crash + c.hunger_cravings + c.training_recovery + c.mood_stability + c.physical_changes) / 8
    const existing = membershipCheckinMap[c.enrollment_id]
    if (!existing || c.week_number > existing.week) {
      membershipCheckinMap[c.enrollment_id] = { week: c.week_number, avg: Math.round(avg * 10) / 10, date: c.submitted_at }
    }
  }

  return (
    <FunnelClient
      challengeEnrollments={(challengeEnrollments ?? []).map(e => ({
        id: e.id,
        token: e.token,
        name: (e.leads as any)?.name ?? 'Unknown',
        email: (e.leads as any)?.email ?? '',
        phone: (e.leads as any)?.phone ?? '',
        currentDay: e.current_day ?? 1,
        enrolledAt: e.enrolled_at,
        quizResult: e.quiz_result,
        quizCompleted: !!e.quiz_completed_at,
        hasBlueprintPurchase: blueprintEmails.has(((e.leads as any)?.email ?? '').toLowerCase()),
      }))}
      blueprintEnrollments={(blueprintEnrollments ?? []).map(e => ({
        id: e.id,
        token: e.token,
        name: e.first_name,
        email: e.email,
        pattern: e.pattern,
        currentWeek: e.current_week ?? 1,
        purchaseDate: e.purchase_date,
        lastCheckin: blueprintCheckinMap[e.id] ?? null,
        hasMembership: membershipEmails.has(e.email.toLowerCase()),
      }))}
      membershipEnrollments={(membershipEnrollments ?? []).map(e => ({
        id: e.id,
        token: e.token,
        name: e.first_name,
        email: e.email,
        pattern: e.pattern,
        currentBlock: e.current_block ?? 'A',
        currentWeek: e.current_week ?? 1,
        joinedAt: e.joined_at,
        cancelledAt: e.cancelled_at,
        lastCheckin: membershipCheckinMap[e.id] ?? null,
        blueprintToken: e.blueprint_token,
      }))}
      pagesTokens={{
        challenge: challengeEnrollments?.[0]?.token,
        blueprint: blueprintEnrollments?.[0]?.token,
        membership: membershipEnrollments?.[0]?.token,
        portalOnboarding: testClient?.onboarding_token ?? undefined,
        portalCheckin: testClient?.checkin_token ?? undefined,
        portalBaseline: testClient?.baseline_token ?? undefined,
        intakeFoundational: foundationalIntake?.token,
        intakeSupplementary: supplementaryIntake?.token,
        scorecardReport: scorecardReport?.token,
      }}
    />
  )
}
