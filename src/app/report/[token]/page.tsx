import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import ReportClient from './report-client'

export default async function ReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: report } = await admin
    .from('scorecard_reports')
    .select('*')
    .eq('token', token)
    .single()

  if (!report) notFound()

  return <ReportClient report={report} />
}
