import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/dashboard/ui'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ParticipantView from './participant-view'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Enrollment = {
  id: string
  token: string
  status: string | null
  current_day: number | null
  enrolled_at: string
  parq_completed_at: string | null
  health_dec_completed_at: string | null
  quiz_completed_at: string | null
  quiz_result: string | null
  quiz_answers: Record<string, string> | null
  lead_id: string
}

type Lead = {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  scorecard_body_state: string | null
  scorecard_score: number | null
  scorecard_profile: string | null
  source: string | null
  created_at: string
}

type LeadEvent = {
  id: string
  type: string
  subject: string | null
  resend_email_id: string | null
  notes: string | null
  sent_at: string
}

export default async function ParticipantPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: enrollment, error: eErr } = await admin
    .from('challenge_enrollments')
    .select('id, token, status, current_day, enrolled_at, parq_completed_at, health_dec_completed_at, quiz_completed_at, quiz_result, quiz_answers, lead_id')
    .eq('token', token)
    .single<Enrollment>()

  if (eErr || !enrollment) {
    return (
      <div className="max-w-[1100px]">
        <Link href="/dashboard/funnel" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 mb-3">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Funnel
        </Link>
        <PageHeader eyebrow="Funnel" title="Participant not found" />
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          No enrollment exists for token <code>{token}</code>.
        </div>
      </div>
    )
  }

  const [{ data: lead }, { data: events }] = await Promise.all([
    admin
      .from('leads')
      .select('id, name, email, phone, scorecard_body_state, scorecard_score, scorecard_profile, source, created_at')
      .eq('id', enrollment.lead_id)
      .single<Lead>(),
    admin
      .from('lead_events')
      .select('id, type, subject, resend_email_id, notes, sent_at')
      .eq('lead_id', enrollment.lead_id)
      .order('sent_at', { ascending: true })
      .returns<LeadEvent[]>(),
  ])

  // Day computed live from enrolled_at - matches the rest of the system
  const msPerDay = 1000 * 60 * 60 * 24
  const enrolledAt = new Date(enrollment.enrolled_at)
  const currentDay = Math.min(
    Math.floor((Date.now() - enrolledAt.getTime()) / msPerDay) + 1,
    14,
  )

  return (
    <div className="max-w-[1100px]">
      <Link href="/dashboard/funnel" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 mb-3">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Funnel
      </Link>
      <ParticipantView
        enrollment={enrollment}
        lead={lead ?? null}
        events={events ?? []}
        currentDay={currentDay}
      />
    </div>
  )
}
