import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { resolveDailyRoutine, CANONICAL_DAILY_ROUTINE, type DailyRoutine } from '@/lib/daily-routine-defaults'
import RoutineEditor from './routine-editor'
import DraftPanel from './draft-panel'

/**
 * Coach editor for a client's Morning Reset Sequence + Evening Rhythm
 * Sequence. Two panels: LLM-generated draft (if present) and the live
 * routine the client sees. Coach reviews draft, tweaks, publishes.
 */
export default async function CoachRoutineEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name, daily_routine, daily_routine_draft, daily_routine_generated_at, daily_routine_generation_rationale')
    .eq('id', id)
    .maybeSingle()

  if (!client) notFound()

  const resolved = resolveDailyRoutine(client.daily_routine)
  const hasCustomisations = client.daily_routine !== null && client.daily_routine !== undefined
  const draftRaw = client.daily_routine_draft as DailyRoutine | null
  const hasDraft = draftRaw !== null && draftRaw !== undefined
  const draftResolved = hasDraft ? resolveDailyRoutine(draftRaw) : null

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-stone-500 text-sm mb-2">
          <Link href={`/dashboard/clients/${id}`} className="hover:text-stone-700 transition-colors">{client.name}</Link>
          <span>/</span>
          <span className="text-stone-700">Daily Sequences</span>
        </div>
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">Morning Reset + Evening Rhythm</h1>
        <p className="text-stone-600 text-sm mt-2 leading-relaxed">
          Generate a personalised routine from {client.name}&apos;s data. Review the draft, tweak any step, then publish. The client sees only the live version.
        </p>
        {!hasCustomisations && !hasDraft && (
          <p className="text-[11px] text-stone-500 mt-2 uppercase tracking-widest">
            No live routine and no draft yet. Click Generate to create one from client data.
          </p>
        )}
      </div>

      <DraftPanel
        clientId={id}
        clientName={client.name}
        draft={draftResolved}
        rationale={client.daily_routine_generation_rationale}
        generatedAt={client.daily_routine_generated_at}
        hasLive={hasCustomisations}
      />

      <div className="mt-10 mb-4 flex items-center gap-3">
        <h2 className="text-lg font-semibold text-[#1A1A1A]">Live routine</h2>
        <span className="text-[10px] text-stone-500 uppercase tracking-widest">What the client sees on their portal</span>
      </div>

      <RoutineEditor
        clientId={id}
        initial={resolved}
        canonicalDefaults={CANONICAL_DAILY_ROUTINE}
      />
    </div>
  )
}
