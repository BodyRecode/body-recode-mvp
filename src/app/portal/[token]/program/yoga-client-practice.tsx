import Link from 'next/link'
import ClientHeader from '@/components/client-header'
import ProgramReadingInline from '@/components/program-reading-inline'
import YogaClientProgress from './yoga-client-progress'

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
  intention?: string | null
  ceiling?: string
  segments: YogaSegment[]
}
interface Reading {
  pr_why_this_block: string | null
  pr_what_this_program_is_doing: string | null
  pr_how_well_know_its_working: string | null
  pr_what_were_not_doing_yet: string | null
  pr_coach_note: string | null
  program_reading_published_at: string | null
}

function holdText(p: YogaPose): string {
  if (p.hold_seconds) return `${p.hold_seconds}s`
  if (p.breaths) return `${p.breaths} breaths`
  return ''
}

export default function YogaClientPractice({
  token, programId, blockName, sessions, reading, weeks, completions,
}: { token: string; programId: string; blockName: string; sessions: YogaSession[]; reading: Reading | null; weeks: number; completions: { session_index: number; week_number_in_block: number }[] }) {
  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1A]">
      <ClientHeader />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <Link href={`/portal/${token}`} className="text-[#999999] hover:text-[#3A3A3A] text-sm transition-colors">← Back</Link>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mt-4 mb-1">Your Practice</h1>
          <p className="text-[#6B6B6B] text-sm">{blockName}</p>
        </div>

        <div className="space-y-5">
          {/* Program Reading - the why frames the practices below */}
          {reading && (
            <ProgramReadingInline
              reading={reading}
              documentHref={`/portal/${token}/program/reading`}
            />
          )}

          {/* Block progress - log each practice, week by week */}
          <YogaClientProgress
            token={token}
            programId={programId}
            weeks={weeks}
            practices={sessions.map((s, i) => ({ index: i, day_label: s.day_label }))}
            completions={completions}
          />

          {sessions.map((session, sIdx) => (
            <div key={sIdx} className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl p-5">
              <p className="text-lg font-bold text-[#1A1A1A] mb-1">{session.day_label}</p>
              {session.intention && <p className="text-sm text-[#6B6B6B] mb-4">{session.intention}</p>}
              <div className="space-y-6">
                {session.segments.map((seg, i) => (
                  <div key={i}>
                    <p className="mb-2 text-xs font-bold text-[#1B6DFC] uppercase tracking-widest">{seg.label}</p>
                    <ol className="space-y-3">
                      {seg.poses.map((p, j) => (
                        <li key={j} className="border-b border-[#E5E5E5] pb-3 last:border-0 last:pb-0">
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="text-[15px] font-semibold text-[#1A1A1A]">
                              {p.name}
                              {p.side && p.side !== 'both' ? <span className="text-[#999999] font-normal"> ({p.side})</span> : null}
                            </span>
                            {holdText(p) && <span className="whitespace-nowrap text-xs text-[#999999]">{holdText(p)}</span>}
                          </div>
                          {p.cue && <p className="mt-1 text-sm text-[#3A3A3A] leading-relaxed">{p.cue}</p>}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
