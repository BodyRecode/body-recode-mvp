// Renders the Medical Clearance Request Form (one page, pre-filled with the
// client's name) to a real PDF using the shared puppeteer helper. Replaces
// the previous "open the print page in a tab, hit Print → Save as PDF" UX
// with a single click that returns a .pdf attachment a GP can print straight
// from email or upload to their EMR.
//
// Auth model matches the print page itself: gated by onboarding token +
// `medical_clearance_required` flag on the clients row. No session required,
// so a client can save the form on any device without re-authing.

import { createAdminClient } from '@/lib/supabase/admin'
import { renderDashboardPdf } from '@/lib/pdf'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('id, name, medical_clearance_required')
    .eq('onboarding_token', token)
    .single()

  if (!client || !client.medical_clearance_required) {
    return new Response('Not found', { status: 404 })
  }

  // Slug the client's name into the filename so it shows up correctly in the
  // GP's downloads folder and the EMR upload dialog.
  const slug = (client.name ?? 'client')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return await renderDashboardPdf({
    path: `/portal/${token}/medical-clearance/print`,
    filename: `medical-clearance-${slug}`,
  })
}
