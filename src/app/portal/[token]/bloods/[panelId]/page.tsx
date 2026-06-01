import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import ClientHeader from '@/components/client-header'
import { isCoachEmail } from '@/lib/coach-auth'

/**
 * Client-facing Blood Panel Reading. Renders the four sections (bp_*) stored on
 * blood_panels.reading once the coach has clicked Publish. Hidden until then.
 */
export default async function BloodReadingPage({
  params,
}: {
  params: Promise<{ token: string; panelId: string }>
}) {
  const { token, panelId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('id, email')
    .eq('onboarding_token', token)
    .maybeSingle()
  if (!client) return notFound()

  const userEmail = (user.email ?? '').toLowerCase()
  if (userEmail !== (client.email ?? '').toLowerCase() && !isCoachEmail(userEmail)) redirect(`/portal/${token}`)

  const { data: panel } = await admin
    .from('blood_panels')
    .select('id, reading, reading_published_at, collected_on, submitted_at')
    .eq('id', panelId)
    .eq('client_id', client.id)
    .maybeSingle()

  if (!panel || !panel.reading_published_at || !panel.reading) {
    redirect(`/portal/${token}/bloods`)
  }

  const reading = panel.reading as {
    bp_what_we_saw: string
    bp_why_it_matters: string
    bp_how_we_account_for_it: string
    bp_what_to_watch: string
  }
  const dateLabel = (panel.collected_on
    ? new Date(panel.collected_on)
    : new Date(panel.submitted_at)
  ).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1A]">
      <ClientHeader />
      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-8">
          <Link href={`/portal/${token}/bloods`} className="text-[#999999] hover:text-[#3A3A3A] text-sm transition-colors">← Back</Link>
          <p className="text-[11px] font-bold tracking-widest text-[#1B6DFC] uppercase mt-5 mb-2">Blood Panel Reading</p>
          <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight mb-1">What your results mean for your coaching</h1>
          <p className="text-[#999999] text-sm">Blood panel from {dateLabel}</p>
        </div>

        <div className="space-y-5">
          <Section title="What we saw" body={reading.bp_what_we_saw} />
          <Section title="Why it matters" body={reading.bp_why_it_matters} />
          <Section title="How we account for it" body={reading.bp_how_we_account_for_it} />
          <Section title="What to watch" body={reading.bp_what_to_watch} accent />
        </div>

        <p className="mt-6 text-xs text-[#999999] leading-relaxed">
          This is a coaching read, not medical advice. For anything on the medical side, your GP is the right person.
        </p>

        <div className="h-10" />
      </div>
    </div>
  )
}

function Section({ title, body, accent }: { title: string; body: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF] p-5">
      <p className={`text-[11px] font-bold uppercase tracking-widest mb-3 ${accent ? 'text-[#1B6DFC]' : 'text-[#6B6B6B]'}`}>{title}</p>
      <div className="text-sm text-[#3A3A3A] leading-relaxed whitespace-pre-wrap">{body}</div>
    </div>
  )
}
