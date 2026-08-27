import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ClientHeader from '@/components/client-header'
import { Moon, Wind, Footprints, Snowflake, Calendar, Droplet, ArrowUpRight } from 'lucide-react'
import { isCoachEmail } from '@/lib/coach-auth'

interface Guide {
  slug: string
  title: string
  desc: string
  icon: typeof Moon
}

const GUIDES: Guide[] = [
  { slug: 'sleep',            title: 'Sleep hygiene',       desc: 'The single biggest lever on recovery. Practical patterns to make sleep restorative.', icon: Moon },
  { slug: 'stress',           title: 'Stress regulation',   desc: 'Box breathing, vagal practices, and short routines for nervous system regulation.', icon: Wind },
  { slug: 'pre-session',      title: 'Pre-session prep',    desc: 'What to do in the 30-60 minutes before a training session to walk in primed.', icon: Footprints },
  { slug: 'post-session',     title: 'Post-session recovery', desc: 'The hour after training matters more than most clients realise. Here is the order of operations.', icon: Snowflake },
  { slug: 'weekly-structure', title: 'Weekly structure',    desc: 'How to think about your week as a system: training, eating, sleeping, recovering.', icon: Calendar },
  // "Understanding your baseline bloodwork" lives in the portal's Health
  // Markers section, not here — it sits with the blood-test upload it relates
  // to. The page itself is still at /guides/baseline-bloodwork; only the tile
  // moved. It is gender-gated at the point it is surfaced.
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
  const userEmail = (user.email ?? '').toLowerCase()
  if (userEmail !== (client.email ?? '').toLowerCase() && !isCoachEmail(userEmail)) {
    redirect(`/portal/${token}`)
  }

  const visibleGuides = GUIDES

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#141821]">
      <ClientHeader />
      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-10">
          <Link href={`/portal/${token}/resources`} className="text-[12px] text-[#98A0AD] hover:text-[#43474F] transition-colors">← Back to resources</Link>
          <h1 className="text-[30px] font-extrabold text-[#141821] tracking-tight leading-[1.1] mt-4 mb-2">Practical guides</h1>
          <p className="text-[#666D7A] text-[15px]">Short, actionable. Read once, reference often.</p>
        </div>

        <div className="space-y-3">
          {visibleGuides.map(g => {
            const Icon = g.icon
            return (
              <Link
                key={g.slug}
                href={`/portal/${token}/guides/${g.slug}`}
                className="group block rounded-2xl border border-[#E8EAEE] bg-[#FFFFFF] p-5 hover:border-[#1B6DFC]/40 hover:bg-[#EFF5FE] transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] border border-[#E8EAEE] flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={16} className="text-[#1B6DFC]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-[#141821] mb-1 group-hover:text-[#1B6DFC] transition-colors">{g.title}</p>
                    <p className="text-[12px] text-[#666D7A] leading-relaxed">{g.desc}</p>
                  </div>
                  <ArrowUpRight size={14} className="text-[#98A0AD] group-hover:text-[#1B6DFC] transition-colors shrink-0 mt-2" />
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
