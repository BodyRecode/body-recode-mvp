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
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-white">Availability</h1>
          <p className="text-stone-400 text-sm mt-1">Set the days and times leads can book a Zoom call.</p>
        </div>
        <AvailabilityManager rows={rows ?? []} />
      </div>

      <div>
        <div className="mb-4">
          <p className="text-sm font-semibold text-white">Blocked Times</p>
          <p className="text-stone-500 text-xs mt-1">Block out specific times so they won't appear as available to leads.</p>
        </div>
        <BlockedTimesManager rows={blockedTimes ?? []} />
      </div>
    </div>
  )
}
