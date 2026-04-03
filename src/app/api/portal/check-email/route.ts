import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle()

  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ ok: true })
}
