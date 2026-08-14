import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import ChallengePortalClient from './challenge-portal-client'
import { PORTAL_ACCESS_STATUSES } from '@/lib/challenge-access'

export default async function ChallengePortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: enrollment } = await admin
    .from('challenge_enrollments')
    .select('id, current_day, enrolled_at, status, parq_completed_at, health_dec_completed_at, quiz_completed_at, quiz_result, body_decode_intake_completed_at, ascension_intent, leads(name, email, scorecard_profile, scorecard_body_state, scorecard_section_scores, approach_response, biological_sex, age_band, fat_storage, cycle_status, storage_direction)')
    .eq('token', token)
    .in('status', PORTAL_ACCESS_STATUSES)
    .single()

  if (!enrollment) notFound()

  const lead = Array.isArray(enrollment.leads) ? enrollment.leads[0] : enrollment.leads
  const firstName = lead?.name?.split(' ')[0] ?? 'there'

  // The Day 0 intake asks for three separate things, and someone who already
  // did the public scorecard has answered most of them.
  //
  // The old gate was all-or-nothing: `scorecard_profile` present meant skip the
  // WHOLE form. That threw away `ascension_intent`, which decides what they are
  // offered on Day 14 and which nothing else on the platform captures - 9 of 29
  // enrolments had no intent on file. It also failed the other way for anyone
  // who scored before Fat Map typing existed (61 leads have a body state but no
  // profile), sending them back through the entire scorecard.
  //
  // So: work out what is genuinely missing, ask only that, and skip the form
  // outright only when nothing is.
  const sex = lead?.biological_sex ?? null
  const scores = lead?.scorecard_section_scores as Record<string, number> | null
  const hasScores = !!lead?.scorecard_body_state
    && !!scores && ['01', '02', '03', '04', '05'].every(k => typeof scores[k] === 'number')

  const known = {
    scores: hasScores,
    sex: !!sex,
    age: !!lead?.age_band,
    storage: !!lead?.fat_storage,
    // Cycle and direction are female-only, so they are "known" for men by
    // definition rather than by having been answered.
    cycle: sex === 'M' || !!lead?.cycle_status,
    direction: sex === 'M' || !!lead?.storage_direction,
    approach: !!lead?.approach_response,
    // Challenge-specific and asked nowhere else. Never assume it.
    ascensionIntent: !!enrollment.ascension_intent,
  }

  const nothingMissing = Object.values(known).every(Boolean)
  const intakeCompleted = !!enrollment.body_decode_intake_completed_at || nothingMissing

  // Calculate actual day based on enrollment date
  const enrolledAt = new Date(enrollment.enrolled_at)
  const now = new Date()
  const daysSince = Math.floor((now.getTime() - enrolledAt.getTime()) / (1000 * 60 * 60 * 24))
  const currentDay = Math.min(Math.max(daysSince + 1, 1), 14)

  return (
    <ChallengePortalClient
      token={token}
      firstName={firstName}
      currentDay={currentDay}
      enrolledAt={enrollment.enrolled_at}
      parqCompleted={!!enrollment.parq_completed_at}
      healthDecCompleted={!!enrollment.health_dec_completed_at}
      savedQuizResult={enrollment.quiz_result ?? null}
      bodyDecodeIntakeCompleted={intakeCompleted}
      knownAnswers={known}
      knownSex={sex as 'M' | 'F' | null}
    />
  )
}
