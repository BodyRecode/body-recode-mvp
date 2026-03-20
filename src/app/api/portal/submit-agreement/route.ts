import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { clientId, fullName } = await req.json()
  if (!clientId || !fullName) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('clients')
    .update({
      agreement_accepted_at: new Date().toISOString(),
      agreement_accepted_name: fullName,
    })
    .eq('id', clientId)

  if (error) return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  return NextResponse.json({ success: true })
}
