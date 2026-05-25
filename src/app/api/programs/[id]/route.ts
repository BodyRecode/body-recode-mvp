import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json()
  const { sessions } = body

  if (!sessions) {
    return NextResponse.json({ error: 'sessions required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: program } = await admin
    .from('programs')
    .select('id, status')
    .eq('id', id)
    .maybeSingle()

  if (!program) return NextResponse.json({ error: 'Program not found' }, { status: 404 })

  const { error } = await admin
    .from('programs')
    .update({ sessions })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()

  const { data: program } = await admin
    .from('programs')
    .select('id, status')
    .eq('id', id)
    .maybeSingle()

  if (!program) return NextResponse.json({ error: 'Program not found' }, { status: 404 })

  // Allow deleting any program (draft, active, or archived).
  // program_reviews cascade; training_plan.program_id is set null.
  const { error } = await admin
    .from('programs')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
