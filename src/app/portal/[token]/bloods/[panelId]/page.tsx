import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import PortalPageShell from '../../portal-page-shell'
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
    <PortalPageShell
      backHref={`/portal/${token}/bloods`}
      eyebrow="Blood Panel Reading"
      title="What your results mean for your coaching"
      description={`Blood panel from ${dateLabel}`}
    >
      <div className="space-y-5">
        <Section title="What we saw" body={reading.bp_what_we_saw} />
        <Section title="Why it matters" body={reading.bp_why_it_matters} />
        <Section title="How we account for it" body={reading.bp_how_we_account_for_it} />
        <Section title="What to watch" body={reading.bp_what_to_watch} accent />
      </div>

      <p className="mt-6 text-xs text-[#98A0AD] leading-relaxed">
        This is a coaching read, not medical advice. For anything on the medical side, your GP is the right person.
      </p>
    </PortalPageShell>
  )
}

function Section({ title, body, accent }: { title: string; body: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-[#E8EAEE] bg-[#FFFFFF] p-5">
      <p className={`text-[11px] font-bold uppercase tracking-widest mb-3 ${accent ? 'text-[#1B6DFC]' : 'text-[#666D7A]'}`}>{title}</p>
      <div className="text-sm text-[#43474F] leading-relaxed whitespace-pre-wrap">{body}</div>
    </div>
  )
}
