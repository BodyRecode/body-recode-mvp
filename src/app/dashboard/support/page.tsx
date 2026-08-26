import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PageHeader, StatCard, Card, Pill, EmptyState } from '@/components/dashboard/ui'
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
  if (!user || !isCoachEmail(user.email)) redirect('/dashboard')

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('support_tickets')
    .select('id, coach_id, category, subject, body, page_url, status, status_note, created_at, updated_at, resolved_at')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    return (
      <div className="max-w-[1100px]">
        <PageHeader eyebrow="Admin" title="Support inbox" />
        <div className="p-4 rounded-xl border border-[#F5C9C9] bg-[#FDEDED] text-[#8A1919] text-[13px]">
          Error loading tickets: {error.message}
        </div>
      </div>
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
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow="Admin"
        title="Support inbox"
        subtitle="Every coach ticket lands here. New first."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="New" value={counts.new} accent="amber" href="/dashboard/support?status=new" />
        <StatCard label="Looking" value={counts.looking} accent="blue" href="/dashboard/support?status=looking" />
        <StatCard label="Fixed" value={counts.fixed} accent="sage" href="/dashboard/support?status=fixed" />
        <StatCard label="Won't fix" value={counts['wont-fix']} accent="neutral" href="/dashboard/support?status=wont-fix" />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <FilterChip href="/dashboard/support" active={filter === null}>All</FilterChip>
        {(['new', 'looking', 'fixed', 'wont-fix'] as SupportStatus[]).map(s => (
          <FilterChip key={s} href={`/dashboard/support?status=${s}`} active={filter === s}>{STATUS_LABELS[s]}</FilterChip>
        ))}
      </div>

      {shown.length === 0 ? (
        <Card><EmptyState title="Nothing here." hint={filter ? `No tickets with status "${STATUS_LABELS[filter]}" yet.` : 'When a coach files a ticket it will show up here.'} /></Card>
      ) : (
        <Card padding="none">
          <ul className="divide-y divide-[#EFF1F4]">
            {shown.map(t => (
              <li key={t.id}>
                <Link href={`/dashboard/support/${t.id}`} className="block px-5 py-4 hover:bg-[#FAFBFC] transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Pill accent={categoryAccent(t.category)}>{CATEGORY_LABELS[t.category]}</Pill>
                        <Pill accent={statusAccent(t.status)}>{STATUS_LABELS[t.status]}</Pill>
                        <span className="text-[11px] text-[#98A0AD]">{formatDate(t.created_at)}</span>
                      </div>
                      <p className="text-[14px] font-semibold text-[#141821] truncate">{t.subject}</p>
                      <p className="text-[12px] text-[#666D7A] mt-0.5">
                        {emailById.get(t.coach_id) ?? 'unknown'}
                        {t.page_url ? ` · ${t.page_url}` : ''}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-[12px] px-3 py-1.5 rounded-full border transition-colors"
      style={{
        background: active ? '#1B6DFC' : '#FFFFFF',
        color: active ? '#FFFFFF' : '#43474F',
        borderColor: active ? '#1B6DFC' : '#E8EAEE',
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
