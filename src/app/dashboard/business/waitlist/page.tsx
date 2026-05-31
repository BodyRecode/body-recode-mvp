import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/dashboard/ui'
import WaitlistView from './waitlist-view'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type WaitlistRow = {
  id: string
  email: string
  first_name: string | null
  body_state: string | null
  product: 'challenge' | 'blueprint' | 'membership'
  source: string | null
  notified_at: string | null
  created_at: string
}

export default async function WaitlistPage() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('product_waitlist')
    .select('id, email, first_name, body_state, product, source, notified_at, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="max-w-[1200px]">
        <PageHeader
          eyebrow="Business Engine"
          title="Product Waitlist"
          subtitle="Leads who signed up to be notified when each product launches."
        />
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Error loading waitlist: {error.message}
        </div>
      </div>
    )
  }

  const rows = (data ?? []) as WaitlistRow[]

  return (
    <div className="max-w-[1200px]">
      <PageHeader
        eyebrow="Business Engine"
        title="Product Waitlist"
        subtitle="Leads who signed up via the Scorecard result page to be notified when Challenge / Blueprint / Membership launch. One row per (email, product). Re-clicks are idempotent."
      />
      <WaitlistView rows={rows} />
    </div>
  )
}
