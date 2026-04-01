import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'

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
}

const phaseColour: Record<string, string> = {
  accumulation: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  intensification: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  realization: 'text-red-400 bg-red-400/10 border-red-400/30',
  restoration: 'text-green-400 bg-green-400/10 border-green-400/30',
}

const goalColour: Record<string, string> = {
  strength: 'text-violet-400 bg-violet-400/10 border-violet-400/30',
  hypertrophy: 'text-pink-400 bg-pink-400/10 border-pink-400/30',
  capacity: 'text-teal-400 bg-teal-400/10 border-teal-400/30',
}

export default async function ProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name')
    .eq('id', id)
    .maybeSingle()

  if (!client) notFound()

  const { data: programs } = await admin
    .from('programs')
    .select('*')
    .eq('client_id', id)
    .order('generated_at', { ascending: false })

  const activeProgram = programs?.find(p => p.is_active) as Program | undefined
  const archivedPrograms = programs?.filter(p => !p.is_active) as Program[]

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-stone-500 text-sm mb-2">
            <Link href={`/dashboard/clients/${id}`} className="hover:text-stone-300 transition-colors">{client.name}</Link>
            <span>/</span>
            <span className="text-stone-300">Training Program</span>
          </div>
          <h1 className="text-2xl font-semibold text-white">Training Program</h1>
        </div>
        <Link
          href={`/dashboard/clients/${id}/program/generate`}
          className="text-xs font-medium px-3 py-1.5 border border-stone-700 text-stone-400 rounded-lg hover:border-stone-500 hover:text-stone-200 transition-colors"
        >
          {activeProgram ? 'Regenerate' : 'Generate Program'}
        </Link>
      </div>

      {!activeProgram ? (
        <div className="text-center py-16 border-2 border-dashed border-stone-800 rounded-xl">
          <p className="text-stone-500 mb-4">No program generated yet.</p>
          <Link
            href={`/dashboard/clients/${id}/program/generate`}
            className="text-xs font-medium px-3 py-1.5 border border-stone-700 text-stone-400 rounded-lg hover:border-stone-500 hover:text-stone-200 transition-colors"
          >
            Generate Program
          </Link>
        </div>
      ) : (
        <div className="space-y-4">

          {/* Program identity card */}
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold text-white">{activeProgram.block_name}</h2>
                <p className="text-xs text-stone-500 mt-1 capitalize">
                  {activeProgram.training_frequency}x/week · {activeProgram.week_duration} weeks · {activeProgram.training_age}
                </p>
              </div>
              <div className="flex gap-1.5">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${phaseColour[activeProgram.progression_phase] || 'text-stone-400 bg-stone-800 border-stone-700'}`}>
                  {activeProgram.progression_phase}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${goalColour[activeProgram.training_goal] || 'text-stone-400 bg-stone-800 border-stone-700'}`}>
                  {activeProgram.training_goal}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-1">
              {activeProgram.equipment_access.map(eq => (
                <span key={eq} className="text-xs bg-stone-800 text-stone-400 px-2 py-0.5 rounded capitalize">
                  {eq}
                </span>
              ))}
            </div>

            <p className="text-xs text-stone-600 mt-3">
              Generated {new Date(activeProgram.generated_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Weekly Structure */}
          {activeProgram.weekly_pattern_summary && (
            <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3 border-b border-stone-800 bg-stone-900/80">
                <span className="text-[11px] font-black text-[#10E1C2]">01</span>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Weekly Structure</p>
              </div>
              <div className="px-5 py-4 space-y-2">
                {(Array.isArray(activeProgram.weekly_pattern_summary)
                  ? activeProgram.weekly_pattern_summary
                  : activeProgram.weekly_pattern_summary.split('. ').filter(Boolean)
                ).map((line, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="text-[#10E1C2] mt-1.5 flex-shrink-0">•</span>
                    <p className="text-sm text-stone-200 leading-relaxed">{line.replace(/\.$/, '')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progression Notes */}
          {activeProgram.progression_notes && (
            <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3 border-b border-stone-800 bg-stone-900/80">
                <span className="text-[11px] font-black text-[#10E1C2]">02</span>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Progression Strategy</p>
              </div>
              <div className="px-5 py-4 space-y-3">
                {(Array.isArray(activeProgram.progression_notes)
                  ? activeProgram.progression_notes
                  : activeProgram.progression_notes.split(/(?=Week \d+:)/g).filter(Boolean)
                ).map((entry, i) => {
                  const colonIdx = entry.indexOf(':')
                  const hasLabel = colonIdx > 0 && colonIdx < 12
                  const label = hasLabel ? entry.slice(0, colonIdx) : null
                  const content = hasLabel ? entry.slice(colonIdx + 1).trim() : entry
                  return (
                    <div key={i} className="border-l-2 border-stone-700 pl-3">
                      {label && (
                        <p className="text-[10px] font-bold text-[#10E1C2] uppercase tracking-wider mb-1">{label}</p>
                      )}
                      <p className="text-sm text-stone-200 leading-relaxed">{content}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Sessions */}
          <div className="mt-2">
            <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3 px-1">Sessions</p>
            <div className="space-y-3">
              {activeProgram.sessions.map((session, sIdx) => (
                <div key={sIdx} className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-stone-800 flex items-center justify-between">
                    <h3 className="font-semibold text-stone-100 text-sm">{session.day_label}</h3>
                    <span className="text-[10px] text-stone-600 uppercase tracking-wide">{session.skeleton}</span>
                  </div>

                  <div className="divide-y divide-stone-800/60">
                    {/* Movement Prep — Non-Slot */}
                    {session.movement_prep?.length > 0 && (
                      <div className="px-5 py-4 bg-stone-800/30">
                        <p className="text-[10px] font-bold text-[#10E1C2] uppercase tracking-widest mb-1">
                          Preparatory Entry — Movement Preparation
                        </p>
                        <p className="text-[10px] text-stone-600 mb-3">Non-Slot · Prepare joints, tissues, and coordination for the session&apos;s primary exposures</p>
                        <div className="space-y-1.5 mb-3">
                          {session.movement_prep.map((item, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="text-stone-600 mt-0.5">•</span>
                              <p className="text-sm text-stone-300">{item}</p>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-stone-600 italic">Rest: short, informal (30–60 seconds as needed)</p>
                      </div>
                    )}

                    {session.blocks.map((block, bIdx) => (
                      <div key={bIdx} className="px-5 py-4">
                        <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-3">{block.block_label}</p>
                        <div className="space-y-2.5">
                          {block.exercises.map((ex, eIdx) => (
                            <div key={eIdx}>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="flex-1 text-stone-200 font-medium">{ex.exercise_name}</span>
                                <span className="text-stone-400 whitespace-nowrap tabular-nums">
                                  {ex.sets}×{ex.reps}
                                  {ex.rpe !== null && (
                                    <span className="text-stone-600"> · RPE {ex.rpe}</span>
                                  )}
                                </span>
                                <span className="text-stone-600 whitespace-nowrap text-xs w-16 text-right">{ex.rest}</span>
                              </div>
                              {ex.notes && (
                                <p className="text-xs text-stone-600 italic mt-0.5 pl-0">{ex.notes}</p>
                              )}
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

          {/* Archived Programs */}
          {archivedPrograms.length > 0 && (
            <div className="mt-6">
              <p className="text-stone-500 text-sm mb-3">Previous Programs ({archivedPrograms.length})</p>
              <div className="space-y-2">
                {archivedPrograms.map(p => (
                  <div key={p.id} className="bg-stone-900/50 border border-stone-800 rounded-lg px-4 py-3 flex items-center justify-between opacity-60">
                    <span className="text-sm text-stone-400">{p.block_name}</span>
                    <span className="text-xs text-stone-600">
                      {new Date(p.generated_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' · '}<span className="capitalize">{p.progression_phase}</span>{' · '}<span className="capitalize">{p.training_goal}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
