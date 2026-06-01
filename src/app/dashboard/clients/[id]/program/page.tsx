import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import DraftActions from './draft-actions'
import DeleteProgramButton from './delete-button'
import ProgramWeeklyReview from './weekly-review'
import ProgramReadingPanel from './program-reading-panel'
import TrajectoryReadingPanel from './trajectory-reading-panel'
import CoachGuidanceEditor from './coach-guidance-editor'
import { getWeekNumber } from '@/lib/weekly-checkin-questions'
import RegenerateButton from './regenerate-button'
import StickyScrollNav from '@/components/sticky-scroll-nav'

interface Exercise {
  exercise_name: string
  sets: number
  reps: string
  rpe: number | null
  rest: string
  notes: string
}

interface Block {
  block_label: string
  exercises: Exercise[]
}

interface Session {
  day_label: string
  skeleton: string
  movement_prep: string[]
  blocks: Block[]
}

interface Program {
  id: string
  client_id: string
  block_name: string
  progression_phase: string
  training_goal: string
  training_frequency: number
  training_age: string
  week_duration: number
  equipment_access: string[]
  sessions: Session[]
  weekly_pattern_summary: string | string[] | null
  progression_notes: string | string[] | null
  generated_at: string
  is_active: boolean
  status: 'draft' | 'active'
  current_direction: string | null
  last_review_at: string | null
  prescription_rationale: string | null
}

function parseText(text: string): { intro: string | null; points: string[] } {
  if (/\(\d+\)/.test(text)) {
    const firstIdx = text.search(/\(\d+\)/)
    const intro = firstIdx > 0 ? text.slice(0, firstIdx).trim() : null
    const rest = firstIdx > 0 ? text.slice(firstIdx) : text
    const points = rest.split(/\s*\(\d+\)\s*/).map((s: string) => s.trim()).filter(Boolean)
    return { intro, points }
  }
  const sentences = text.replace(/([.!?])\s+(?=[A-Z-])/g, '$1|||').split('|||').map((s: string) => s.trim()).filter((s: string) => s.length > 10)
  if (sentences.length >= 3) return { intro: null, points: sentences }
  return { intro: null, points: [text] }
}

function programNavSections(program: Program) {
  return [
    { id: 'identity', title: 'Identity' },
    ...(program.prescription_rationale ? [{ id: 'rationale', title: 'Rationale' }] : []),
    ...(program.weekly_pattern_summary ? [{ id: 'weekly-structure', title: 'Weekly Structure' }] : []),
    ...(program.progression_notes ? [{ id: 'progression', title: 'Progression' }] : []),
    { id: 'sessions', title: 'Sessions' },
  ]
}

function clean(s: string): string {
  return s.replace(/ - /g, ' ').replace(/-/g, ' ')
}

function parseLines(field: string | string[] | null, fallbackSplit?: RegExp): string[] {
  if (!field) return []
  if (Array.isArray(field)) return field.map(s => s.trim()).filter(Boolean)
  const trimmed = field.trim()
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) return parsed.map((s: string) => s.trim()).filter(Boolean)
    } catch {}
  }
  if (fallbackSplit) return trimmed.split(fallbackSplit).map(s => s.trim()).filter(Boolean)
  return [trimmed]
}

const phaseColour: Record<string, string> = {
  accumulation: 'text-blue-700 bg-blue-50 border-blue-200',
  intensification: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  realization: 'text-red-700 bg-red-50 border-red-200',
  restoration: 'text-green-400 bg-green-400/10 border-green-400/30',
}

const goalColour: Record<string, string> = {
  strength: 'text-violet-700 bg-violet-50 border-violet-200',
  hypertrophy: 'text-pink-400 bg-pink-400/10 border-pink-400/30',
  capacity: 'text-blue-500 bg-blue-50 border-blue-200',
}

function ProgramBody({ program, idPrefix = '' }: { program: Program; idPrefix?: string }) {
  return (
    <div className="space-y-4">
      {/* Identity card */}
      <div id={`${idPrefix}identity`} className="scroll-mt-8 bg-stone-100 border border-stone-200 rounded-xl p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-[#1A1A1A]">{program.block_name}</h2>
            <p className="text-xs text-stone-500 mt-1 capitalize">
              {program.training_frequency}x/week · {program.week_duration} weeks · {program.training_age}
            </p>
          </div>
          <div className="flex gap-1.5">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${phaseColour[program.progression_phase] || 'text-stone-600 bg-stone-200 border-stone-300'}`}>
              {program.progression_phase}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${goalColour[program.training_goal] || 'text-stone-600 bg-stone-200 border-stone-300'}`}>
              {program.training_goal}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-1">
          {program.equipment_access.map(eq => (
            <span key={eq} className="text-xs bg-stone-200 text-stone-600 px-2 py-0.5 rounded capitalize">{eq}</span>
          ))}
        </div>
        <p className="text-xs text-stone-400 mt-3">
          Generated {new Date(program.generated_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Prescription Rationale */}
      {program.prescription_rationale && (() => {
        const { intro, points } = parseText(clean(program.prescription_rationale))
        return (
          <div id={`${idPrefix}rationale`} className="scroll-mt-8 bg-blue-50 border border-blue-200/40 rounded-xl px-5 py-4">
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-3">Prescription Rationale</p>
            <div className="space-y-2">
              {intro && <p className="text-sm text-stone-800 leading-relaxed">{intro}</p>}
              {points.length > 1 ? (
                <div className="space-y-2">
                  {points.map((point, i) => (
                    <div key={i} className="flex items-start gap-2.5 border-l-2 border-blue-200/30 pl-3">
                      <p className="text-sm text-stone-700 leading-relaxed">{point}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-stone-700 leading-relaxed">{points[0]}</p>
              )}
            </div>
          </div>
        )
      })()}

      {/* Weekly Structure */}
      {program.weekly_pattern_summary && (
        <div id={`${idPrefix}weekly-structure`} className="scroll-mt-8 bg-stone-100 border border-stone-200 rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-stone-200 bg-stone-100/80">
            <span className="text-[11px] font-black text-[#1B6DFC]">01</span>
            <p className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">Weekly Structure</p>
          </div>
          <div className="px-5 py-4 space-y-3">
            {parseLines(program.weekly_pattern_summary, /(?=(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Day \d+)[^a-z]|Overall program|Constraints applied)/g).map((entry, i) => {
              const colonIdx = entry.indexOf(':')
              const hasLabel = colonIdx > 0 && colonIdx < 80
              const label = hasLabel ? entry.slice(0, colonIdx).trim() : null
              const content = hasLabel ? entry.slice(colonIdx + 1).trim() : entry.trim()
              return (
                <div key={i} className="border-l-2 border-stone-300 pl-3">
                  {label && <p className="text-[10px] font-bold text-[#1B6DFC] uppercase tracking-wider mb-1">{clean(label)}</p>}
                  <p className="text-sm text-stone-800 leading-relaxed">{clean(content)}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Progression Notes */}
      {program.progression_notes && (
        <div id={`${idPrefix}progression`} className="scroll-mt-8 bg-stone-100 border border-stone-200 rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-stone-200 bg-stone-100/80">
            <span className="text-[11px] font-black text-[#1B6DFC]">02</span>
            <p className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">Progression Strategy</p>
          </div>
          <div className="px-5 py-4 space-y-3">
            {parseLines(program.progression_notes, /(?=Week \d+)/g).map((entry, i) => {
              const colonIdx = entry.indexOf(':')
              const hasLabel = colonIdx > 0 && colonIdx < 80
              const label = hasLabel ? entry.slice(0, colonIdx).trim() : null
              const content = hasLabel ? entry.slice(colonIdx + 1).trim() : entry.trim()
              return (
                <div key={i} className="border-l-2 border-stone-300 pl-3">
                  {label && <p className="text-[10px] font-bold text-[#1B6DFC] uppercase tracking-wider mb-1">{clean(label)}</p>}
                  <p className="text-sm text-stone-800 leading-relaxed">{clean(content)}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Sessions */}
      <div id={`${idPrefix}sessions`} className="scroll-mt-8 mt-2">
        <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3 px-1">Sessions</p>
        <div className="space-y-3">
          {program.sessions.map((session, sIdx) => (
            <div key={sIdx} className="bg-stone-100 border border-stone-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-stone-200 flex items-center justify-between">
                <h3 className="font-semibold text-stone-900 text-sm">{clean(session.day_label)}</h3>
                <span className="text-[10px] text-stone-400 uppercase tracking-wide">{session.skeleton}</span>
              </div>
              <div className="divide-y divide-stone-200/60">
                {session.movement_prep?.length > 0 && (
                  <div className="px-5 py-4 bg-stone-200/30">
                    <p className="text-[10px] font-bold text-[#1B6DFC] uppercase tracking-widest mb-1">
                      Preparatory Entry - Movement Preparation
                    </p>
                    <p className="text-[10px] text-stone-400 mb-3">Non-Slot · Prepare joints, tissues, and coordination for the session&apos;s primary exposures</p>
                    <div className="space-y-1.5 mb-3">
                      {session.movement_prep.map((item, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-stone-400 mt-0.5">•</span>
                          <p className="text-sm text-stone-700">{item}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-stone-400 italic">Rest: short, informal (30–60 seconds as needed)</p>
                  </div>
                )}
                {session.blocks.map((block, bIdx) => (
                  <div key={bIdx} className="px-5 py-4">
                    <p className="text-[10px] font-bold text-[#1B6DFC] uppercase tracking-widest mb-3">{block.block_label}</p>
                    <div className="space-y-2.5">
                      {block.exercises.map((ex, eIdx) => (
                        <div key={eIdx}>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="flex-1 text-stone-800 font-medium">{ex.exercise_name}</span>
                            <span className="text-stone-600 whitespace-nowrap tabular-nums">
                              {ex.sets}×{ex.reps}
                              {ex.rpe !== null && <span className="text-stone-400"> · RPE {ex.rpe}</span>}
                            </span>
                            <span className="text-stone-400 whitespace-nowrap text-xs w-16 text-right">{ex.rest}</span>
                          </div>
                          {ex.notes && <p className="text-xs text-stone-400 italic mt-0.5">{clean(ex.notes)}</p>}
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

export default async function ProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name, onboarding_token, coaching_started_at')
    .eq('id', id)
    .maybeSingle()

  if (!client) notFound()

  const { data: programs } = await admin
    .from('programs')
    .select('*')
    .eq('client_id', id)
    .order('generated_at', { ascending: false })

  const draftProgram = programs?.find(p => p.status === 'draft') as Program | undefined
  const activeProgram = programs?.find(p => p.is_active) as Program | undefined
  const archivedPrograms = programs?.filter(p => !p.is_active && p.status !== 'draft') as Program[]

  // Resolve the parent training_plan for the draft (via plan_blocks). If the
  // draft was generated outside the macro-arc flow there will be no link and
  // we skip the coach-guidance editor for that draft.
  let draftTrainingPlan: { id: string; coach_guidance: string | null } | null = null
  if (draftProgram) {
    const { data: planBlock } = await admin
      .from('plan_blocks')
      .select('plan_id')
      .eq('program_id', draftProgram.id)
      .maybeSingle()
    if (planBlock?.plan_id) {
      const { data: tp } = await admin
        .from('training_plans')
        .select('id, coach_guidance')
        .eq('id', planBlock.plan_id)
        .maybeSingle()
      if (tp) draftTrainingPlan = tp
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-stone-500 text-sm mb-2">
            <Link href={`/dashboard/clients/${id}`} className="hover:text-stone-700 transition-colors">{client.name}</Link>
            <span>/</span>
            <span className="text-stone-700">Training Program</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">Training Program</h1>
        </div>
        <div className="flex items-center gap-2">
          {activeProgram && (
            <DeleteProgramButton programId={activeProgram.id} label="Delete Active Program" />
          )}
          {draftProgram && !activeProgram && (
            <DeleteProgramButton
              programId={draftProgram.id}
              label="Delete Draft"
              confirmMessage="Delete this draft training program? This cannot be undone."
            />
          )}
          <Link
            href={`/dashboard/clients/${id}/plan`}
            className="text-xs font-medium px-3 py-1.5 border border-stone-300 text-stone-600 rounded-lg hover:border-stone-500 hover:text-stone-800 transition-colors"
          >
            Macro Plan
          </Link>
        </div>
      </div>

      {/* Draft - show in full with Discard / Approve */}
      {draftProgram && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 border border-amber-700 text-amber-700 uppercase tracking-wide">Draft - Pending Approval</span>
            </div>
            <div className="flex items-center gap-2">
              {draftTrainingPlan && <RegenerateButton programId={draftProgram.id} />}
              <DraftActions programId={draftProgram.id} clientId={id} />
            </div>
          </div>
          {draftTrainingPlan && (
            <CoachGuidanceEditor
              trainingPlanId={draftTrainingPlan.id}
              initial={draftTrainingPlan.coach_guidance}
            />
          )}
          <ProgramBody program={draftProgram} idPrefix="draft-" />
        </div>
      )}

      {/* Rebuild alert */}
      {activeProgram?.current_direction === 'rebuild' && (
        <div className="mb-4 flex items-start gap-3 bg-red-50 border border-red-200/60 rounded-xl px-4 py-3">
          <svg className="w-4 h-4 text-red-700 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">Client is struggling with training</p>
            <p className="text-xs text-red-700/70 mt-0.5">Latest check-in direction is Rebuild. Consider adjusting the program or generating a new block.</p>
          </div>
          <Link href={`/dashboard/clients/${id}/plan`} className="text-xs font-semibold text-red-700 hover:text-red-700 shrink-0 mt-0.5">Open macro plan →</Link>
        </div>
      )}

      {/* Active program */}
      {activeProgram ? (
        <div>
          {draftProgram && (
            <div className="flex items-center gap-3 mb-4 mt-2">
              <div className="flex-1 h-px bg-stone-200" />
              <p className="text-xs text-stone-400 uppercase tracking-widest">Current Active Program</p>
              <div className="flex-1 h-px bg-stone-200" />
            </div>
          )}

          {/* Client-facing Program Reading - generate / edit / publish */}
          <ProgramReadingPanel
            program={activeProgram as unknown as Parameters<typeof ProgramReadingPanel>[0]['program']}
            clientToken={client.onboarding_token ?? null}
          />

          {/* Client-facing Block-end Trajectory Reading - reads the CFWS arc */}
          {(() => {
            const cs = client.coaching_started_at as string | null
            const gen = activeProgram.generated_at
            const dur = activeProgram.week_duration ?? null
            let blockStatus: Parameters<typeof TrajectoryReadingPanel>[0]['blockStatus'] = null
            if (cs && gen) {
              const startMs = new Date(cs).getTime()
              const startWeek = Math.floor((new Date(gen).getTime() - startMs) / 86_400_000 / 7) + 1
              const currentWeek = getWeekNumber(cs)
              const endWeek = dur ? startWeek + dur - 1 : currentWeek
              blockStatus = {
                isAtBlockEnd: currentWeek >= endWeek,
                currentWeek,
                weekDuration: dur,
                weeksRemaining: Math.max(0, endWeek - currentWeek),
              }
            }
            return (
              <TrajectoryReadingPanel
                program={activeProgram as unknown as Parameters<typeof TrajectoryReadingPanel>[0]['program']}
                clientToken={client.onboarding_token ?? null}
                blockStatus={blockStatus}
              />
            )
          })()}

          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Sessions</p>
            <Link
              href={`/dashboard/clients/${id}/program/draft/${activeProgram.id}`}
              className="text-xs font-medium px-3 py-1.5 border border-stone-300 text-stone-600 rounded-lg hover:border-[#1B6DFC] hover:text-[#1B6DFC] transition-colors"
            >
              Edit exercises →
            </Link>
          </div>

          <div className="flex gap-8">
            <StickyScrollNav sections={programNavSections(activeProgram)} />
            <div className="flex-1 min-w-0">
              <ProgramBody program={activeProgram} />
            </div>
          </div>

          {/* Weekly Review */}
          <div className="mt-4">
            <ProgramWeeklyReview
              programId={activeProgram.id}
              currentDirection={activeProgram.current_direction}
              lastReviewAt={activeProgram.last_review_at}
            />
          </div>

          {/* Archived Programs */}
          {archivedPrograms.length > 0 && (
            <div className="mt-6">
              <p className="text-stone-500 text-sm mb-3">Previous Programs ({archivedPrograms.length})</p>
              <div className="space-y-2">
                {archivedPrograms.map(p => (
                  <div key={p.id} className="bg-stone-100/50 border border-stone-200 rounded-lg px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-stone-600 opacity-70">{p.block_name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-stone-400">
                        {new Date(p.generated_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}<span className="capitalize">{p.progression_phase}</span>{' · '}<span className="capitalize">{p.training_goal}</span>
                      </span>
                      <DeleteProgramButton
                        programId={p.id}
                        label="Delete"
                        confirmMessage="Delete this archived training program? This cannot be undone."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : !draftProgram ? (
        <div className="text-center py-16 px-6 border-2 border-dashed border-stone-200 rounded-xl">
          <p className="text-stone-700 font-semibold mb-2">No program generated yet.</p>
          <p className="text-stone-500 text-sm max-w-md mx-auto mb-5 leading-relaxed">
            Programs are generated from a meso block in the macro plan. Build (or open) the plan, then hit Generate Program on the block you want to load.
          </p>
          <Link
            href={`/dashboard/clients/${id}/plan`}
            className="inline-block text-xs font-semibold px-4 py-2 bg-blue-500 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Open macro plan →
          </Link>
        </div>
      ) : null}
    </div>
  )
}
