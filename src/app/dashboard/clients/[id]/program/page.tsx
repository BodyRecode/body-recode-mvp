import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import DraftActions from './draft-actions'
import DeleteProgramButton from './delete-button'
import NotifyClientButton from './notify-client-button'
import ProgramWeeklyReview from './weekly-review'
import ProgramReadingPanel from './program-reading-panel'
import ConditioningEditor from './conditioning-editor'
import TrajectoryReadingPanel from './trajectory-reading-panel'
import CoachGuidanceEditor from './coach-guidance-editor'
import { getWeekNumber } from '@/lib/weekly-checkin-questions'
import RegenerateButton from './regenerate-button'
import StickyScrollNav from '@/components/sticky-scroll-nav'
import { GlanceCard, flagsPill, type GlancePill } from '@/components/glance-card'

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
  conditioning: string | null
  weekly_pattern_summary: string | string[] | null
  progression_notes: string | string[] | null
  generated_at: string
  is_active: boolean
  status: 'draft' | 'active'
  current_direction: string | null
  last_review_at: string | null
  prescription_rationale: string | null
  // Coach-facing summary card (2026-07-05). Generator produces this
  // alongside prescription_rationale so the coach page can lead with
  // a scannable read and hide the clinical wall behind an expand. Null
  // on programs generated before this shipped — UI falls through to the
  // verbose fields in that case.
  rationale_summary: {
    headline?: string
    scan?: {
      phase?: string
      rpe_ceiling?: string
      frequency?: string
      load_direction?: string
      flags_count?: number | string
    }
    operating_rules?: string[]
  } | null
  // 2026-06-09: client-facing notification decoupled from reading state.
  published_to_client_at?: string | null
  published_to_client_by?: string | null
  program_reading_published_at?: string | null
  trajectory_reading_published_at?: string | null
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

      {/* Rationale Summary — coach-facing scannable card (2026-07-05).
          Leads the page. Headline + scan pills + 3-5 operating rules.
          Full clinical detail (prescription_rationale + weekly_pattern_summary
          + progression_notes) is collapsed underneath. Programs generated
          before this shipped have rationale_summary = null; those fall
          through to the verbose sections in-line as before. */}
      {program.rationale_summary?.headline && (
        <div id={`${idPrefix}rationale`} className="scroll-mt-8">
          <GlanceCard
            headline={clean(program.rationale_summary.headline)}
            pills={[
              program.rationale_summary.scan?.phase ? { text: program.rationale_summary.scan.phase, tone: 'neutral' } : null,
              program.rationale_summary.scan?.rpe_ceiling ? { text: `RPE ${program.rationale_summary.scan.rpe_ceiling}`, tone: 'neutral' } : null,
              program.rationale_summary.scan?.frequency ? { text: program.rationale_summary.scan.frequency, tone: 'neutral' } : null,
              program.rationale_summary.scan?.load_direction ? { text: program.rationale_summary.scan.load_direction, tone: 'neutral' } : null,
              flagsPill(program.rationale_summary.scan?.flags_count),
            ].filter(Boolean) as GlancePill[]}
            bulletGroups={[{ tone: 'accent', items: (program.rationale_summary.operating_rules ?? []).map(clean).filter(Boolean) }]}
          >
          {/* Collapsible full clinical rationale */}
          {(program.prescription_rationale || program.weekly_pattern_summary || program.progression_notes) && (
            <details className="mt-5 group">
              <summary className="cursor-pointer text-[11px] font-semibold text-[#1B6DFC] hover:text-blue-700 select-none list-none flex items-center gap-1.5">
                <span className="inline-block transition-transform group-open:rotate-90">▸</span>
                Open full clinical rationale
              </summary>
              <div className="mt-4 space-y-3">
                {program.prescription_rationale && (() => {
                  const { intro, points } = parseText(clean(program.prescription_rationale))
                  return (
                    <div className="bg-white/60 border border-blue-100 rounded-lg px-4 py-3">
                      <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">Prescription Rationale</p>
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
                {program.weekly_pattern_summary && (
                  <div id={`${idPrefix}weekly-structure`} className="scroll-mt-8 bg-white/60 border border-stone-200 rounded-lg overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-stone-200">
                      <p className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">Weekly Structure</p>
                    </div>
                    <div className="px-4 py-3 space-y-3">
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
                {program.progression_notes && (
                  <div id={`${idPrefix}progression`} className="scroll-mt-8 bg-white/60 border border-stone-200 rounded-lg overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-stone-200">
                      <p className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">Progression Strategy</p>
                    </div>
                    <div className="px-4 py-3 space-y-3">
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
              </div>
            </details>
          )}
          </GlanceCard>
        </div>
      )}

      {/* Fallback: legacy verbose sections when no rationale_summary exists.
          Programs generated before 2026-07-05 don't have the summary shape,
          so we render the pre-2026-07-05 layout instead. */}
      {!program.rationale_summary?.headline && program.prescription_rationale && (() => {
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

      {!program.rationale_summary?.headline && program.weekly_pattern_summary && (
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

      {!program.rationale_summary?.headline && program.progression_notes && (
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

      {/* Conditioning / Cardio — interim coach-editable field until the
          conditioning modality generates it. Shown to the client too. */}
      <ConditioningEditor clientId={program.client_id} programId={program.id} initial={program.conditioning} />

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

  // Same resolution for the active program so the coach can update guidance
  // and trigger a regeneration without first having to advance to a new
  // macro block.
  // Resolve the active client's training plan with a fallback chain so the
  // Regenerate button + Coach Guidance editor NEVER go missing just because
  // the plan_block → program link got orphaned (e.g. after a discarded draft).
  //   1. plan_block → training_plan (canonical macro-arc link)
  //   2. training_plans.is_active for this client (fallback)
  //   3. any training_plan for this client (last resort)
  // Bug history: prior to 2026-07-20 the button was gated on step 1 alone,
  // so any workflow that orphaned the plan_block hid the Regenerate button
  // even though the training plan and its coach guidance were still intact.
  let activeTrainingPlan: { id: string; coach_guidance: string | null } | null = null
  if (activeProgram) {
    const { data: planBlock } = await admin
      .from('plan_blocks')
      .select('plan_id')
      .eq('program_id', activeProgram.id)
      .maybeSingle()
    if (planBlock?.plan_id) {
      const { data: tp } = await admin
        .from('training_plans')
        .select('id, coach_guidance')
        .eq('id', planBlock.plan_id)
        .maybeSingle()
      if (tp) activeTrainingPlan = tp
    }
    if (!activeTrainingPlan) {
      const { data: tp } = await admin
        .from('training_plans')
        .select('id, coach_guidance')
        .eq('client_id', activeProgram.client_id)
        .eq('is_active', true)
        .maybeSingle()
      if (tp) activeTrainingPlan = tp
    }
    if (!activeTrainingPlan) {
      const { data: tp } = await admin
        .from('training_plans')
        .select('id, coach_guidance')
        .eq('client_id', activeProgram.client_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (tp) activeTrainingPlan = tp
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
            <NotifyClientButton
              programId={activeProgram.id}
              publishedToClientAt={activeProgram.published_to_client_at ?? null}
              programReadingPublishedAt={activeProgram.program_reading_published_at ?? null}
            />
          )}
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

          {/* Most recent archived program's Block-End Trajectory Reading.
              Always renders so the coach can either (a) generate + publish a
              pending one or (b) re-view a published one. Without this the
              archived block's reading was unreachable from the program page
              entirely - the main TrajectoryReadingPanel below ties to the
              ACTIVE program. Amber notice only shows when the reading hasn't
              been published yet (pending action). */}
          {(() => {
            const archived = archivedPrograms?.[0]
            if (!archived) return null
            const isPending = !archived.trajectory_reading_published_at
            const blockStatus: Parameters<typeof TrajectoryReadingPanel>[0]['blockStatus'] = {
              isAtBlockEnd: true,
              currentWeek: null,
              weekDuration: archived.week_duration ?? null,
              weeksRemaining: 0,
            }
            const endedAt = archived.generated_at && archived.week_duration
              ? new Date(new Date(archived.generated_at).getTime() + archived.week_duration * 7 * 86_400_000).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
              : null
            return (
              <div className="mb-6">
                {isPending ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-3">
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-1">Pending block-end reading</p>
                    <p className="text-sm text-amber-800">
                      <span className="font-semibold">{archived.block_name}</span> ended{endedAt ? ` around ${endedAt}` : ''} but its trajectory reading was never generated. Generate it now so the client has a record of the block arc before the next one is in full swing.
                    </p>
                  </div>
                ) : (
                  <div className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 mb-3">
                    <p className="text-xs font-bold text-stone-600 uppercase tracking-widest mb-1">Previous block reading</p>
                    <p className="text-sm text-stone-700">
                      Block-end reading for <span className="font-semibold">{archived.block_name}</span>{endedAt ? `, ended around ${endedAt}` : ''}. Published to the client portal. Edit + republish below if needed.
                    </p>
                  </div>
                )}
                <TrajectoryReadingPanel
                  program={archived as unknown as Parameters<typeof TrajectoryReadingPanel>[0]['program']}
                  clientToken={client.onboarding_token ?? null}
                  blockStatus={blockStatus}
                />
              </div>
            )
          })()}

          {/* Client-facing Block-end Trajectory Reading - reads the CFWS arc.
              Only renders for the ACTIVE block once it has reached its end —
              before that, the panel just shows a countdown that adds noise
              without any action attached. The full block-end visibility job
              is handled by the rescue paths (Today's Focus action card,
              client profile amber banner, archived-block inline notice on
              this page above), so a mid-block countdown panel was redundant. */}
          {(() => {
            const cs = client.coaching_started_at as string | null
            const gen = activeProgram.generated_at
            const dur = activeProgram.week_duration ?? null
            if (!cs || !gen || !dur) return null
            const startMs = new Date(cs).getTime()
            const startWeek = Math.floor((new Date(gen).getTime() - startMs) / 86_400_000 / 7) + 1
            const currentWeek = getWeekNumber(cs)
            const endWeek = startWeek + dur - 1
            const isAtBlockEnd = currentWeek >= endWeek
            if (!isAtBlockEnd) return null
            const blockStatus: Parameters<typeof TrajectoryReadingPanel>[0]['blockStatus'] = {
              isAtBlockEnd: true,
              currentWeek,
              weekDuration: dur,
              weeksRemaining: 0,
            }
            return (
              <TrajectoryReadingPanel
                program={activeProgram as unknown as Parameters<typeof TrajectoryReadingPanel>[0]['program']}
                clientToken={client.onboarding_token ?? null}
                blockStatus={blockStatus}
              />
            )
          })()}

          {activeTrainingPlan && (
            <CoachGuidanceEditor
              trainingPlanId={activeTrainingPlan.id}
              initial={activeTrainingPlan.coach_guidance}
            />
          )}

          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Sessions</p>
            <div className="flex items-center gap-2">
              {/* Regenerate is available whenever there IS an active program.
                  It used to be gated on activeTrainingPlan too, which meant
                  a broken plan_block link hid the button — never again. */}
              <RegenerateButton programId={activeProgram.id} />
              <Link
                href={`/dashboard/clients/${id}/program/draft/${activeProgram.id}`}
                className="text-xs font-medium px-3 py-1.5 border border-stone-300 text-stone-600 rounded-lg hover:border-[#1B6DFC] hover:text-[#1B6DFC] transition-colors"
              >
                Edit exercises →
              </Link>
            </div>
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
