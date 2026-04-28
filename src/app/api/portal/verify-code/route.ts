import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const { email, code } = await request.json()

  if (!email || !code) {
    return NextResponse.json({ error: 'Missing email or code' }, { status: 400 })
  }

  const cleanEmail = email.trim().toLowerCase()
  const cleanCode = code.toString().trim()

  const admin = createAdminClient()

  // Look up unused, unexpired code
  const { data: codeRow } = await admin
    .from('portal_login_codes')
    .select('id, expires_at')
    .eq('email', cleanEmail)
    .eq('code', cleanCode)
    .is('used_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!codeRow) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
  }

  if (new Date(codeRow.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Code has expired. Request a new one.' }, { status: 400 })
  }

  // Mark code as used
  await admin
    .from('portal_login_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('id', codeRow.id)

  // Generate a Supabase magic link via admin API. This creates the auth user
  // if needed and returns a token we can hand to the client to immediately
  // establish a session via verifyOtp({type: 'magiclink', token_hash}).
  // The token is fresh, has never been emailed, and cannot have been
  // pre-fetched by anyone — Gmail/Apple Mail are completely out of the loop.
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: cleanEmail,
  })

  if (linkError || !linkData?.properties?.hashed_token) {
    console.error('generateLink failed:', linkError)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }

  return NextResponse.json({
    token_hash: linkData.properties.hashed_token,
    email: cleanEmail,
  })
}
