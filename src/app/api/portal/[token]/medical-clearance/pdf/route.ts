// Renders the Medical Clearance Request Form (pre-filled with the client's
// name + email) to a real PDF using pdf-lib. Previously used puppeteer +
// @sparticuz/chromium, which was returning HTTP 500 from Vercel serverless
// (chromium binary failing to launch). pdf-lib is pure JS, fast, and never
// touches headless Chrome - so the route always returns valid PDF bytes
// instead of an empty error that browsers hand off to Adobe Acrobat.
//
// Auth model: gated by onboarding token + `medical_clearance_required`
// flag on the clients row. No session required.

import { createAdminClient } from '@/lib/supabase/admin'
import { renderMedicalClearancePdf } from '@/lib/medical-clearance-pdf'

export const runtime = 'nodejs'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('name, email, medical_clearance_required')
    .eq('onboarding_token', token)
    .single()

  if (!client || !client.medical_clearance_required) {
    return new Response('Not found', { status: 404 })
  }

  const slug = (client.name ?? 'client')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  const pdf = await renderMedicalClearancePdf({
    clientName: client.name ?? '',
    clientEmail: client.email ?? null,
  })

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="medical-clearance-${slug}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
