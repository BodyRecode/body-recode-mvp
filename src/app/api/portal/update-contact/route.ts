import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { clientId, email, phone } = await req.json()
  if (!clientId || typeof email !== 'string') {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const trimmedEmail = email.trim().toLowerCase()
  const trimmedPhone = typeof phone === 'string' ? phone.trim() : null

  // Basic email validation
  if (!trimmedEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify the signed-in user owns this client record (against current email)
  const { data: client } = await admin
    .from('clients')
    .select('id, email')
    .eq('id', clientId)
    .maybeSingle()

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  if ((user.email ?? '').toLowerCase() !== (client.email ?? '').toLowerCase()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await admin
    .from('clients')
    .update({ email: trimmedEmail, phone: trimmedPhone || null })
    .eq('id', clientId)

  if (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
