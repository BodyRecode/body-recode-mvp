import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import YogaGeneratePanel from './yoga-generate-panel'
import YogaPublishButton from './yoga-publish-button'

interface YogaPose {
  name: string
  sanskrit_name?: string | null
  side?: string | null
  hold_seconds?: number | null
  breaths?: number | null
  cue?: string | null
}
interface YogaSegment { key: string; label: string; poses: YogaPose[] }
interface YogaSession {
  day_label: string
  intention?: string
  summary?: string | null
  ceiling?: string
  segments: YogaSegment[]
}

function holdText(p: YogaPose): string {
  if (p.hold_seconds) return `${p.hold_seconds}s`
  if (p.breaths) return `${p.breaths} breaths`
  return ''
}

function PracticeView({ session }: { session: YogaSession }) {
  return (
    <div className="bg-stone-100 border border-stone-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-stone-200 bg-stone-100/80 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-stone-900">{session.day_label}</h3>
          {session.intention && <p className="mt-0.5 text-sm text-stone-500">{session.intention}</p>}
        </div>
        {session.ceiling && (
          <span className="shrink-0 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-semibold text-[#1B6DFC] capitalize">
            {session.ceiling}
          </span>
        )}
      </div>

      <div className="p-5 space-y-5">
        {session.segments.map((seg, i) => (
          <div key={i}>
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#1B6DFC]">{seg.label}</div>
            <ol className="space-y-2">
              {seg.poses.map((p, j) => (
                <li key={j} className="flex flex-wrap items-baseline gap-x-3 border-b border-stone-200 pb-2 last:border-0">
                  <span className="text-sm font-medium text-stone-900">
                    {p.name}
                    {p.side && p.side !== 'both' ? <span className="text-stone-400"> ({p.side})</span> : null}
                  </span>
                  {p.sanskrit_name && <span className="text-xs italic text-stone-400">{p.sanskrit_name}</span>}
                  {holdText(p) && <span className="ml-auto whitespace-nowrap text-xs text-stone-500">{holdText(p)}</span>}
                  {p.cue && <span className="basis-full text-xs text-stone-500">{p.cue}</span>}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      {session.summary && (
        <div className="px-5 pb-5">
          <p className="rounded-lg bg-stone-50 border border-stone-200 p-3 text-sm text-stone-600">{session.summary}</p>
        </div>
      )}
    </div>
  )
}

export default async function YogaProgramView({
  clientId, clientName,
}: { clientId: string; clientName: string }) {
  const admin = createAdminClient()
  const { data: programs } = await admin
    .from('programs')
    .select('id, block_name, sessions, generated_at, is_active, published_to_client_at')
    .eq('client_id', clientId)
    .eq('modality', 'yoga')
    .order('generated_at', { ascending: false })

  const latest = programs?.[0]
  const past = (programs ?? []).slice(1)
  const latestSession = (latest?.sessions as YogaSession[] | undefined)?.[0]

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href={`/dashboard/clients/${clientId}`} className="text-xs text-stone-500 hover:text-stone-800">
            &larr; {clientName}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-[#1A1A1A]">Yoga programming</h1>
          <p className="text-sm text-stone-500">Powered by Body Recode. The engine reads, you prescribe.</p>
        </div>
        <span className="shrink-0 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-[#1B6DFC]">yoga modality</span>
      </div>

      <YogaGeneratePanel clientId={clientId} />

      {latest && latestSession ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 bg-stone-50 border border-stone-200 rounded-lg px-4 py-3">
            <span className="text-sm text-stone-600">
              {latest.published_to_client_at
                ? 'This practice is live in the client portal.'
                : 'Draft. The client cannot see this until you publish it.'}
            </span>
            <YogaPublishButton programId={latest.id} published={!!latest.published_to_client_at} />
          </div>
          <PracticeView session={latestSession} />
        </div>
      ) : (
        <div className="bg-stone-50 border border-dashed border-stone-300 rounded-xl p-8 text-center text-sm text-stone-500">
          No practice yet. Generate one to get started.
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h2 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">Earlier practices</h2>
          <ul className="space-y-1">
            {past.map((p) => {
              const s = (p.sessions as YogaSession[] | undefined)?.[0]
              return (
                <li key={p.id} className="flex items-center justify-between bg-stone-100 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800">
                  <span>{s?.day_label ?? p.block_name}</span>
                  <span className="text-xs text-stone-400">{new Date(p.generated_at).toLocaleDateString()}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
