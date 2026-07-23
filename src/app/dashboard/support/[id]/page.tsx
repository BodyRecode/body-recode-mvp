import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { PageHeader, Card, Pill } from '@/components/dashboard/ui'
import { CATEGORY_LABELS, STATUS_LABELS, statusAccent, categoryAccent, type SupportCategory, type SupportStatus } from '@/lib/support-tickets'
import TicketStatusForm from './status-form'

export const dynamic = 'force-dynamic'

export default async function SupportTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isCoachEmail(user.email)) redirect('/dashboard')

  const admin = createAdminClient()
  const { data: ticket } = await admin
    .from('support_tickets')
    .select('id, coach_id, category, subject, body, page_url, status, status_note, created_at, updated_at, resolved_at')
    .eq('id', id)
    .maybeSingle()

  if (!ticket) notFound()

  const filer = await admin.auth.admin.getUserById(ticket.coach_id as string)
  const filerEmail = filer.data.user?.email ?? 'unknown'

  const cat = ticket.category as SupportCategory
  const status = ticket.status as SupportStatus

  return (
    <div className="max-w-[860px]">
      <div className="mb-6">
        <Link href="/dashboard/support" className="text-[12px] text-[#6B6B6B] hover:text-[#1B6DFC]">← All tickets</Link>
      </div>

      <PageHeader
        eyebrow={`Ticket · ${CATEGORY_LABELS[cat]}`}
        title={ticket.subject as string}
        subtitle={`Filed by ${filerEmail} · ${formatFull(ticket.created_at as string)}`}
      />

      <div className="flex items-center gap-2 mb-5">
        <Pill accent={categoryAccent(cat)}>{CATEGORY_LABELS[cat]}</Pill>
        <Pill accent={statusAccent(status)}>{STATUS_LABELS[status]}</Pill>
        {ticket.page_url && (
          <span className="text-[11px] text-[#999999] truncate">on {ticket.page_url as string}</span>
        )}
      </div>

      <Card className="mb-6">
        <p className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-widest mb-3" style={{ fontFamily: "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace" }}>
          What they said
        </p>
        <div className="text-[14px] text-[#1A1A1A] whitespace-pre-wrap leading-relaxed">
          {ticket.body as string}
        </div>
      </Card>

      {ticket.status_note && (
        <Card className="mb-6" accent="blue" tint>
          <p className="text-[11px] font-bold text-[#1B6DFC] uppercase tracking-widest mb-3" style={{ fontFamily: "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace" }}>
            Current note to filer
          </p>
          <div className="text-[14px] text-[#1A1A1A] whitespace-pre-wrap leading-relaxed">
            {ticket.status_note as string}
          </div>
        </Card>
      )}

      <TicketStatusForm
        id={ticket.id as string}
        initialStatus={status}
        initialNote={(ticket.status_note as string | null) ?? ''}
        filerIsKade={isCoachEmail(filerEmail)}
      />
    </div>
  )
}

function formatFull(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}
