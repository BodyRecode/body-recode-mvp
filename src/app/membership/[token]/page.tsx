import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import MembershipPortalClient from './membership-portal-client'

export default async function MembershipPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: enrollment } = await admin
    .from('membership_enrollments')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  if (!enrollment) return notFound()

  return <MembershipPortalClient enrollment={enrollment} />
}
