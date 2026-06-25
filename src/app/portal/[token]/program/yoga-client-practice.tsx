import Link from 'next/link'
import ClientHeader from '@/components/client-header'

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

// Client-facing render of a published yoga practice, in the portal aesthetic.
export default function YogaClientPractice({
  token, session,
}: { token: string; session: YogaSession }) {
  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1A]">
      <ClientHeader />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <Link href={`/portal/${token}`} className="text-[#999999] hover:text-[#3A3A3A] text-sm transition-colors">← Back</Link>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mt-4 mb-1">Your Practice</h1>
          {session.intention && <p className="text-[#6B6B6B] text-sm">{session.intention}</p>}
        </div>

        <div className="rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF] p-6">
          <h2 className="text-lg font-bold text-[#1A1A1A] mb-5">{session.day_label}</h2>
          <div className="space-y-6">
            {session.segments.map((seg, i) => (
              <div key={i}>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#3A3A3A]">{seg.label}</div>
                <ol className="space-y-3">
                  {seg.poses.map((p, j) => (
                    <li key={j} className="border-b border-[#F0F0F0] pb-3 last:border-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[15px] font-semibold text-[#1A1A1A]">
                          {p.name}
                          {p.side && p.side !== 'both' ? <span className="text-[#999999] font-normal"> ({p.side})</span> : null}
                        </span>
                        {holdText(p) && <span className="whitespace-nowrap text-xs text-[#6B6B6B]">{holdText(p)}</span>}
                      </div>
                      {p.cue && <p className="mt-1 text-sm text-[#6B6B6B]">{p.cue}</p>}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>

          {session.summary && (
            <p className="mt-6 rounded-xl bg-[#F7F7F7] p-4 text-sm text-[#3A3A3A]">{session.summary}</p>
          )}
        </div>
      </div>
    </div>
  )
}
