import { createAdminClient } from '@/lib/supabase/admin'
import AvailabilityManager from './availability-manager'

export default async function AvailabilityPage() {
  const admin = createAdminClient()

  const { data: rows } = await admin
    .from('be_availability')
    .select('*')
    .order('day_of_week', { ascending: true })

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Availability</h1>
        <p className="text-stone-400 text-sm mt-1">Set the days and times leads can book a Zoom call.</p>
      </div>
      <AvailabilityManager rows={rows ?? []} />
    </div>
  )
}
