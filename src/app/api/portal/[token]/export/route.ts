import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'

export const runtime = 'nodejs'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorised', { status: 401 })

  const { token } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('*')
    .eq('onboarding_token', token)
    .maybeSingle()

  if (!client) return new Response('Not found', { status: 404 })
  const userEmail = (user.email ?? '').toLowerCase()
  if (userEmail !== (client.email ?? '').toLowerCase() && !isCoachEmail(userEmail)) {
    return new Response('Forbidden', { status: 403 })
  }

  // Pull all the client's data across the related tables
  const [
    { data: intakes },
    { data: baselines },
    { data: cffs },
    { data: cfws },
    { data: weeklyCheckins },
    { data: messages },
    { data: communications },
  ] = await Promise.all([
    admin.from('intakes').select('*').eq('client_id', client.id).order('created_at'),
    admin.from('baselines').select('*').eq('client_id', client.id).order('created_at'),
    admin.from('cffs').select('*').eq('client_id', client.id).order('generated_at'),
    admin.from('cfws').select('*').eq('client_id', client.id).order('week_number'),
    admin.from('weekly_checkins').select('*').eq('client_id', client.id).order('week_number'),
    admin.from('client_messages').select('*').eq('client_id', client.id).order('created_at'),
    admin.from('client_communications').select('*').eq('client_id', client.id).order('sent_at'),
  ])

  // Strip internal-only fields the client does not need to see
  const sanitisedClient = (() => {
    const { onboarding_token, baseline_token, checkin_token, coach_id, ...rest } = client
    void onboarding_token; void baseline_token; void checkin_token; void coach_id
    return rest
  })()

  const payload = {
    exported_at: new Date().toISOString(),
    note: 'This is a complete export of your data held by Body Recode. Tokens and internal references have been removed for safety.',
    client: sanitisedClient,
    intakes: intakes ?? [],
    baselines: baselines ?? [],
    foundational_synthesis: cffs ?? [],
    weekly_synthesis: cfws ?? [],
    weekly_checkins: weeklyCheckins ?? [],
    messages: messages ?? [],
    communications: communications ?? [],
  }

  const safeName = (client.name ?? 'client').toLowerCase().replace(/[^a-z0-9]+/g, '-')

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${safeName}-body-recode-data-${new Date().toISOString().slice(0, 10)}.json"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
