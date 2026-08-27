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
  /** Unread count shown as a Signal Blue pill on the right of the tile. */
  badge?: number
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

  // Unread replies from the coach, so the tile can carry a badge.
  const { count: unreadReplies } = await admin
    .from('client_messages')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', client.id)
    .eq('sender', 'coach')
    .is('client_read_at', null)

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
      title: 'Messages',
      description: 'Your conversation with your coach. Ask a question, read their replies.',
      href: `/portal/${token}/message`,
      icon: MessageSquare,
      badge: unreadReplies ?? 0,
    },
    {
      title: 'Account and service',
      description: 'Update your contact details, pause coaching, refer a friend, download your data.',
      href: `/portal/${token}/account`,
      icon: Settings,
    },
  ]

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#141821]">
      <ClientHeader />
      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-10">
          <Link href={`/portal/${token}`} className="text-[12px] text-[#98A0AD] hover:text-[#43474F] transition-colors">← Back to portal</Link>
          <h1 className="text-[30px] font-extrabold text-[#141821] tracking-tight leading-[1.1] mt-4 mb-2">Resources</h1>
          <p className="text-[#666D7A] text-[15px]">Everything you need beyond your weekly check-ins and program.</p>
        </div>

        <div className="space-y-3">
          {cards.map(card => {
            const Icon = card.icon
            return (
              <Link
                key={card.href}
                href={card.href}
                className="group block rounded-2xl border border-[#E8EAEE] bg-[#FFFFFF] p-5 hover:border-[#1B6DFC]/40 hover:bg-[#EFF5FE] transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] border border-[#E8EAEE] flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={16} className="text-[#1B6DFC]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[15px] font-semibold text-[#141821] group-hover:text-[#1B6DFC] transition-colors">{card.title}</p>
                      {!!card.badge && card.badge > 0 && (
                        <span className="text-[10px] font-bold text-[#FFFFFF] bg-[#1B6DFC] rounded-full px-2 py-0.5 leading-none">
                          {card.badge} new
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-[#666D7A] leading-relaxed">{card.description}</p>
                  </div>
                  <ArrowUpRight size={14} className="text-[#98A0AD] group-hover:text-[#1B6DFC] transition-colors shrink-0 mt-2" />
                </div>
              </Link>
            )
          })}
        </div>

        <p
          className="text-[11.5px] text-[#98A0AD] mt-10 text-center"
          style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
        >
          {brand().name} · client portal
                          </p>
        <div className="h-16" />
      </div>
    </div>
  )
}
