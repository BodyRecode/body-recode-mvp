import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json()

  if (!body.name || body.price === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('be_products')
    .insert({
      coach_id: user.id,
      name: body.name,
      price: body.price,
      type: body.type ?? 'one_time',
      billing_interval: body.billing_interval ?? null,
      description: body.description ?? null,
      is_active: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
