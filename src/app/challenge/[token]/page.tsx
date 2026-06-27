import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import ChallengePortalClient from './challenge-portal-client'

export default async function ChallengePortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: enrollment } = await admin
    .from('challenge_enrollments')
    .select('id, current_day, enrolled_at, status, parq_completed_at, health_dec_completed_at, quiz_completed_at, quiz_result, body_decode_intake_completed_at, leads(name, email, scorecard_profile, scorecard_body_state)')
    .eq('token', token)
    .eq('status', 'active')
    .single()

  if (!enrollment) notFound()

  const lead = Array.isArray(enrollment.leads) ? enrollment.leads[0] : enrollment.leads
  const firstName = lead?.name?.split(' ')[0] ?? 'there'
  // The Day 0 Body Decode Intake is gated on having any prior state classification.
  // Scorecard signups land here with scorecard_profile already populated → we
  // skip the intake form entirely. Cold-paid / gym-floor / direct enrollers
  // have NO scorecard data → they fill the intake first.
  const hasPriorStateClassification = !!lead?.scorecard_profile
  const intakeCompleted = !!enrollment.body_decode_intake_completed_at || hasPriorStateClassification

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
    />
  )
}
