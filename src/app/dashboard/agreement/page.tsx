import { createAdminClient } from '@/lib/supabase/admin'
import { requireCoach } from '@/lib/api-auth'
import { redirect } from 'next/navigation'
import { CURRENT_AGREEMENT, hasAcceptedCurrent } from '@/lib/coach-agreement'
import { AgreementClient } from './agreement-client'

export const metadata = { title: 'Your agreement' }

/**
 * The coach's own agreement, read and accepted here rather than on paper.
 *
 * The client side of the platform has worked this way since the beginning: a
 * client reads their coaching agreement in their portal, types their name, and
 * the system records it. This is the same thing for the person coaching them.
 */
export default async function AgreementPage() {
  const gate = await requireCoach()
  if (!gate.ok) redirect('/login')

  const admin = createAdminClient()
  const accepted = await hasAcceptedCurrent(admin, gate.userId)

  const { data: history } = await admin
    .from('coach_agreements')
    .select('version, accepted_at, accepted_name')
    .eq('coach_id', gate.userId)
    .order('accepted_at', { ascending: false })

  return (
    <AgreementClient
      agreement={CURRENT_AGREEMENT}
      accepted={accepted}
      history={(history ?? []) as { version: string; accepted_at: string; accepted_name: string }[]}
    />
  )
}
