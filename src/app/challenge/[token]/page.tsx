import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import ChallengePortalClient from './challenge-portal-client'

export default async function ChallengePortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: enrollment } = await admin
    .from('challenge_enrollments')
    .select('id, current_day, enrolled_at, status, parq_completed_at, health_dec_completed_at, leads(name, email)')
    .eq('token', token)
    .eq('status', 'active')
    .single()

  if (!enrollment) notFound()

  const lead = Array.isArray(enrollment.leads) ? enrollment.leads[0] : enrollment.leads
  const firstName = lead?.name?.split(' ')[0] ?? 'there'

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
    />
  )
}
