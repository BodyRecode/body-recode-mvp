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
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-1 flex items-center gap-2">
        <h3 className="text-base font-semibold">{session.day_label}</h3>
        {session.ceiling && (
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
            {session.ceiling}
          </span>
        )}
      </div>
      {session.intention && <p className="mb-4 text-sm text-gray-500">{session.intention}</p>}

      <div className="space-y-5">
        {session.segments.map((seg, i) => (
          <div key={i}>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-blue-600">{seg.label}</div>
            <ol className="space-y-2">
              {seg.poses.map((p, j) => (
                <li key={j} className="flex items-baseline gap-3 border-b border-gray-100 pb-2 last:border-0">
                  <span className="text-sm font-medium text-gray-900">
                    {p.name}
                    {p.side && p.side !== 'both' ? <span className="text-gray-400"> ({p.side})</span> : null}
                  </span>
                  {p.sanskrit_name && <span className="text-xs italic text-gray-400">{p.sanskrit_name}</span>}
                  {holdText(p) && <span className="ml-auto whitespace-nowrap text-xs text-gray-500">{holdText(p)}</span>}
                  {p.cue && <span className="basis-full text-xs text-gray-500">{p.cue}</span>}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      {session.summary && (
        <p className="mt-5 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">{session.summary}</p>
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
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/dashboard/clients/${clientId}`} className="text-xs text-gray-500 hover:text-gray-800">
            &larr; {clientName}
          </Link>
          <h1 className="mt-1 text-xl font-bold">Yoga programming</h1>
          <p className="text-sm text-gray-500">Powered by Body Recode. The engine reads, you prescribe.</p>
        </div>
        <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">yoga modality</span>
      </div>

      <YogaGeneratePanel clientId={clientId} />

      {latest && latestSession ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <span className="text-sm text-gray-600">
              {latest.published_to_client_at
                ? 'This practice is live in the client portal.'
                : 'Draft. The client cannot see this until you publish it.'}
            </span>
            <YogaPublishButton programId={latest.id} published={!!latest.published_to_client_at} />
          </div>
          <PracticeView session={latestSession} />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          No practice yet. Generate one to get started.
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-gray-700">Earlier practices</h2>
          <ul className="space-y-1">
            {past.map((p) => {
              const s = (p.sessions as YogaSession[] | undefined)?.[0]
              return (
                <li key={p.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm">
                  <span>{s?.day_label ?? p.block_name}</span>
                  <span className="text-xs text-gray-400">{new Date(p.generated_at).toLocaleDateString()}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
