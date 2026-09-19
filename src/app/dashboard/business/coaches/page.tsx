import { requireCoachScope } from '@/lib/coach-scope'
import { PageHeader } from '@/components/dashboard/ui'
import CoachesClient from './coaches-client'

export const metadata = { title: 'Coaches' }

/**
 * Inviting a coach onto the platform.
 *
 * Before this (19 September 2026) the only way was to sign in, open the
 * provisioning form and type someone else's password for them, which meant no
 * coach ever set their own and it did not survive past a handful of people.
 */
export default async function CoachesPage() {
  await requireCoachScope()
  return (
    <div className="p-6 max-w-4xl">
      <PageHeader
        title="Coaches"
        subtitle="Invite a coach onto the platform. They set their own password and see only their own clients."
      />
      <CoachesClient />
    </div>
  )
}
