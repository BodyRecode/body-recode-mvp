import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { renderDashboardPdf } from '@/lib/pdf'
import { isCoachEmail } from '@/lib/coach-auth'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { token } = await params

  // Verify the signed-in user owns this portal token before generating
  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('id, email')
    .eq('onboarding_token', token)
    .single()

  if (!client) return new Response('Not found', { status: 404 })
  const userEmail = (user.email ?? '').toLowerCase()
  if (userEmail !== (client.email ?? '').toLowerCase() && !isCoachEmail(userEmail)) {
    return new Response('Forbidden', { status: 403 })
  }

  return await renderDashboardPdf({
    path: `/portal/${token}/foundational-reading`,
    filename: `foundational-reading-${token}`,
  })
}
