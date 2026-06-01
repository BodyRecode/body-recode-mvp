import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Return a short-lived signed URL to the original uploaded blood test file so
 * the coach can view it in the dashboard. Private bucket; the URL expires.
 * Coach-only.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; panelId: string }> }
) {
  const { id, panelId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data: panel } = await admin
    .from('blood_panels')
    .select('file_path')
    .eq('id', panelId)
    .eq('client_id', id)
    .maybeSingle()
  if (!panel) return NextResponse.json({ error: 'Blood panel not found' }, { status: 404 })

  const { data, error } = await admin.storage
    .from('blood-test-docs')
    .createSignedUrl(panel.file_path, 60 * 10) // 10 minutes
  if (error || !data) return NextResponse.json({ error: 'Could not sign file URL' }, { status: 500 })

  return NextResponse.json({ url: data.signedUrl })
}
