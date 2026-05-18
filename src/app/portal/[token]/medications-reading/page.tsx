import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import ClientHeader from '@/components/client-header'

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
  if ((user.email ?? '').toLowerCase() !== (client.email ?? '').toLowerCase()) redirect(`/portal/${token}`)
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
    <div className="min-h-screen bg-[#0c0a09] text-white">
      <ClientHeader />
      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-8">
          <Link href={`/portal/${token}`} className="text-[#57534e] hover:text-[#d4cfc9] text-sm transition-colors">← Back</Link>
          <p className="text-[11px] font-bold tracking-widest text-[#14b8a6] uppercase mt-5 mb-2">Medications Reading</p>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">How your medications shape your coaching</h1>
          <p className="text-[#57534e] text-sm">Published {publishedDate}</p>
        </div>

        <div className="space-y-5">
          <Section title="What you're taking" body={reading.mr_what_youre_taking} />
          <Section title="Why it matters" body={reading.mr_why_it_matters} />
          <Section title="How we account for it" body={reading.mr_how_we_account_for_it} />
          <Section title="What to watch" body={reading.mr_what_to_watch} accent />
        </div>

        <div className="h-10" />
      </div>
    </div>
  )
}

function Section({ title, body, accent }: { title: string; body: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-[#1c1917] bg-[#111110] p-5">
      <p className={`text-[11px] font-bold uppercase tracking-widest mb-3 ${accent ? 'text-[#14b8a6]' : 'text-[#a8a29e]'}`}>{title}</p>
      <div className="text-sm text-[#d4cfc9] leading-relaxed whitespace-pre-wrap">{body}</div>
    </div>
  )
}
