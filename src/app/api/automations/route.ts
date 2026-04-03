import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json()
  const { name, trigger_type, trigger_config, is_active, steps } = body

  if (!name || !trigger_type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Create workflow
  const { data: workflow, error: workflowError } = await supabase
    .from('be_workflows')
    .insert({ coach_id: user.id, name, trigger_type, trigger_config: trigger_config ?? {}, is_active: is_active ?? true })
    .select()
    .single()

  if (workflowError || !workflow) {
    return NextResponse.json({ error: workflowError?.message }, { status: 500 })
  }

  // Create steps
  if (steps && steps.length > 0) {
    const stepRows = steps.map((s: {
      type: string; action_type?: string
      config: Record<string, unknown>; position: number
    }) => ({
      workflow_id: workflow.id,
      position: s.position,
      type: s.type,
      action_type: s.action_type ?? null,
      config: s.config ?? {},
    }))
    await supabase.from('be_workflow_steps').insert(stepRows)
  }

  return NextResponse.json(workflow)
}
