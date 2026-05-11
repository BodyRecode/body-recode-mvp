import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import ClientHeader from '@/components/client-header'
import ProgramReadingInline from '@/components/program-reading-inline'
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
  hold: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  rebuild: 'text-red-400 bg-red-400/10 border-red-400/30',
  deload: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
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
    .select('id, block_name, progression_phase, training_goal, training_frequency, week_duration, sessions, weekly_pattern_summary, progression_notes, client_note, current_direction, last_review_at, pr_why_this_block, pr_what_this_program_is_doing, pr_how_well_know_its_working, pr_what_were_not_doing_yet, pr_coach_note, program_reading_published_at')
    .eq('client_id', client.id)
    .eq('is_active', true)
    .maybeSingle()

  const programReadingPublished = !!program?.program_reading_published_at

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <ClientHeader />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <Link href={`/portal/${token}`} className="text-[#57534e] hover:text-[#d4cfc9] text-sm transition-colors">← Back</Link>
          <h1 className="text-2xl font-bold text-white mt-4 mb-1">Your Program</h1>
          <p className="text-[#a8a29e] text-sm">Your current training block.</p>
        </div>

        {!program ? (
          <div className="rounded-2xl border border-[#1c1917] bg-[#111110] p-6 text-center">
            <p className="text-[#57534e] text-sm">No active training program yet. Your coach will set this up for you.</p>
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

            {/* Legacy client_note - shown only when no Program Reading has been published yet */}
            {!programReadingPublished && program.client_note && (
              <div className="bg-[#14b8a6]/5 border border-[#14b8a6]/20 rounded-2xl px-5 py-4">
                <p className="text-xs font-bold text-[#14b8a6] uppercase tracking-widest mb-2">About this block</p>
                <p className="text-sm text-[#d4cfc9] leading-relaxed">{program.client_note}</p>
              </div>
            )}

            {/* Block overview */}
            <div className="bg-[#111110] border border-[#1c1917] rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-lg font-bold text-white">{program.block_name}</p>
                  <p className="text-xs text-[#57534e] mt-0.5">{program.progression_phase} · {program.training_goal}</p>
                </div>
                {program.current_direction && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize shrink-0 ${directionColour[program.current_direction] || 'text-[#a8a29e] bg-[#1c1917] border-[#1c1917]'}`}>
                    {directionLabel[program.current_direction] ?? program.current_direction}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#1c1917]/60 rounded-xl px-3 py-2.5">
                  <p className="text-xs text-[#57534e] mb-0.5">Sessions / week</p>
                  <p className="text-sm font-semibold text-white">{program.training_frequency}x</p>
                </div>
                <div className="bg-[#1c1917]/60 rounded-xl px-3 py-2.5">
                  <p className="text-xs text-[#57534e] mb-0.5">Block length</p>
                  <p className="text-sm font-semibold text-white">{program.week_duration} weeks</p>
                </div>
              </div>
            </div>

            {/* Sessions */}
            {Array.isArray(program.sessions) && program.sessions.length > 0 && (
              <div className="space-y-4">
                <p className="text-xs font-bold text-[#57534e] uppercase tracking-widest">Sessions</p>
                {(program.sessions as Session[]).map((session, si) => (
                  <div key={si} className="bg-[#111110] border border-[#1c1917] rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-[#1c1917]">
                      <p className="text-sm font-bold text-white">{session.day_label}</p>
                      <p className="text-xs text-[#57534e] mt-0.5">{session.skeleton}</p>
                    </div>

                    {/* Movement prep */}
                    {session.movement_prep && session.movement_prep.length > 0 && (
                      <div className="px-5 py-3 border-b border-[#1c1917]/60">
                        <p className="text-xs font-semibold text-[#3c3835] uppercase tracking-wider mb-2">Movement Preparation</p>
                        <ul className="space-y-1">
                          {session.movement_prep.map((item, i) => (
                            <li key={i} className="text-xs text-[#a8a29e] flex gap-2">
                              <span className="text-[#3c3835] shrink-0">·</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Blocks */}
                    {session.blocks.map((block, bi) => (
                      <div key={bi} className="px-5 py-3 border-b border-[#1c1917]/40 last:border-0">
                        <p className="text-xs font-bold text-[#14b8a6] uppercase tracking-widest mb-2">{block.block_label}</p>
                        <div className="space-y-3">
                          {block.exercises.map((ex, ei) => (
                            <div key={ei} className="flex flex-col gap-1">
                              <p className="text-sm font-semibold text-white">{ex.exercise_name}</p>
                              <div className="flex flex-wrap gap-2">
                                <span className="text-xs bg-[#1c1917] text-[#d4cfc9] px-2 py-0.5 rounded-lg">{ex.sets} × {ex.reps}</span>
                                {ex.rpe && <span className="text-xs bg-[#1c1917] text-[#a8a29e] px-2 py-0.5 rounded-lg">RPE {ex.rpe}</span>}
                                {ex.rest && <span className="text-xs bg-[#1c1917] text-[#a8a29e] px-2 py-0.5 rounded-lg">{ex.rest} rest</span>}
                              </div>
                              {ex.notes && <p className="text-xs text-[#57534e] leading-relaxed">{ex.notes}</p>}
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
              className="block w-full py-3.5 bg-[#14b8a6] hover:bg-[#5eead4] text-black font-bold text-sm rounded-2xl text-center transition-colors mb-2"
            >
              Log a session →
            </Link>

            <Link
              href={`/portal/${token}/training`}
              className="block w-full py-3.5 bg-[#1c1917] hover:bg-[#1c1917] text-white font-semibold text-sm rounded-2xl text-center transition-colors"
            >
              Submit weekly training check-in →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
