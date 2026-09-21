import { createAdminClient } from '@/lib/supabase/admin'
import { requireCoachScope, assertOwnsClient } from '@/lib/coach-scope'
import { productTierForScope } from '@/lib/coach-tier'
import { tierAllows } from '@/lib/product-tier'
import CopilotBubble from './copilot-bubble'

/**
 * Client-scoped layout. Renders the Coach Co-Pilot bubble once here so it
 * appears on EVERY page under /dashboard/clients/[id]/* (profile, plan, program,
 * nutrition, suggest, bloods, etc.), always scoped to this client — rather than
 * only on the profile page. (2026-07-12.)
 */
export default async function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // THE ownership check for every page under /dashboard/clients/[id]. One gate
  // here covers the profile, plan, program, nutrition, bloods, readings and
  // everything added later, the same way the product tier gate covers every
  // dashboard page. A coach who is not the owner and does not own this client
  // gets the not-found page, so identifiers cannot be probed.
  const scope = await requireCoachScope()
  await assertOwnsClient(id, scope)

  const admin = createAdminClient()

  // Only the light client-name lookup runs on every client sub-page now. The
  // co-pilot history (up to 200 messages) is loaded lazily by the bubble when
  // the coach actually opens it — it used to load on every page whether or not
  // the chat was ever opened, taxing every navigation.
  const { data: client } = await admin.from('clients').select('name').eq('id', id).maybeSingle()

  // Whether this coach gets the free-form co-pilot at all. See the note below.
  const canChat = tierAllows(await productTierForScope(admin, scope), 'coach')

  return (
    <>
      {children}
      {/* The open co-pilot is for the coaching product. A read-only coach gets
          "Explain this read" on the read itself instead: the question they
          actually have, at the moment they have it, rather than a blank box
          that asks them to know what to ask. Kade's decision, 21 Sep 2026. */}
      {client && canChat && (
        <CopilotBubble
          clientId={id}
          clientFirstName={client.name?.split(' ')[0] ?? 'this client'}
        />
      )}
    </>
  )
}
