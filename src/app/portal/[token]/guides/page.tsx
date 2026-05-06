import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ClientHeader from '@/components/client-header'
import { Moon, Wind, Footprints, Snowflake, Calendar, ArrowUpRight } from 'lucide-react'

const GUIDES = [
  { slug: 'sleep',            title: 'Sleep hygiene',       desc: 'The single biggest lever on recovery. Practical patterns to make sleep restorative.', icon: Moon },
  { slug: 'stress',           title: 'Stress regulation',   desc: 'Box breathing, vagal practices, and short routines for nervous system regulation.', icon: Wind },
  { slug: 'pre-session',      title: 'Pre-session prep',    desc: 'What to do in the 30-60 minutes before a training session to walk in primed.', icon: Footprints },
  { slug: 'post-session',     title: 'Post-session recovery', desc: 'The hour after training matters more than most clients realise. Here is the order of operations.', icon: Snowflake },
  { slug: 'weekly-structure', title: 'Weekly structure',    desc: 'How to think about your week as a system: training, eating, sleeping, recovering.', icon: Calendar },
]

export default async function GuidesIndexPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
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
  if ((user.email ?? '').toLowerCase() !== (client.email ?? '').toLowerCase()) {
    redirect(`/portal/${token}`)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <ClientHeader />
      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-10">
          <Link href={`/portal/${token}/resources`} className="text-[12px] text-[#57534e] hover:text-[#d4cfc9] transition-colors">← Back to resources</Link>
          <h1 className="text-[30px] font-extrabold text-white tracking-tight leading-[1.1] mt-4 mb-2">Practical guides</h1>
          <p className="text-[#a8a29e] text-[15px]">Short, actionable. Read once, reference often.</p>
        </div>

        <div className="space-y-3">
          {GUIDES.map(g => {
            const Icon = g.icon
            return (
              <Link
                key={g.slug}
                href={`/portal/${token}/guides/${g.slug}`}
                className="group block rounded-2xl border border-[#1c1917] bg-[#111110] p-5 hover:border-[#14b8a6]/40 hover:bg-[#14b8a6]/5 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#0c0a09] border border-[#1c1917] flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={16} className="text-[#14b8a6]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-white mb-1 group-hover:text-[#14b8a6] transition-colors">{g.title}</p>
                    <p className="text-[12px] text-[#a8a29e] leading-relaxed">{g.desc}</p>
                  </div>
                  <ArrowUpRight size={14} className="text-[#57534e] group-hover:text-[#14b8a6] transition-colors shrink-0 mt-2" />
                </div>
              </Link>
            )
          })}
        </div>

        <div className="h-16" />
      </div>
    </div>
  )
}
