import { requireCoachScope } from '@/lib/coach-scope'
import { PageHeader } from '@/components/dashboard/ui'
import ImportClient from './import-client'

export const metadata = { title: 'Import clients' }

/**
 * Adding a list of clients at once.
 *
 * Built 19 September 2026 after Kade asked what a coach joining with 30
 * existing clients would do. The answer was thirty trips through a form, which
 * is the kind of first hour that ends a pilot.
 */
export default async function ImportClientsPage() {
  await requireCoachScope()
  return (
    <div className="p-6 max-w-3xl">
      <PageHeader
        title="Import clients"
        subtitle="Paste a list. You only need a name and an email; everything else comes from their intake."
      />
      <ImportClient />
    </div>
  )
}
