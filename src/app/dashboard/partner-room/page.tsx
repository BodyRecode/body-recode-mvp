import { createAdminClient } from '@/lib/supabase/admin'
import { partnerRoomUrl } from '@/lib/app-url'
import { PageHeader } from '@/components/dashboard/ui'
import PartnerRoomAdmin, { type GuestRow } from './partner-room-admin'

// Always fresh so newly minted links and visit counts show immediately.
export const dynamic = 'force-dynamic'

export default async function PartnerRoomPage() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('partner_rooms')
    .select('*')
    .order('created_at', { ascending: false })

  const guests: GuestRow[] = (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    company: r.company,
    note: r.note,
    url: partnerRoomUrl(r.token),
    created_at: r.created_at,
    first_opened_at: r.first_opened_at,
    last_seen_at: r.last_seen_at,
    visit_count: r.visit_count ?? 0,
    revoked: Boolean(r.revoked_at),
  }))

  return (
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow="Partner Room"
        title="Partner Room"
        subtitle="Hand a prospective investor or partner their own private link to the Body Recode overview. One room, one door per person — each link greets them by name, remembers their visits, and can be revoked on its own."
      />
      <PartnerRoomAdmin initialGuests={guests} />
    </div>
  )
}
