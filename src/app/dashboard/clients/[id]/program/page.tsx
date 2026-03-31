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
  weekly_pattern_summary: string | null
  progression_notes: string | null
  generated_at: string
  is_active: boolean
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

  const phaseColour: Record<string, string> = {
    accumulation: 'bg-blue-100 text-blue-800',
    intensification: 'bg-orange-100 text-orange-800',
    realization: 'bg-red-100 text-red-800',
    restoration: 'bg-green-100 text-green-800',
  }

  const goalColour: Record<string, string> = {
    strength: 'bg-purple-100 text-purple-800',
    hypertrophy: 'bg-pink-100 text-pink-800',
    capacity: 'bg-teal-100 text-teal-800',
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href={`/dashboard/clients/${id}`} className="text-sm text-gray-500 hover:text-gray-700">
            ← {client.name}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Training Program</h1>
        </div>
        <Link
          href={`/dashboard/clients/${id}/program/generate`}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          {activeProgram ? 'Regenerate Program' : 'Generate Program'}
        </Link>
      </div>

      {!activeProgram ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-500 mb-4">No program generated yet.</p>
          <Link
            href={`/dashboard/clients/${id}/program/generate`}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Generate Program
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Program Header */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{activeProgram.block_name}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {activeProgram.training_frequency}x/week · {activeProgram.week_duration} weeks · {activeProgram.training_age}
                </p>
              </div>
              <div className="flex gap-2">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${phaseColour[activeProgram.progression_phase] || 'bg-gray-100 text-gray-700'}`}>
                  {activeProgram.progression_phase}
                </span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${goalColour[activeProgram.training_goal] || 'bg-gray-100 text-gray-700'}`}>
                  {activeProgram.training_goal}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {activeProgram.equipment_access.map(eq => (
                <span key={eq} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {eq}
                </span>
              ))}
            </div>

            {activeProgram.weekly_pattern_summary && (
              <div className="text-sm text-gray-700 bg-gray-50 rounded-md p-3 mb-3">
                <span className="font-medium">Weekly structure: </span>
                {activeProgram.weekly_pattern_summary}
              </div>
            )}

            {activeProgram.progression_notes && (
              <div className="text-sm text-gray-700 bg-gray-50 rounded-md p-3">
                <span className="font-medium">Progression: </span>
                {activeProgram.progression_notes}
              </div>
            )}

            <p className="text-xs text-gray-400 mt-4">
              Generated {new Date(activeProgram.generated_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Sessions */}
          {activeProgram.sessions.map((session, sIdx) => (
            <div key={sIdx} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{session.day_label}</h3>
                <span className="text-xs text-gray-400">{session.skeleton}</span>
              </div>

              <div className="divide-y divide-gray-100">
                {session.blocks.map((block, bIdx) => (
                  <div key={bIdx} className="px-6 py-4">
                    <h4 className="text-sm font-medium text-gray-600 mb-3">{block.block_label}</h4>
                    <div className="space-y-2">
                      {block.exercises.map((ex, eIdx) => (
                        <div key={eIdx} className="flex items-start gap-4 text-sm">
                          <div className="flex-1 font-medium text-gray-900">{ex.exercise_name}</div>
                          <div className="text-gray-600 whitespace-nowrap">
                            {ex.sets}×{ex.reps}
                            {ex.rpe !== null && ` · RPE ${ex.rpe}`}
                          </div>
                          <div className="text-gray-400 whitespace-nowrap text-xs">{ex.rest}</div>
                        </div>
                      ))}
                    </div>

                    {/* Show notes for exercises that have them */}
                    {block.exercises.some(e => e.notes) && (
                      <div className="mt-3 space-y-1">
                        {block.exercises.filter(e => e.notes).map((ex, eIdx) => (
                          <p key={eIdx} className="text-xs text-gray-500 italic">
                            {ex.exercise_name}: {ex.notes}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Archived Programs */}
          {archivedPrograms.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Previous Programs</h3>
              <div className="space-y-2">
                {archivedPrograms.map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md px-4 py-2 text-sm">
                    <span className="text-gray-700">{p.block_name}</span>
                    <span className="text-gray-400 text-xs">
                      {new Date(p.generated_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' · '}{p.progression_phase} · {p.training_goal}
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
