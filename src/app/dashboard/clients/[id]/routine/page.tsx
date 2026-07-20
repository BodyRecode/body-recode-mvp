import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { resolveDailyRoutine, CANONICAL_DAILY_ROUTINE } from '@/lib/daily-routine-defaults'
import RoutineEditor from './routine-editor'

/**
 * Coach editor for a client's Morning Reset Sequence + Evening Rhythm
 * Sequence. Server component fetches the current stored value, resolves
 * against defaults (so blank slots inherit the canonical Body Recode
 * sequences), and hands off to the client-side RoutineEditor.
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
    .select('id, name, daily_routine')
    .eq('id', id)
    .maybeSingle()

  if (!client) notFound()

  const resolved = resolveDailyRoutine(client.daily_routine)
  const hasCustomisations = client.daily_routine !== null && client.daily_routine !== undefined

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
          The two daily anchor sequences the client sees on their portal. Every client starts with the canonical Body Recode defaults (same as the Challenge product). Personalise steps or add a coach note per section.
        </p>
        {!hasCustomisations && (
          <p className="text-[11px] text-stone-500 mt-2 uppercase tracking-widest">
            Currently using canonical defaults (no coach overrides saved).
          </p>
        )}
      </div>

      <RoutineEditor
        clientId={id}
        initial={resolved}
        canonicalDefaults={CANONICAL_DAILY_ROUTINE}
      />
    </div>
  )
}
