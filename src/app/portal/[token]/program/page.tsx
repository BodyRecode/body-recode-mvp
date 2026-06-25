import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import ClientHeader from '@/components/client-header'
import ProgramReadingInline from '@/components/program-reading-inline'
import TrajectoryReadingInline from '@/components/trajectory-reading-inline'
import YogaClientPractice from './yoga-client-practice'
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

const directionColour: Record<string, string> = {
  progress: 'text-green-400 bg-green-400/10 border-green-400/30',
  hold: 'text-amber-700 bg-amber-50 border-amber-200',
  rebuild: 'text-red-700 bg-red-50 border-red-200',
  deload: 'text-blue-700 bg-blue-50 border-blue-200',
}

const directionLabel: Record<string, string> = {
  progress: 'Making progress',
  hold: 'Staying steady',
  rebuild: 'Struggling',
  deload: 'Deload',
}

export default async function PortalProgramPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name')
    .eq('onboarding_token', token)
    .maybeSingle()

  if (!client) return notFound()

  const { data: program } = await admin
    .from('programs')
    .select('id, modality, block_name, progression_phase, training_goal, training_frequency, week_duration, sessions, weekly_pattern_summary, progression_notes, client_note, current_direction, last_review_at, pr_why_this_block, pr_what_this_program_is_doing, pr_how_well_know_its_working, pr_what_were_not_doing_yet, pr_coach_note, program_reading_published_at, tr_where_this_block_started, tr_how_your_signal_moved, tr_what_held_steady, tr_what_this_sets_up_next, tr_coach_note, trajectory_reading_published_at')
    .eq('client_id', client.id)
    .eq('is_active', true)
    .maybeSingle()

  // Modality fork: a published yoga block renders the yoga view.
  if (program?.modality === 'yoga') {
    const yogaSessions = (program.sessions as Array<Record<string, unknown>> | undefined) ?? []
    if (yogaSessions.length) {
      const reading = program.program_reading_published_at ? {
        pr_why_this_block: program.pr_why_this_block,
        pr_what_this_program_is_doing: program.pr_what_this_program_is_doing,
        pr_how_well_know_its_working: program.pr_how_well_know_its_working,
        pr_what_were_not_doing_yet: program.pr_what_were_not_doing_yet,
        pr_coach_note: program.pr_coach_note,
        program_reading_published_at: program.program_reading_published_at,
      } : null
      const { data: comps } = await admin
        .from('session_completions')
        .select('session_index')
        .eq('program_id', program.id).eq('status', 'completed')
      const loggedIndexes = (comps ?? []).map((c) => c.session_index as number)
      return (
        // @ts-expect-error sessions JSONB is loosely typed at the DB boundary
        <YogaClientPractice token={token} programId={program.id} blockName={program.block_name} sessions={yogaSessions} reading={reading} loggedIndexes={loggedIndexes} />
      )
    }
  }

  const programReadingPublished = !!program?.program_reading_published_at
  const trajectoryReadingPublished = !!program?.trajectory_reading_published_at

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1A]">
      <ClientHeader />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <Link href={`/portal/${token}`} className="text-[#999999] hover:text-[#3A3A3A] text-sm transition-colors">← Back</Link>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mt-4 mb-1">Your Program</h1>
          <p className="text-[#6B6B6B] text-sm">Your current training block.</p>
        </div>

        {!program ? (
          <div className="rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF] p-6 text-center">
            <p className="text-[#999999] text-sm">No active training program yet. Your coach will set this up for you.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Program Reading - the why frames every session view below */}
            {programReadingPublished && (
              <ProgramReadingInline
                reading={{
                  pr_why_this_block: program.pr_why_this_block,
                  pr_what_this_program_is_doing: program.pr_what_this_program_is_doing,
                  pr_how_well_know_its_working: program.pr_how_well_know_its_working,
                  pr_what_were_not_doing_yet: program.pr_what_were_not_doing_yet,
                  pr_coach_note: program.pr_coach_note,
                  program_reading_published_at: program.program_reading_published_at,
                }}
                documentHref={`/portal/${token}/program/reading`}
              />
            )}

            {/* Block-end Trajectory Reading - the arc across the whole block */}
            {trajectoryReadingPublished && (
              <TrajectoryReadingInline
                reading={{
                  tr_where_this_block_started: program.tr_where_this_block_started,
                  tr_how_your_signal_moved: program.tr_how_your_signal_moved,
                  tr_what_held_steady: program.tr_what_held_steady,
                  tr_what_this_sets_up_next: program.tr_what_this_sets_up_next,
                  tr_coach_note: program.tr_coach_note,
                  trajectory_reading_published_at: program.trajectory_reading_published_at,
                }}
                documentHref={`/portal/${token}/program/trajectory-reading`}
              />
            )}

            {/* Legacy client_note - shown only when no Program Reading has been published yet */}
            {!programReadingPublished && program.client_note && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4">
                <p className="text-xs font-bold text-[#1B6DFC] uppercase tracking-widest mb-2">About this block</p>
                <p className="text-sm text-[#3A3A3A] leading-relaxed">{program.client_note}</p>
              </div>
            )}

            {/* Block overview */}
            <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-lg font-bold text-[#1A1A1A]">{program.block_name}</p>
                  <p className="text-xs text-[#999999] mt-0.5">{program.progression_phase} · {program.training_goal}</p>
                </div>
                {program.current_direction && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize shrink-0 ${directionColour[program.current_direction] || 'text-[#6B6B6B] bg-[#E5E5E5] border-[#E5E5E5]'}`}>
                    {directionLabel[program.current_direction] ?? program.current_direction}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#E5E5E5]/60 rounded-xl px-3 py-2.5">
                  <p className="text-xs text-[#999999] mb-0.5">Sessions / week</p>
                  <p className="text-sm font-semibold text-[#1A1A1A]">{program.training_frequency}x</p>
                </div>
                <div className="bg-[#E5E5E5]/60 rounded-xl px-3 py-2.5">
                  <p className="text-xs text-[#999999] mb-0.5">Block length</p>
                  <p className="text-sm font-semibold text-[#1A1A1A]">{program.week_duration} weeks</p>
                </div>
              </div>
            </div>

            {/* Sessions */}
            {Array.isArray(program.sessions) && program.sessions.length > 0 && (
              <div className="space-y-4">
                <p className="text-xs font-bold text-[#999999] uppercase tracking-widest">Sessions</p>
                {(program.sessions as Session[]).map((session, si) => (
                  <div key={si} className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-[#E5E5E5]">
                      <p className="text-sm font-bold text-[#1A1A1A]">{session.day_label}</p>
                      <p className="text-xs text-[#999999] mt-0.5">{session.skeleton}</p>
                    </div>

                    {/* Movement prep */}
                    {session.movement_prep && session.movement_prep.length > 0 && (
                      <div className="px-5 py-3 border-b border-[#E5E5E5]/60">
                        <p className="text-xs font-semibold text-[#999999] uppercase tracking-wider mb-2">Movement Preparation</p>
                        <ul className="space-y-1">
                          {session.movement_prep.map((item, i) => (
                            <li key={i} className="text-xs text-[#6B6B6B] flex gap-2">
                              <span className="text-[#999999] shrink-0">·</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Blocks */}
                    {session.blocks.map((block, bi) => (
                      <div key={bi} className="px-5 py-3 border-b border-[#E5E5E5]/40 last:border-0">
                        <p className="text-xs font-bold text-[#1B6DFC] uppercase tracking-widest mb-2">{block.block_label}</p>
                        <div className="space-y-3">
                          {block.exercises.map((ex, ei) => (
                            <div key={ei} className="flex flex-col gap-1">
                              <p className="text-sm font-semibold text-[#1A1A1A]">{ex.exercise_name}</p>
                              <div className="flex flex-wrap gap-2">
                                <span className="text-xs bg-[#E5E5E5] text-[#3A3A3A] px-2 py-0.5 rounded-lg">{ex.sets} × {ex.reps}</span>
                                {ex.rpe && <span className="text-xs bg-[#E5E5E5] text-[#6B6B6B] px-2 py-0.5 rounded-lg">RPE {ex.rpe}</span>}
                                {ex.rest && <span className="text-xs bg-[#E5E5E5] text-[#6B6B6B] px-2 py-0.5 rounded-lg">{ex.rest} rest</span>}
                              </div>
                              {ex.notes && <p className="text-xs text-[#999999] leading-relaxed">{ex.notes}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}


            <Link
              href={`/portal/${token}/program/log`}
              className="block w-full py-3.5 bg-[#1B6DFC] hover:bg-[#5390FF] text-white font-bold text-sm rounded-2xl text-center transition-colors mb-2"
            >
              Log a session →
            </Link>

            <Link
              href={`/portal/${token}/training`}
              className="block w-full py-3.5 bg-[#E5E5E5] hover:bg-[#E5E5E5] text-[#1A1A1A] font-semibold text-sm rounded-2xl text-center transition-colors"
            >
              Submit weekly training check-in →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
