import { createAdminClient } from '@/lib/supabase/admin'
import AvailabilityManager from './availability-manager'
import BlockedTimesManager from './blocked-times-manager'

export default async function AvailabilityPage() {
  const admin = createAdminClient()

  const [{ data: rows }, { data: blockedTimes }] = await Promise.all([
    admin.from('be_availability').select('*').order('day_of_week', { ascending: true }),
    admin.from('be_blocked_times').select('*').gte('end_at', new Date().toISOString()).order('start_at', { ascending: true }),
  ])

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <div className="br-page-header sticky top-0 z-20 mb-7 pt-4 pb-3.5 border-b border-[#2A2F39] bg-[#14171D]/[0.88] backdrop-blur-md print:static print:bg-transparent">
          <h1 className="text-[20px] font-semibold text-[#FAFAF8] tracking-[-0.025em]">Availability</h1>
          <p className="text-[#8A9099] text-sm mt-1">Set the days and times leads can book a Zoom call.</p>
        </div>
        <AvailabilityManager rows={rows ?? []} />
      </div>

      <div>
        <div className="mb-4">
          <p className="text-sm font-semibold text-[#FAFAF8]">Blocked Times</p>
          <p className="text-[#8A9099] text-[12.5px] mt-1">Block out specific times so they won't appear as available to leads.</p>
        </div>
        <BlockedTimesManager rows={blockedTimes ?? []} />
      </div>
    </div>
  )
}
