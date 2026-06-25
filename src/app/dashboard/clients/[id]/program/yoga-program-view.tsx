import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import YogaPublishButton from './yoga-publish-button'
import ProgramReadingPanel from './program-reading-panel'
import StickyScrollNav from '@/components/sticky-scroll-nav'
import DraftActions from './draft-actions'
import DeleteProgramButton from './delete-button'
import ProgramWeeklyReview from './weekly-review'
import YogaSessionLog from './yoga-session-log'

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
interface YogaProgram {
  id: string
  block_name: string
  sessions: YogaSession[]
  generated_at: string
  is_active: boolean
  published_to_client_at: string | null
  prescription_rationale: string | null
  weekly_pattern_summary: string | null
  progression_notes: string | null
  training_frequency: number | null
  week_duration: number | null
}

function holdText(p: YogaPose): string {
  if (p.hold_seconds) return `${p.hold_seconds}s`
  if (p.breaths) return `${p.breaths} breaths`
  return ''
}

function paragraphs(text: string): string[] {
  return text.split(/\n{2,}|\n/).map((s) => s.trim()).filter(Boolean)
}

function TextSection({ id, num, label, body }: { id?: string; num: string; label: string; body: string }) {
  return (
    <div id={id} className="scroll-mt-8 bg-stone-100 border border-stone-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-stone-200 bg-stone-100/80">
        <span className="text-[11px] font-black text-[#1B6DFC]">{num}</span>
        <p className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">{label}</p>
      </div>
      <div className="px-5 py-4 space-y-3">
        {paragraphs(body).map((para, i) => (
          <p key={i} className="text-sm text-stone-800 leading-relaxed">{para}</p>
        ))}
      </div>
    </div>
  )
}

function BlockBody({ program }: { program: YogaProgram }) {
  const sessions = program.sessions ?? []
  const ceiling = sessions[0]?.ceiling
  return (
    <div className="space-y-4">
      {/* Identity card */}
      <div id="yoga-identity" className="scroll-mt-8 bg-stone-100 border border-stone-200 rounded-xl p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-[#1A1A1A]">{program.block_name}</h2>
            <p className="text-xs text-stone-500 mt-1 capitalize">
              {program.training_frequency ?? sessions.length}x/week · {program.week_duration ?? 4} weeks
            </p>
          </div>
          {ceiling && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full border capitalize text-[#1B6DFC] bg-blue-50 border-blue-200">
              {ceiling}
            </span>
          )}
        </div>
        <p className="text-xs text-stone-400 mt-3">
          Generated {new Date(program.generated_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Rationale */}
      {program.prescription_rationale && (
        <div id="yoga-rationale" className="scroll-mt-8 bg-blue-50 border border-blue-200/40 rounded-xl px-5 py-4">
          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-3">Prescription Rationale</p>
          <div className="space-y-2">
            {paragraphs(program.prescription_rationale).map((para, i) => (
              <p key={i} className="text-sm text-stone-800 leading-relaxed">{para}</p>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Structure */}
      {program.weekly_pattern_summary && (
        <TextSection id="yoga-weekly" num="01" label="Weekly Structure" body={program.weekly_pattern_summary} />
      )}

      {/* Progression */}
      {program.progression_notes && (
        <TextSection id="yoga-progression" num="02" label="Progression Strategy" body={program.progression_notes} />
      )}

      {/* Practices (the strength "Sessions" pattern) */}
      <div id="yoga-practices" className="scroll-mt-8 mt-2">
        <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3 px-1">Practices</p>
        <div className="space-y-3">
          {sessions.map((s, sIdx) => (
            <div key={sIdx} className="bg-stone-100 border border-stone-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-stone-200 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-stone-900 text-sm">{s.day_label}</h3>
                  {s.intention && <p className="text-xs text-stone-500 mt-0.5">{s.intention}</p>}
                </div>
                <span className="text-[10px] text-stone-400 uppercase tracking-wide shrink-0">
                  {s.segments.reduce((n, seg) => n + seg.poses.length, 0)} poses
                </span>
              </div>
              <div className="divide-y divide-stone-200/60">
                {s.segments.map((seg, i) => (
                  <div key={i} className="px-5 py-4">
                    <p className="text-[10px] font-bold text-[#1B6DFC] uppercase tracking-widest mb-2">{seg.label}</p>
                    <div className="space-y-2">
                      {seg.poses.map((p, j) => (
                        <div key={j}>
                          <div className="flex items-baseline justify-between gap-3">
                            <p className="text-sm font-medium text-stone-900">
                              {p.name}
                              {p.side && p.side !== 'both' ? <span className="text-stone-400 font-normal"> ({p.side})</span> : null}
                              {p.sanskrit_name && <span className="ml-2 text-xs italic text-stone-400">{p.sanskrit_name}</span>}
                            </p>
                            {holdText(p) && <span className="whitespace-nowrap text-xs text-stone-500">{holdText(p)}</span>}
                          </div>
                          {p.cue && <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">{p.cue}</p>}
                        </div>
                      ))}
                    </div>
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

function BlockSection({ program, withNav }: { program: YogaProgram; withNav: boolean }) {
  if (!withNav) return <BlockBody program={program} />
  return (
    <div className="flex gap-8">
      <StickyScrollNav sections={[
        { id: 'yoga-identity', title: 'Identity' },
        ...(program.prescription_rationale ? [{ id: 'yoga-rationale', title: 'Rationale' }] : []),
        ...(program.weekly_pattern_summary ? [{ id: 'yoga-weekly', title: 'Weekly Structure' }] : []),
        ...(program.progression_notes ? [{ id: 'yoga-progression', title: 'Progression' }] : []),
        { id: 'yoga-practices', title: 'Practices' },
      ]} />
      <div className="flex-1 min-w-0">
        <BlockBody program={program} />
      </div>
    </div>
  )
}

export default async function YogaProgramView({
  clientId, clientName, clientToken,
}: { clientId: string; clientName: string; clientToken: string | null }) {
  const admin = createAdminClient()
  const { data: programs } = await admin
    .from('programs')
    .select('id, block_name, sessions, generated_at, is_active, status, published_to_client_at, prescription_rationale, weekly_pattern_summary, progression_notes, training_frequency, week_duration, current_direction, last_review_at, pr_why_this_block, pr_what_this_program_is_doing, pr_how_well_know_its_working, pr_what_were_not_doing_yet, pr_coach_note, pr_coach_guidance, program_reading_generated_at, program_reading_published_at, program_reading_email_sent_at')
    .eq('client_id', clientId)
    .eq('modality', 'yoga')
    .order('generated_at', { ascending: false })

  type P = YogaProgram & { status?: string; current_direction?: string | null; last_review_at?: string | null }
  const all = (programs ?? []) as P[]
  const draftProgram = all.find((p) => p.status === 'draft')
  const activeProgram = all.find((p) => p.is_active && p.status !== 'draft')
  const past = all.filter((p) => p.id !== draftProgram?.id && p.id !== activeProgram?.id)

  // Session-log completions for the active block (coach + client logged practices).
  const { data: completions } = activeProgram
    ? await admin.from('session_completions')
        .select('id, session_index, day_label, completed_at, logged_by, session_notes')
        .eq('program_id', activeProgram.id).eq('status', 'completed')
    : { data: [] }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-stone-500 text-sm mb-2">
            <Link href={`/dashboard/clients/${clientId}`} className="hover:text-stone-700 transition-colors">{clientName}</Link>
            <span>/</span>
            <span className="text-stone-700">Yoga Block</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">Yoga Block</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {activeProgram && <YogaPublishButton programId={activeProgram.id} published={!!activeProgram.published_to_client_at} />}
          {activeProgram && <DeleteProgramButton programId={activeProgram.id} label="Delete Active Block" />}
          {draftProgram && !activeProgram && (
            <DeleteProgramButton programId={draftProgram.id} label="Delete Draft" confirmMessage="Delete this draft block? This cannot be undone." />
          )}
          <Link href={`/dashboard/clients/${clientId}/plan`}
            className="text-xs font-medium px-3 py-1.5 border border-stone-300 text-stone-600 rounded-lg hover:border-stone-500 hover:text-stone-800 transition-colors">
            Macro Plan
          </Link>
          <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-[#1B6DFC]">yoga modality</span>
        </div>
      </div>

      {/* Draft - pending approval */}
      {draftProgram && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 border border-amber-700 text-amber-700 uppercase tracking-wide">Draft - Pending Approval</span>
            <div className="flex items-center gap-2">
              <Link href={`/dashboard/clients/${clientId}/program/draft/${draftProgram.id}`}
                className="text-xs font-medium px-3 py-1.5 border border-stone-300 text-stone-600 rounded-lg hover:border-[#1B6DFC] hover:text-[#1B6DFC] transition-colors">
                Edit poses →
              </Link>
              <DraftActions programId={draftProgram.id} clientId={clientId} />
            </div>
          </div>
          <BlockSection program={draftProgram} withNav={false} />
        </div>
      )}

      {/* Active block */}
      {activeProgram ? (
        <div>
          {draftProgram && (
            <div className="flex items-center gap-3 mb-4 mt-2">
              <div className="flex-1 h-px bg-stone-200" />
              <p className="text-xs text-stone-400 uppercase tracking-widest">Current Active Block</p>
              <div className="flex-1 h-px bg-stone-200" />
            </div>
          )}
          {/* Client-facing Program Reading - active only, matching strength */}
          <div className="mb-4">
            <ProgramReadingPanel
              program={activeProgram as unknown as Parameters<typeof ProgramReadingPanel>[0]['program']}
              clientToken={clientToken}
              generateRoute="/api/generate-yoga-reading"
            />
          </div>
          <div className="flex justify-end mb-3">
            <Link href={`/dashboard/clients/${clientId}/program/draft/${activeProgram.id}`}
              className="text-xs font-medium px-3 py-1.5 border border-stone-300 text-stone-600 rounded-lg hover:border-[#1B6DFC] hover:text-[#1B6DFC] transition-colors">
              Edit poses →
            </Link>
          </div>
          <BlockSection program={activeProgram} withNav={true} />

          {/* Session Log - coach logs in-person practices for the client */}
          <div className="mt-4">
            <YogaSessionLog
              programId={activeProgram.id}
              practices={(activeProgram.sessions ?? []).map((s, i) => ({ index: i, day_label: s.day_label }))}
              completions={completions ?? []}
            />
          </div>

          {/* Weekly Review - client check-in feedback (reuses the strength component) */}
          <div className="mt-4">
            <ProgramWeeklyReview
              programId={activeProgram.id}
              currentDirection={(activeProgram as P).current_direction ?? null}
              lastReviewAt={(activeProgram as P).last_review_at ?? null}
            />
          </div>
        </div>
      ) : !draftProgram ? (
        <div className="bg-stone-50 border border-dashed border-stone-300 rounded-xl p-8 text-center text-sm text-stone-500">
          No block yet. Generate one from the{' '}
          <Link href={`/dashboard/clients/${clientId}/plan`} className="text-[#1B6DFC] hover:underline">Macro Plan</Link>.
        </div>
      ) : null}

      {past.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-stone-200" />
            <p className="text-xs text-stone-400 uppercase tracking-widest">Earlier blocks</p>
            <div className="flex-1 h-px bg-stone-200" />
          </div>
          <ul className="space-y-2">
            {past.map((p) => (
              <li key={p.id} className="flex items-center justify-between bg-stone-100 border border-stone-200 rounded-xl px-5 py-3 text-sm text-stone-800">
                <span className="font-medium">{p.block_name}</span>
                <span className="text-xs text-stone-400">{new Date(p.generated_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
