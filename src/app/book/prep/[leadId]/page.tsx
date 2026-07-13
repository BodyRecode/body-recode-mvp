import { createAdminClient } from '@/lib/supabase/admin'
import { logoUrl, brand, coach } from '@/config/tenant'
import PrepForm from './prep-form'

export const dynamic = 'force-dynamic'

export default async function PrepPage({ params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params

  let firstName = ''
  let found = false
  // UUID guard — skip the DB round-trip on obviously malformed links.
  if (/^[0-9a-f-]{20,}$/i.test(leadId)) {
    const admin = createAdminClient()
    const { data: lead } = await admin.from('leads').select('name').eq('id', leadId).maybeSingle()
    if (lead) {
      found = true
      firstName = ((lead.name as string) || '').split(' ')[0] || ''
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 text-[#1A1A1A]">
      <div className="border-b border-stone-200 px-6 py-5 flex items-center justify-between">
        <img src={logoUrl()} width="110" alt={brand().name} />
        <a href={brand().performanceDomain} className="text-sm text-stone-500 hover:text-stone-700 transition-colors">
          ← Back to website
        </a>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {found ? (
          <PrepForm leadId={leadId} firstName={firstName} />
        ) : (
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-3">This link isn&apos;t valid.</h1>
            <p className="text-stone-600 text-base">
              Please use the link from your booking confirmation email, or email{' '}
              <a href={`mailto:${coach().email}`} className="text-blue-500">{coach().email}</a>.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
