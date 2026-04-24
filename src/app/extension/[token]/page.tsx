import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import ExtensionPortalClient from './extension-portal-client'

export default async function ExtensionPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: enrollment } = await admin
    .from('extension_enrollments')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  if (!enrollment) return notFound()

  return <ExtensionPortalClient enrollment={enrollment} />
}
