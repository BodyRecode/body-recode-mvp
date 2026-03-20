import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json()

  const { data, error } = await supabase
    .from('leads')
    .insert({
      coach_id: user.id,
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      source: body.source || 'direct',
      source_detail: body.source_detail || null,
      notes: body.notes || null,
      status: 'new_check_in',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
