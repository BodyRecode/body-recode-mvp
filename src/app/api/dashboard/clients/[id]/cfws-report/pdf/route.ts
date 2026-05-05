import { createClient } from '@/lib/supabase/server'
import { renderDashboardPdf } from '@/lib/pdf'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { id } = await params

  return await renderDashboardPdf({
    path: `/dashboard/clients/${id}/cfws-report`,
    filename: `cfws-report-${id}`,
  })
}
