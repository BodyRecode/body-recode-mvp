import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ClientHeader from '@/components/client-header'
import {
  TrendingUp, FileText, BookOpen, Compass, MessageSquare, Settings, ArrowUpRight,
} from 'lucide-react'
import { isCoachEmail } from '@/lib/coach-auth'
import { brand } from "@/config/tenant";

const MONO_FONT = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace"

interface ResourceCard {
  title: string
  description: string
  href: string
  icon: typeof TrendingUp
}

export default async function ResourcesHubPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('id, name, email')
    .eq('onboarding_token', token)
    .maybeSingle()

  if (!client) return notFound()
  const userEmail = (user.email ?? '').toLowerCase()
  if (userEmail !== (client.email ?? '').toLowerCase() && !isCoachEmail(userEmail)) {
    redirect(`/portal/${token}`)
  }

  const cards: ResourceCard[] = [
    {
      title: 'Your progress',
      description: 'Measurements over time, side-by-side with your starting point.',
      href: `/portal/${token}/progress`,
      icon: TrendingUp,
    },
    {
      title: 'Your readings',
      description: 'Foundational Reading and any future weekly readings, all in one place.',
      href: `/portal/${token}/readings`,
      icon: FileText,
    },
    {
      title: 'Glossary',
      description: 'Plain-language definitions of every term you hear from your coach.',
      href: `/portal/${token}/glossary`,
      icon: BookOpen,
    },
    {
      title: 'Practical guides',
      description: 'Sleep, stress regulation, pre-session prep, post-session recovery, weekly structure.',
      href: `/portal/${token}/guides`,
      icon: Compass,
    },
    {
      title: 'Message your coach',
      description: 'Send a non-urgent question. For urgent things, use WhatsApp.',
      href: `/portal/${token}/message`,
      icon: MessageSquare,
    },
    {
      title: 'Account and service',
      description: 'Update your contact details, pause coaching, refer a friend, download your data.',
      href: `/portal/${token}/account`,
      icon: Settings,
    },
  ]

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1A]">
      <ClientHeader />
      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-10">
          <Link href={`/portal/${token}`} className="text-[12px] text-[#999999] hover:text-[#3A3A3A] transition-colors">← Back to portal</Link>
          <h1 className="text-[30px] font-extrabold text-[#1A1A1A] tracking-tight leading-[1.1] mt-4 mb-2">Resources</h1>
          <p className="text-[#6B6B6B] text-[15px]">Everything you need beyond your weekly check-ins and program.</p>
        </div>

        <div className="space-y-3">
          {cards.map(card => {
            const Icon = card.icon
            return (
              <Link
                key={card.href}
                href={card.href}
                className="group block rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF] p-5 hover:border-[#1B6DFC]/40 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] border border-[#E5E5E5] flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={16} className="text-[#1B6DFC]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-[#1A1A1A] mb-1 group-hover:text-[#1B6DFC] transition-colors">{card.title}</p>
                    <p className="text-[12px] text-[#6B6B6B] leading-relaxed">{card.description}</p>
                  </div>
                  <ArrowUpRight size={14} className="text-[#999999] group-hover:text-[#1B6DFC] transition-colors shrink-0 mt-2" />
                </div>
              </Link>
            )
          })}
        </div>

        <p
          className="text-[10px] text-[#999999] uppercase mt-10 text-center"
          style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
        >
          {brand().name} · client portal
                          </p>
        <div className="h-16" />
      </div>
    </div>
  )
}
