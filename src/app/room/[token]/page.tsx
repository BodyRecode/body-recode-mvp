import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import RoomClient from './room-client'
import RoomClosed from './room-closed'

// Never index a private partner link, and always render fresh so visit stamps land.
export const metadata: Metadata = {
  title: 'Body Recode',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

export default async function PartnerRoomPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: room } = await admin
    .from('partner_rooms')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  if (!room) return notFound()

  const now = new Date()
  const isExpired = room.expires_at ? new Date(room.expires_at) < now : false
  if (room.revoked_at || isExpired) {
    return <RoomClosed name={room.name} />
  }

  // Stamp the visit so Kade can see engagement. Best-effort — a failed stamp
  // should never block the guest from seeing their room.
  try {
    await admin
      .from('partner_rooms')
      .update({
        last_seen_at: now.toISOString(),
        first_opened_at: room.first_opened_at ?? now.toISOString(),
        visit_count: (room.visit_count ?? 0) + 1,
      })
      .eq('id', room.id)
  } catch {
    /* non-fatal */
  }

  const firstName = (room.name ?? '').trim().split(/\s+/)[0] || 'there'
  const returning = Boolean(room.first_opened_at)

  return <RoomClient firstName={firstName} returning={returning} />
}
