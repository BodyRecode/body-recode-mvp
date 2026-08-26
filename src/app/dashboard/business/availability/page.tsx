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
        <div className="br-page-header sticky top-0 z-20 mb-7 pt-4 pb-3.5 border-b border-[#E8EAEE] bg-white/[0.88] backdrop-blur-md print:static print:bg-transparent">
          <h1 className="text-[22px] font-semibold text-[#141821] tracking-[-0.025em]">Availability</h1>
          <p className="text-[#666D7A] text-sm mt-1">Set the days and times leads can book a Zoom call.</p>
        </div>
        <AvailabilityManager rows={rows ?? []} />
      </div>

      <div>
        <div className="mb-4">
          <p className="text-sm font-semibold text-[#141821]">Blocked Times</p>
          <p className="text-[#666D7A] text-[12.5px] mt-1">Block out specific times so they won't appear as available to leads.</p>
        </div>
        <BlockedTimesManager rows={blockedTimes ?? []} />
      </div>
    </div>
  )
}
