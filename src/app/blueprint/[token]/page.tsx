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

  return <BlueprintPortalClient enrollment={enrollment} />
}
