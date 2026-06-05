import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import BlueprintPortalClient from './blueprint-portal-client'

export default async function BlueprintPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: enrollment } = await admin
    .from('blueprint_enrollments')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  if (!enrollment) return notFound()

  // Detect whether this email has an active Membership. If they ascended
  // at Week 6, the Week 6 ascension card is replaced with a handoff card
  // pointing at the Membership portal (where Block A content actually
  // lives). The Blueprint URL still resolves so muscle-memory holds.
  const { data: membership } = await admin
    .from('membership_enrollments')
    .select('token, current_block, cancelled_at')
    .ilike('email', enrollment.email)
    .maybeSingle()

  const activeMembershipToken = membership && !membership.cancelled_at
    ? membership.token
    : null

  return (
    <BlueprintPortalClient
      enrollment={enrollment}
      activeMembershipToken={activeMembershipToken}
    />
  )
}
