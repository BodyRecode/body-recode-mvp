import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import PortalPageShell from '../portal-page-shell'
import { isCoachEmail } from '@/lib/coach-auth'

/**
 * Client-facing Medications Reading. Renders the four sections (mr_*)
 * stored on clients.medications_reading once the coach has clicked
 * Publish. Hidden entirely until then.
 */
export default async function MedicationsReadingPage({
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
    .select('id, name, email, medications_reading, medications_reading_published_at')
    .eq('onboarding_token', token)
    .maybeSingle()

  if (!client) return notFound()
  const userEmail = (user.email ?? '').toLowerCase()
  if (userEmail !== (client.email ?? '').toLowerCase() && !isCoachEmail(userEmail)) redirect(`/portal/${token}`)
  if (!client.medications_reading_published_at || !client.medications_reading) {
    // Not published yet — bounce back to portal landing.
    redirect(`/portal/${token}`)
  }

  const reading = client.medications_reading as {
    mr_what_youre_taking: string
    mr_why_it_matters: string
    mr_how_we_account_for_it: string
    mr_what_to_watch: string
  }
  const publishedDate = new Date(client.medications_reading_published_at).toLocaleDateString('en-AU', {
    timeZone: 'Australia/Brisbane',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <PortalPageShell
      backHref={`/portal/${token}`}
      eyebrow="Medications Reading"
      title="How your medications shape your coaching"
      description={`Published ${publishedDate}`}
    >
      <div className="space-y-5">
        <Section title="What you're taking" body={reading.mr_what_youre_taking} />
        <Section title="Why it matters" body={reading.mr_why_it_matters} />
        <Section title="How we account for it" body={reading.mr_how_we_account_for_it} />
        <Section title="What to watch" body={reading.mr_what_to_watch} accent />
      </div>
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
