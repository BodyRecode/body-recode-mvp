import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data, error } = await supabase
    .from('be_ad_campaigns')
    .select('*')
    .eq('coach_id', user.id)
    .order('date_from', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json()
  const { platform, name, spend, leads_count, date_from, date_to } = body

  if (!platform || !name) {
    return NextResponse.json({ error: 'platform and name are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('be_ad_campaigns')
    .insert({
      coach_id: user.id,
      platform,
      name,
      spend: spend ?? 0,
      leads_count: leads_count ?? 0,
      date_from: date_from || null,
      date_to: date_to || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
