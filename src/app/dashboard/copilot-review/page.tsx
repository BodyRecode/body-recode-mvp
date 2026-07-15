import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader, Card, EmptyState } from '@/components/dashboard/ui'
import { Flag } from 'lucide-react'
import ResolveButton from './resolve-button'

export const dynamic = 'force-dynamic'

// Co-Pilot Review — the flagged-exchanges queue (Phase 1 feedback loop).
// A coach thumbs-down on a co-pilot answer flags it here for review. Reviewer =
// Kade for now; the list is coach-scoped so white-label is a settings addition,
// not a rebuild. Reviewing catches doctrine drift before it spreads across the
// Collective's "one standard".

interface FlaggedRow {
  id: string
  client_id: string
  content: string
  created_at: string
  flagged_at: string | null
}

function fmtWhen(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) + ' · ' +
    d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })
}

export default async function CopilotReviewPage() {
  const admin = createAdminClient()

  const { data: flaggedRows } = await admin
    .from('copilot_messages')
    .select('id, client_id, content, created_at, flagged_at')
    .eq('flagged', true)
    .eq('role', 'assistant')
    .order('flagged_at', { ascending: false })
    .limit(100)

  const flagged = (flaggedRows ?? []) as FlaggedRow[]

  // Client names for the flagged rows, in one query.
  const clientIds = Array.from(new Set(flagged.map(f => f.client_id)))
  const nameById = new Map<string, string>()
  if (clientIds.length) {
    const { data: clients } = await admin.from('clients').select('id, name').in('id', clientIds)
    for (const c of clients ?? []) nameById.set(c.id as string, c.name as string)
  }

  // The coach's question is the user message immediately before each flagged
  // answer (assistant rows are written 1ms after their user row).
  const withQuestion = await Promise.all(flagged.map(async (f) => {
    const { data: q } = await admin
      .from('copilot_messages')
      .select('content')
      .eq('client_id', f.client_id)
      .eq('role', 'user')
      .lt('created_at', f.created_at)
      .order('created_at', { ascending: false })
      .limit(1)
    return { ...f, question: (q?.[0]?.content as string) ?? null }
  }))

  return (
    <div>
      <PageHeader
        eyebrow="Co-Pilot"
        title="Co-Pilot Review"
        subtitle="Exchanges a coach flagged with a thumbs-down. Review each to catch doctrine drift, then mark it reviewed."
        accent="teal"
      />

      {withQuestion.length === 0 ? (
        <EmptyState
          icon={Flag}
          title="Nothing flagged"
          hint="When a coach thumbs-downs a co-pilot answer, it lands here for review."
        />
      ) : (
        <div className="space-y-4">
          {withQuestion.map((f) => (
            <Card key={f.id}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/clients/${f.client_id}`}
                    className="text-[14px] font-semibold text-[#1B6DFC] hover:underline"
                  >
                    {nameById.get(f.client_id) ?? 'Unknown client'}
                  </Link>
                  <span className="ml-2 text-[12px] text-[#999999]">{fmtWhen(f.flagged_at)}</span>
                </div>
                <ResolveButton clientId={f.client_id} messageId={f.id} />
              </div>

              {f.question && (
                <div className="mb-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#999999] mb-1">Coach asked</p>
                  <p className="text-[13px] text-[#4B4B4B] whitespace-pre-wrap">{f.question}</p>
                </div>
              )}

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#999999] mb-1">Co-pilot answered (flagged)</p>
                <p className="text-[13px] text-[#1A1A1A] whitespace-pre-wrap">{f.content}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
