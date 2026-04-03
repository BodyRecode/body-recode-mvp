import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const { name, trigger_type, trigger_config, is_active, steps } = body

  // Update workflow
  const { data: workflow, error } = await supabase
    .from('be_workflows')
    .update({ name, trigger_type, trigger_config, is_active })
    .eq('id', id)
    .eq('coach_id', user.id)
    .select()
    .single()

  if (error || !workflow) return NextResponse.json({ error: error?.message }, { status: 500 })

  // Replace steps — delete old, insert new
  await supabase.from('be_workflow_steps').delete().eq('workflow_id', id)

  if (steps && steps.length > 0) {
    const stepRows = steps.map((s: {
      type: string; action_type?: string
      config: Record<string, unknown>; position: number
    }) => ({
      workflow_id: id,
      position: s.position,
      type: s.type,
      action_type: s.action_type ?? null,
      config: s.config ?? {},
    }))
    await supabase.from('be_workflow_steps').insert(stepRows)
  }

  return NextResponse.json(workflow)
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  await supabase.from('be_workflows').delete().eq('id', id).eq('coach_id', user.id)
  return NextResponse.json({ success: true })
}
