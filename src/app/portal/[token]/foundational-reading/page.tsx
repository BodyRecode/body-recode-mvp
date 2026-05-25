import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Download } from 'lucide-react'
import ReadingLayout from '@/components/foundational-reading-layout'
import PortalReadingDownload from './portal-reading-download'
import { isCoachEmail } from '@/lib/coach-auth'

export default async function PortalFoundationalReadingPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name, email')
    .eq('onboarding_token', token)
    .single()

  if (!client) notFound()

  const userEmail = (user.email ?? '').toLowerCase()
  if (userEmail !== (client.email ?? '').toLowerCase() && !isCoachEmail(userEmail)) {
    redirect(`/portal/${token}`)
  }

  const { data: cffsRows } = await admin
    .from('cffs')
    .select('*')
    .eq('client_id', client.id)
    .eq('is_archived', false)
    .not('client_reading_published_at', 'is', null)
    .order('client_reading_published_at', { ascending: false })
    .limit(1)

  const cffs = cffsRows?.[0] ?? null
  if (!cffs) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1A] flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl p-8 text-center">
          <p className="text-[#1A1A1A] text-lg font-semibold mb-2">Foundational Reading not yet available</p>
          <p className="text-[#6B6B6B] text-sm mb-6">
            Your reading will appear here once it has been finalised and shared with you.
          </p>
          <Link
            href={`/portal/${token}`}
            className="inline-flex items-center gap-1.5 text-[12px] text-[#1B6DFC] hover:text-[#5390FF] transition-colors"
          >
            <ChevronLeft size={13} /> Back to portal
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <PortalReadingDownload
        backHref={`/portal/${token}`}
        pdfHref={`/api/portal/${token}/foundational-reading/pdf`}
        filename={`${client.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-foundational-reading.pdf`}
      />
      <ReadingLayout
        reading={{
          cr_where_you_are: cffs.cr_where_you_are,
          cr_what_your_body_is_telling_us: cffs.cr_what_your_body_is_telling_us,
          cr_what_were_focusing_on_first: cffs.cr_what_were_focusing_on_first,
          cr_what_were_not_doing_yet: cffs.cr_what_were_not_doing_yet,
          cr_coach_note: cffs.cr_coach_note,
          body_state_classification: cffs.body_state_classification,
          generated_at: cffs.client_reading_generated_at!,
          client_reading_published_at: cffs.client_reading_published_at,
        }}
        client={{ name: client.name }}
      />
    </>
  )
}
