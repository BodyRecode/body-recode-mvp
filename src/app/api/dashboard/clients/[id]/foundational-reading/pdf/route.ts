import { createClient } from '@/lib/supabase/server'
import { renderDashboardPdf } from '@/lib/pdf'
import { createPdfAccessToken, PDF_TOKEN_PARAM } from '@/lib/pdf-access-token'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Two ways in. A signed-in coach, as before. Or a server-side caller holding
  // CRON_SECRET, added 2026-08-01 so automations and scripts can attach the REAL
  // branded reading instead of hand-building an imitation of it. Bearer header
  // only, never a query parameter: a token in a URL ends up in logs, referrers
  // and browser history.
  const auth = _req.headers.get('authorization') ?? ''
  const internal = !!process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`

  if (!internal) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })
  }

  const { id } = await params

  // An internal caller has no session cookies to forward, so the headless
  // browser would load the preview page as a stranger and render /login. Hand
  // it a short-lived signed token scoped to this exact path instead.
  const previewPath = `/dashboard/clients/${id}/foundational-reading-preview`
  const path = internal
    ? `${previewPath}?${PDF_TOKEN_PARAM}=${createPdfAccessToken(previewPath)}`
    : previewPath

  return await renderDashboardPdf({
    path,
    filename: `foundational-reading-${id}`,
  })
}
