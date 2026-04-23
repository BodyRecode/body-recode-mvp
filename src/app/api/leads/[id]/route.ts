import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const { data, error } = await supabase
    .from('leads')
    .update({
      name: body.name,
      email: body.email,
      phone: body.phone,
      status: body.status,
      notes: body.notes,
      source: body.source,
      active: body.active,
      zoom_1_date: body.zoom_1_date,
      zoom_meeting_url: body.zoom_meeting_url,
      zoom2_outcome: body.zoom2_outcome,
      zoom2_pathway_type: body.zoom2_pathway_type,
      zoom2_trigger_type: body.zoom2_trigger_type,
      zoom2_completed_at: body.zoom2_completed_at,
      founder_application_status: body.founder_application_status,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const { error } = await supabase.from('leads').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
