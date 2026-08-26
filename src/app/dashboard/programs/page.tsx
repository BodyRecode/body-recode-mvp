import { createAdminClient } from '@/lib/supabase/admin'
import { Dumbbell } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/ui'
import { getCoachingPackage } from '@/lib/coaching-packages'
import { getWeekNumber } from '@/lib/weekly-checkin-questions'
import ProgramsGrid, { type ProgramCard } from './programs-grid'

export const dynamic = 'force-dynamic'

interface ClientRow {
  id: string
  name: string
  package: string | null
  coaching_started_at: string | null
  programs: {
    id: string
    block_name: string
    progression_phase: string
    training_goal: string
    week_duration: number
    is_active: boolean
    status: string
    current_direction: 'progress' | 'hold' | 'rebuild' | 'deload' | null
    last_review_at: string | null
    generated_at: string
  }[] | null
}

export default async function DashboardProgramsPage() {
  const supabase = createAdminClient()

  const { data: clients } = await supabase
    .from('clients')
    .select(`
      id,
      name,
      package,
      coaching_started_at,
      programs (
        id,
        block_name,
        progression_phase,
        training_goal,
        week_duration,
        is_active,
        status,
        current_direction,
        last_review_at,
        generated_at
      )
    `)
    .eq('active', true)
    .order('name', { ascending: true })

  const items: ProgramCard[] = ((clients as ClientRow[] | null) || []).map(c => {
    const pkg = getCoachingPackage(c.package)
    const activeProgram = (c.programs || []).find(p => p.is_active && p.status === 'active')

    const card: ProgramCard = {
      client_id: c.id,
      client_name: c.name,
      package_format: pkg?.format ?? 'unknown',
      package_label: pkg?.label ?? 'Unknown',
      sessions_per_week: pkg?.sessionsPerWeek ?? 0,
      has_program: !!activeProgram,
    }

    if (activeProgram) {
      const week = c.coaching_started_at ? getWeekNumber(c.coaching_started_at) : null
      card.program_id = activeProgram.id
      card.block_name = activeProgram.block_name
      card.progression_phase = activeProgram.progression_phase
      card.training_goal = activeProgram.training_goal
      card.week_duration = activeProgram.week_duration
      card.current_week = week != null && week > 0 ? week : null
      card.current_direction = activeProgram.current_direction
      card.last_review_at = activeProgram.last_review_at
      card.generated_at = activeProgram.generated_at
    }

    return card
  })

  // Sort: in-person first (most likely to be on the floor today), then by name
  items.sort((a, b) => {
    const aRank = a.package_format === 'in_person' ? 0 : a.package_format === 'online' ? 1 : 2
    const bRank = b.package_format === 'in_person' ? 0 : b.package_format === 'online' ? 1 : 2
    if (aRank !== bRank) return aRank - bRank
    return a.client_name.localeCompare(b.client_name)
  })

  const total = items.length
  const withProgram = items.filter(i => i.has_program).length
  const inPerson = items.filter(i => i.package_format === 'in_person').length

  return (
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow="On the Floor"
        title="Programs"
        subtitle={
          total === 0
            ? 'No active clients yet.'
            : `${withProgram} of ${total} active clients have a current program · ${inPerson} face-to-face`
        }
        accent="teal"
      />

      {total === 0 ? (
        <div className="border border-dashed border-[#E8EAEE] rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full border border-[#E8EAEE] bg-[#FFFFFF] flex items-center justify-center mx-auto mb-4">
            <Dumbbell size={18} className="text-[#98A0AD]" />
          </div>
          <p className="text-[14px] text-[#666D7A] mb-1">No active clients.</p>
          <p className="text-[12px] text-[#98A0AD]">
            Programs appear here once a client is marked active and has a generated training block.
          </p>
        </div>
      ) : (
        <ProgramsGrid items={items} />
      )}
    </div>
  )
}
