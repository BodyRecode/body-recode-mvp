import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getWeekNumber } from '@/lib/weekly-checkin-questions'
import {
  ArrowUpRight,
  CalendarClock,
  CircleAlert,
  Inbox,
  ListChecks,
  Sparkles,
} from 'lucide-react'
import { Card, MONO_FONT, accentColour } from '@/components/dashboard/ui'

type ItemAccent = 'teal' | 'amber' | 'red' | 'neutral'

interface ActionItem {
  icon: typeof CalendarClock
  accent: ItemAccent
  label: string
  href: string
  meta?: string
}

export default async function TodayWidget() {
  const supabase = await createClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [
    { data: leadsNeedingZoom },
    { data: clientsAll },
    { data: checkinsRecent },
    { data: scorecardLeads },
  ] = await Promise.all([
    // Reports sent but no Zoom booked yet → these are the deal-makers
    supabase
      .from('leads')
      .select('id, name, status, updated_at')
      .in('status', ['report_sent', 'cold_no_booking'])
      .order('updated_at', { ascending: false })
      .limit(20),
    // Active clients to assess overdue check-ins
    supabase
      .from('clients')
      .select('id, name, coaching_started_at')
      .eq('active', true),
    // Recent check-ins to compare against expected week
    supabase
      .from('weekly_checkins')
      .select('client_id, week_number')
      .gte('submitted_at', sevenDaysAgo.toISOString()),
    // Brand-new check-ins still in the inbox state
    supabase
      .from('leads')
      .select('id, name, created_at')
      .eq('status', 'new_check_in')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const newCheckIns = scorecardLeads?.length || 0
  const reportsToFollowUp = leadsNeedingZoom?.length || 0

  // Active clients whose check-in for the current week hasn't been submitted
  let overdueCheckins = 0
  if (clientsAll) {
    for (const client of clientsAll) {
      if (!client.coaching_started_at) continue
      const startDate = new Date(client.coaching_started_at)
      if (startDate > today) continue // hasn't started yet
      const expectedWeek = getWeekNumber(client.coaching_started_at)
      if (expectedWeek <= 0) continue
      const submitted = (checkinsRecent || []).some(
        (ci) => ci.client_id === client.id && ci.week_number === expectedWeek
      )
      if (!submitted) overdueCheckins++
    }
  }

  const items: ActionItem[] = []

  if (newCheckIns > 0) {
    items.push({
      icon: Inbox,
      accent: 'teal',
      label: `${newCheckIns} new scorecard${newCheckIns === 1 ? '' : 's'} awaiting interpretation`,
      href: '/dashboard/leads?status=new_check_in',
      meta: 'Leads · New',
    })
  }

  if (reportsToFollowUp > 0) {
    items.push({
      icon: CalendarClock,
      accent: 'amber',
      label: `${reportsToFollowUp} lead${reportsToFollowUp === 1 ? '' : 's'} need a Zoom booked`,
      href: '/dashboard/leads?status=report_sent',
      meta: 'Reports sent · No call',
    })
  }

  if (overdueCheckins > 0) {
    items.push({
      icon: CircleAlert,
      accent: 'red',
      label: `${overdueCheckins} client${overdueCheckins === 1 ? '' : 's'} overdue on this week's check-in`,
      href: '/dashboard/coaching',
      meta: 'Coaching · Overdue',
    })
  }

  // If nothing urgent, show a forward-looking prompt
  if (items.length === 0) {
    items.push({
      icon: Sparkles,
      accent: 'teal',
      label: 'Nothing urgent - pipeline is clean and check-ins are up to date',
      href: '/dashboard/business',
      meta: 'Move on to growth work',
    })
  }

  // Always include a quick-jump to the week's content/business work
  items.push({
    icon: ListChecks,
    accent: 'neutral',
    label: 'Plan this week\'s content and campaigns',
    href: '/dashboard/business/content',
    meta: 'Business · Content',
  })

  return (
    <Card padding="md" className="mb-6">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-[3px] rounded-full bg-[#14b8a6]" />
          <h2
            className="text-[11px] font-bold text-white uppercase"
            style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
          >
            Today's Focus
          </h2>
        </div>
        <span
          className="text-[10px] text-[#57534e]"
          style={{ fontFamily: MONO_FONT, letterSpacing: '0.1em' }}
        >
          {items.length} action{items.length === 1 ? '' : 's'}
        </span>
      </div>
      <div className="divide-y divide-[#1c1917]">
        {items.map((item, idx) => {
          const a = accentColour(item.accent)
          const Icon = item.icon
          return (
            <Link
              key={idx}
              href={item.href}
              className="flex items-center gap-4 px-1 py-3.5 group hover:bg-[#1c1917]/40 -mx-1 px-2 rounded-lg transition-colors"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                style={{ background: a.bg, borderColor: a.ring }}
              >
                <Icon size={16} style={{ color: a.text }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium text-white group-hover:text-[#14b8a6] transition-colors truncate">
                  {item.label}
                </p>
                {item.meta && (
                  <p
                    className="text-[10px] text-[#57534e] uppercase mt-0.5"
                    style={{ fontFamily: MONO_FONT, letterSpacing: '0.1em' }}
                  >
                    {item.meta}
                  </p>
                )}
              </div>
              <ArrowUpRight
                size={16}
                className="text-[#57534e] group-hover:text-[#14b8a6] transition-colors shrink-0"
              />
            </Link>
          )
        })}
      </div>
    </Card>
  )
}
