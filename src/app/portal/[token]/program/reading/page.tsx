import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import ProgramReadingLayout from '@/components/program-reading-layout'

/**
 * Standalone client view of the Program Reading.
 *
 * Cream-on-black premium document, same DNA as the Foundational Reading. The
 * portal program page links here via the "View as document" button. Auth-gated
 * to the client whose token is in the URL.
 */
export default async function PortalProgramReadingPage({
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
  if (userEmail !== (client.email ?? '').toLowerCase()) {
    redirect(`/portal/${token}`)
  }

  const { data: program } = await admin
    .from('programs')
    .select('id, block_name, progression_phase, training_goal, pr_why_this_block, pr_what_this_program_is_doing, pr_how_well_know_its_working, pr_what_were_not_doing_yet, pr_coach_note, program_reading_generated_at, program_reading_published_at')
    .eq('client_id', client.id)
    .eq('is_active', true)
    .not('program_reading_published_at', 'is', null)
    .maybeSingle()

  if (!program) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1A] flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl p-8 text-center">
          <p className="text-[#1A1A1A] text-lg font-semibold mb-2">Program Reading not yet available</p>
          <p className="text-[#6B6B6B] text-sm mb-6">
            Your Program Reading will appear here once your coach has finalised the current block.
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
      {/* Lightweight back affordance - the cream-on-black layout owns the rest */}
      <div className="no-print" style={{ position: 'fixed', top: 16, left: 16, zIndex: 50 }}>
        <Link
          href={`/portal/${token}/program`}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg bg-[#FFFFFF]/80 backdrop-blur border border-[#E5E5E5] text-[#3A3A3A] hover:text-[#1B6DFC] hover:border-[#1B6DFC] hover:bg-blue-50 transition-colors"
        >
          <ChevronLeft size={13} /> Back to program
        </Link>
      </div>

      <ProgramReadingLayout
        reading={{
          pr_why_this_block: program.pr_why_this_block,
          pr_what_this_program_is_doing: program.pr_what_this_program_is_doing,
          pr_how_well_know_its_working: program.pr_how_well_know_its_working,
          pr_what_were_not_doing_yet: program.pr_what_were_not_doing_yet,
          pr_coach_note: program.pr_coach_note,
          block_name: program.block_name,
          progression_phase: program.progression_phase,
          training_goal: program.training_goal,
          generated_at: program.program_reading_generated_at!,
          program_reading_published_at: program.program_reading_published_at,
        }}
        client={{ name: client.name }}
      />
    </>
  )
}
