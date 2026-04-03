import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const type = request.nextUrl.searchParams.get('type')

  if (type === 'leads') {
    const { data } = await supabase
      .from('leads')
      .select('id, name')
      .not('status', 'in', '("closed_declined","closed_no_show")')
      .order('name')
    return NextResponse.json(data ?? [])
  }

  if (type === 'clients') {
    const { data } = await supabase
      .from('clients')
      .select('id, name')
      .order('name')
    return NextResponse.json(data ?? [])
  }

  return NextResponse.json([])
}
