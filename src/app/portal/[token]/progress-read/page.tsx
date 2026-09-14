import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import ReadingHeroShell from '@/components/reading-hero-shell'
import { herProgressReadView } from '@/lib/progress-read-publish'
import { isCoachEmail } from '@/lib/coach-auth'

/**
 * Her Progress Read (Progress Read spec v2.4, section 4). Shows ONLY the shared
 * sections, which were written to her in the same generation as the coach's
 * version, so the two cannot disagree. Newest published read, or ?id= for an
 * earlier one. Same editorial shell as her other reads.
 */


export default async function PortalProgressReadPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ id?: string }> }) {
  const { token } = await params
  const { id } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const admin = createAdminClient()
  const { data: client } = await admin.from('clients').select('id, name, email').eq('onboarding_token', token).maybeSingle()
  if (!client) notFound()
  const userEmail = (user.email ?? '').toLowerCase()
  if (userEmail !== (client.email ?? '').toLowerCase() && !isCoachEmail(userEmail)) redirect(`/portal/${token}`)

  let query = admin.from('progress_reads').select('id, published_at, previous_body_state, body_state_classification, content')
    .eq('client_id', client.id).eq('status', 'published').eq('is_archived', false)
  query = id ? query.eq('id', id) : query.order('published_at', { ascending: false }).limit(1)
  const { data: rows } = await query
  const read = rows?.[0]

  const back = (
    <div className="no-print" style={{ position: 'fixed', top: 16, left: 16, zIndex: 50 }}>
      <Link href={`/portal/${token}/readings`} className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg bg-[#FFFFFF]/80 backdrop-blur border border-[#E8EAEE] text-[#43474F] hover:text-[#1B6DFC] hover:border-[#1B6DFC] transition-colors">
        <ChevronLeft size={13} /> Your reads
      </Link>
    </div>
  )

  if (!read) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center px-6 py-12">
        {back}
        <div className="w-full max-w-md border border-[#E8EAEE] rounded-2xl p-8 text-center">
          <p className="text-[#141821] text-lg font-semibold mb-2">Your Progress Read is not ready yet</p>
          <p className="text-[#666D7A] text-sm">It will appear here once your coach has written it from your Progress Check.</p>
        </div>
      </div>
    )
  }

  const view = herProgressReadView(read)

  return (
    <>
      {back}
      <ReadingHeroShell
        eyebrow="Progress Read"
        heroTitle="Your Progress Read"
        heroSub={view.headline ?? 'Where you are now, set against your last read.'}
        pill={view.pill}
        clientName={client.name}
        aboutText={<p><b>About this read.</b> Written {new Date(read.published_at!).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })} from your Progress Check, your measurements and photos, and your weekly check-ins. It sets where you are now against your last read. Only changes that show up across a whole area of your answers, your measurements or your check-ins count as change here, not one answer on one day. Holding steady is a result too.</p>}
        sections={view.sections}
        coachNote={{ content: null }}
      />
    </>
  )
}
