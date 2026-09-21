import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { renderDashboardPdf } from '@/lib/pdf'
import { isCoachEmail } from '@/lib/coach-auth'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Her progress read, as a file she can keep.
 *
 * 21 September 2026. The foundational read could be downloaded and the
 * twelve-week re-read could not, which is the wrong way round if either: the
 * re-read is the one that shows her what changed, and it is the one she is
 * most likely to want to keep or show somebody.
 *
 * She makes the file by choosing to. That is a different position entirely
 * from us pushing her health information into an inbox we can never reach
 * again, which is why the read itself is not emailed.
 *
 * Same ownership check as the foundational read: the signed-in person must be
 * this client, or a coach.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { token } = await params

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
    path: `/portal/${token}/progress-read`,
    filename: `progress-read-${token}`,
  })
}
