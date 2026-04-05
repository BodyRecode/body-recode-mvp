import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://performance.bodyrecode.au',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'founder_spots_remaining')
    .single()

  if (error || !data) {
    return NextResponse.json({ spots: 20 }, { headers: CORS_HEADERS })
  }

  return NextResponse.json({ spots: parseInt(data.value, 10) }, { headers: CORS_HEADERS })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { spots } = await request.json()
  if (typeof spots !== 'number' || spots < 0) {
    return NextResponse.json({ error: 'Invalid value' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('settings')
    .update({ value: String(spots) })
    .eq('key', 'founder_spots_remaining')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ spots })
}
