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

function PracticeBody({ session, generatedAt }: { session: YogaSession; generatedAt?: string }) {
  const totalPoses = session.segments.reduce((n, s) => n + s.poses.length, 0)
  return (
    <div className="space-y-4">
      {/* Identity card */}
      <div className="bg-stone-100 border border-stone-200 rounded-xl p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-[#1A1A1A]">{session.day_label}</h2>
            <p className="text-xs text-stone-500 mt-1 capitalize">
              {session.segments.length} segments · {totalPoses} poses
            </p>
          </div>
          {session.ceiling && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full border capitalize text-[#1B6DFC] bg-blue-50 border-blue-200">
              {session.ceiling}
            </span>
          )}
        </div>
        {generatedAt && (
          <p className="text-xs text-stone-400 mt-3">
            Generated {new Date(generatedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
      </div>

      {/* Intention (rationale-style card) */}
      {session.intention && (
        <div className="bg-blue-50 border border-blue-200/40 rounded-xl px-5 py-4">
          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">Intention</p>
          <p className="text-sm text-stone-800 leading-relaxed">{session.intention}</p>
        </div>
      )}

      {/* Segments (mirror the strength "Sessions" card system) */}
      <div className="mt-2">
        <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3 px-1">Practice</p>
        <div className="space-y-3">
          {session.segments.map((seg, sIdx) => (
            <div key={sIdx} className="bg-stone-100 border border-stone-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-stone-200 flex items-center justify-between">
                <h3 className="font-semibold text-stone-900 text-sm">{seg.label}</h3>
                <span className="text-[10px] text-stone-400 uppercase tracking-wide">{seg.poses.length} poses</span>
              </div>
              <div className="divide-y divide-stone-200/60">
                {seg.poses.map((p, i) => (
                  <div key={i} className="px-5 py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm font-medium text-stone-900">
                        {p.name}
                        {p.side && p.side !== 'both' ? <span className="text-stone-400 font-normal"> ({p.side})</span> : null}
                        {p.sanskrit_name && <span className="ml-2 text-xs italic text-stone-400">{p.sanskrit_name}</span>}
                      </p>
                      {holdText(p) && <span className="whitespace-nowrap text-xs text-stone-500">{holdText(p)}</span>}
                    </div>
                    {p.cue && <p className="text-xs text-stone-500 mt-1 leading-relaxed">{p.cue}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Coach summary */}
      {session.summary && (
        <div className="bg-stone-100 border border-stone-200 rounded-xl px-5 py-4">
          <p className="text-[10px] font-bold text-stone-600 uppercase tracking-widest mb-2">For the client</p>
          <p className="text-sm text-stone-800 leading-relaxed">{session.summary}</p>
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
  const isPublished = !!latest?.published_to_client_at

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-stone-500 text-sm mb-2">
            <Link href={`/dashboard/clients/${clientId}`} className="hover:text-stone-700 transition-colors">{clientName}</Link>
            <span>/</span>
            <span className="text-stone-700">Yoga Practice</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">Yoga Practice</h1>
          <p className="text-sm text-stone-500 mt-1">Powered by Body Recode. The engine reads, you prescribe.</p>
        </div>
        <span className="shrink-0 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-[#1B6DFC]">yoga modality</span>
      </div>

      <div className="mb-6">
        <YogaGeneratePanel clientId={clientId} />
      </div>

      {latest && latestSession ? (
        <div>
          {/* Draft / publish action row, mirroring the strength draft treatment */}
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide border ${isPublished
              ? 'bg-blue-50 border-blue-200 text-[#1B6DFC]'
              : 'bg-amber-50 border-amber-700 text-amber-700'}`}>
              {isPublished ? 'Published' : 'Draft - Pending Approval'}
            </span>
            <YogaPublishButton programId={latest.id} published={isPublished} />
          </div>
          <PracticeBody session={latestSession} generatedAt={latest.generated_at} />
        </div>
      ) : (
        <div className="bg-stone-50 border border-dashed border-stone-300 rounded-xl p-8 text-center text-sm text-stone-500">
          No practice yet. Generate one to get started.
        </div>
      )}

      {past.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-stone-200" />
            <p className="text-xs text-stone-400 uppercase tracking-widest">Earlier practices</p>
            <div className="flex-1 h-px bg-stone-200" />
          </div>
          <ul className="space-y-2">
            {past.map((p) => {
              const s = (p.sessions as YogaSession[] | undefined)?.[0]
              return (
                <li key={p.id} className="flex items-center justify-between bg-stone-100 border border-stone-200 rounded-xl px-5 py-3 text-sm text-stone-800">
                  <span className="font-medium">{s?.day_label ?? p.block_name}</span>
                  <span className="text-xs text-stone-400">{new Date(p.generated_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
