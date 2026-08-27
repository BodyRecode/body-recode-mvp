import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import TrajectoryReadingLayout from '@/components/trajectory-reading-layout'
import { isCoachEmail } from '@/lib/coach-auth'

/**
 * Standalone client view of the Block-end Trajectory Reading.
 *
 * Editorial document, same DNA as the Foundational and Program Readings. The
 * portal program page links here via the "View as document" button on the
 * Block-End Reading card. Auth-gated to the client whose token is in the URL.
 */
export default async function PortalTrajectoryReadingPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name, email')
    .eq('onboarding_token', token)
    .single()

  if (!client) notFound()

  const userEmail = (user.email ?? '').toLowerCase()
  if (userEmail !== (client.email ?? '').toLowerCase() && !isCoachEmail(userEmail)) {
    redirect(`/portal/${token}`)
  }

  const { data: program } = await admin
    .from('programs')
    .select('id, block_name, progression_phase, training_goal, tr_where_this_block_started, tr_how_your_signal_moved, tr_what_held_steady, tr_what_this_sets_up_next, tr_coach_note, trajectory_reading_generated_at, trajectory_reading_published_at, tr_new_body_state, tr_previous_body_state, tr_state_direction, tr_state_rationale, tr_pattern_confidence_note')
    .eq('client_id', client.id)
    .eq('is_active', true)
    .not('trajectory_reading_published_at', 'is', null)
    .maybeSingle()

  if (!program) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] text-[#141821] flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md bg-[#FFFFFF] border border-[#E8EAEE] rounded-2xl p-8 text-center">
          <p className="text-[#141821] text-lg font-semibold mb-2">Block-end reading not yet available</p>
          <p className="text-[#666D7A] text-sm mb-6">
            Your block-end reading will appear here once your coach has finalised the current block.
          </p>
          <Link
            href={`/portal/${token}/program`}
            className="inline-flex items-center gap-1.5 text-[12px] text-[#1B6DFC] hover:text-[#5390FF] transition-colors"
          >
            <ChevronLeft size={13} /> Back to your program
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Lightweight back affordance - the editorial reading layout owns the rest */}
      <div className="no-print" style={{ position: 'fixed', top: 16, left: 16, zIndex: 50 }}>
        <Link
          href={`/portal/${token}/program`}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg bg-[#FFFFFF]/80 backdrop-blur border border-[#E8EAEE] text-[#43474F] hover:text-[#1B6DFC] hover:border-[#1B6DFC] hover:bg-[#EFF5FE] transition-colors"
        >
          <ChevronLeft size={13} /> Back to program
        </Link>
      </div>

      <TrajectoryReadingLayout
        reading={{
          tr_where_this_block_started: program.tr_where_this_block_started,
          tr_how_your_signal_moved: program.tr_how_your_signal_moved,
          tr_what_held_steady: program.tr_what_held_steady,
          tr_what_this_sets_up_next: program.tr_what_this_sets_up_next,
          tr_coach_note: program.tr_coach_note,
          block_name: program.block_name,
          progression_phase: program.progression_phase,
          training_goal: program.training_goal,
          generated_at: program.trajectory_reading_generated_at!,
          trajectory_reading_published_at: program.trajectory_reading_published_at,
          tr_new_body_state: program.tr_new_body_state,
          tr_previous_body_state: program.tr_previous_body_state,
          tr_state_direction: program.tr_state_direction,
          tr_state_rationale: program.tr_state_rationale,
          tr_pattern_confidence_note: program.tr_pattern_confidence_note,
        }}
        client={{ name: client.name }}
      />
    </>
  )
}
