import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()

  await admin
    .from('clients')
    .update({
      medical_clearance_required: false,
      medical_clearance_received_at: null,
      medical_clearance_submitted_at: null,
      medical_clearance_doc_url: null,
    })
    .eq('id', id)

  return NextResponse.json({ success: true })
}
