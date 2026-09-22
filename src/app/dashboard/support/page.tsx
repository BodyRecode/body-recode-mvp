import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PageHeader, PageBody, StatCard, Card, Pill, EmptyState } from '@/components/dashboard/ui'
import { CATEGORY_LABELS, STATUS_LABELS, statusAccent, categoryAccent, type SupportCategory, type SupportStatus } from '@/lib/support-tickets'

export const dynamic = 'force-dynamic'

type TicketRow = {
  id: string
  coach_id: string
  category: SupportCategory
  subject: string
  body: string
  page_url: string | null
  status: SupportStatus
  status_note: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
}

export default async function SupportInboxPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams
  const filter = sp.status && ['new', 'looking', 'fixed', 'wont-fix'].includes(sp.status) ? (sp.status as SupportStatus) : null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  /**
   * 22 September 2026. TWO FAULTS HERE, AND THE SECOND ONE IS THE REASON THE
   * FIRST MATTERED.
   *
   * 1. This gated on `isCoachEmail`, the OWNER allowlist, and redirected
   *    everybody else. "Support" is in a pilot coach's menu, so a coach who
   *    needed help clicked Support and was bounced to Today. The one page a
   *    struggling coach reaches for was the one page they could not open.
   *
   * 2. It is Kade's ADMIN INBOX: every ticket from every coach, each row
   *    carrying the filer's email address. So the fix could not be to loosen
   *    the guard, which would have shown every coach everybody else's tickets
   *    and addresses.
   *
   * Same page, scoped, the same way Today is: the owner sees the inbox, a
   * coach sees their own tickets and nothing else.
   */
  const isOwnerView = isCoachEmail(user.email)

  const admin = createAdminClient()
  let q = admin
    .from('support_tickets')
    .select('id, coach_id, category, subject, body, page_url, status, status_note, created_at, updated_at, resolved_at')
    .order('created_at', { ascending: false })
    .limit(200)
  if (!isOwnerView) q = q.eq('coach_id', user.id)
  const { data, error } = await q

  if (error) {
    return (
      <PageBody>
        <PageHeader eyebrow="Admin" title="Support inbox" />
        <div className="p-4 rounded-xl border border-[#E8C9C9] bg-[#FBF1F1] text-[#8A1919] text-[13.5px]">
          Error loading tickets: {error.message}
        </div>
      </PageBody>
    )
  }

  const all = (data ?? []) as TicketRow[]
  const filerIds = Array.from(new Set(all.map(t => t.coach_id)))
  const filers = await Promise.all(filerIds.map(async id => {
    const u = await admin.auth.admin.getUserById(id)
    return { id, email: u.data.user?.email ?? 'unknown' }
  }))
  const emailById = new Map(filers.map(f => [f.id, f.email]))

  const counts = {
    new: all.filter(t => t.status === 'new').length,
    looking: all.filter(t => t.status === 'looking').length,
    fixed: all.filter(t => t.status === 'fixed').length,
    'wont-fix': all.filter(t => t.status === 'wont-fix').length,
  }
  const shown = filter ? all.filter(t => t.status === filter) : all

  return (
    <PageBody>
      <PageHeader
        eyebrow={isOwnerView ? 'Admin' : 'Support'}
        title={isOwnerView ? 'Support inbox' : 'Your tickets'}
        subtitle={isOwnerView
          ? 'Every coach ticket lands here. New first.'
          : 'Anything you have reported, and where it got to. Use the button in the bottom corner of any page to report something new.'}
        metric={isOwnerView ? undefined : (all.length > 0 ? { value: all.length, label: all.length === 1 ? 'ticket' : 'tickets' } : undefined)}
      />

      {isOwnerView && (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="New" value={counts.new} accent="amber" href="/dashboard/support?status=new" />
        <StatCard label="Looking" value={counts.looking} accent="blue" href="/dashboard/support?status=looking" />
        <StatCard label="Fixed" value={counts.fixed} accent="sage" href="/dashboard/support?status=fixed" />
        <StatCard label="Won't fix" value={counts['wont-fix']} accent="neutral" href="/dashboard/support?status=wont-fix" />
      </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        {isOwnerView && <FilterChip href="/dashboard/support" active={filter === null}>All</FilterChip>}
        {isOwnerView && (['new', 'looking', 'fixed', 'wont-fix'] as SupportStatus[]).map(s => (
          <FilterChip key={s} href={`/dashboard/support?status=${s}`} active={filter === s}>{STATUS_LABELS[s]}</FilterChip>
        ))}
      </div>

      {shown.length === 0 ? (
        <Card><EmptyState title="Nothing here." hint={isOwnerView
            ? (filter ? `No tickets with status "${STATUS_LABELS[filter]}" yet.` : 'When a coach files a ticket it will show up here.')
            : 'Use the button in the bottom corner of any page to report something. It lands with us with the page you were on.'} /></Card>
      ) : (
        <Card padding="none">
          <ul className="divide-y divide-[#EDEDEA]">
            {shown.map(t => (
              <li key={t.id}>
                <Link href={`/dashboard/support/${t.id}`} className="block px-5 py-4 hover:bg-[#FAFAF8] transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Pill accent={categoryAccent(t.category)}>{CATEGORY_LABELS[t.category]}</Pill>
                        <Pill accent={statusAccent(t.status)}>{STATUS_LABELS[t.status]}</Pill>
                        <span className="text-[11px] text-[#9CA2AB]">{formatDate(t.created_at)}</span>
                      </div>
                      <p className="text-[13.5px] font-semibold text-[#0F1115] truncate">{t.subject}</p>
                      <p className="text-[12.5px] text-[#6E747D] mt-0.5">
                        {isOwnerView ? (emailById.get(t.coach_id) ?? 'unknown') : ''}
                        {t.page_url ? `${isOwnerView ? ' · ' : ''}${t.page_url}` : ''}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </PageBody>
  )
}

function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-[12.5px] px-3 py-1.5 rounded-full border transition-colors"
      style={{
        background: active ? '#0F1115' : '#FFFFFF',
        color: active ? '#FFFFFF' : '#4A4F57',
        borderColor: active ? '#0F1115' : '#E4E4E0',
      }}
    >
      {children}
    </Link>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return `Today ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' })
}
