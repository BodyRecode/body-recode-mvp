import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/scorecard/seed-automation
// Creates the scorecard follow-up email automation if it doesn't already exist

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  // Check if already exists
  const { data: existing } = await supabase
    .from('be_workflows')
    .select('id')
    .eq('coach_id', user.id)
    .eq('name', 'Scorecard — Follow-up Sequence')
    .maybeSingle()

  const steps = [
    {
      position: 1,
      type: 'action',
      action_type: 'send_email',
      config: {
        subject: 'Your Body State result',
        body: `Hi {{first_name}},

Your scorecard result tells you one specific thing: which state your body is currently in.

That state determines what works. It also determines what makes things worse. Most people apply the same approach regardless of their state. That is why most people stay stuck.

If you want to understand exactly what is driving your result and what needs to change first, book a free 30-minute call.

We go through your scorecard together, identify the specific bottleneck, and map out the first steps.

Book here: https://bodyrecode.au/book

Kade
Body Recode`,
      },
    },
    {
      position: 2,
      type: 'wait',
      action_type: null,
      config: { unit: 'days', value: 3 },
    },
    {
      position: 3,
      type: 'action',
      action_type: 'send_email',
      config: {
        subject: 'Re: your Body State Scorecard',
        body: `Hi {{first_name}},

Following up on your scorecard.

The most common thing I hear after someone takes it: "That finally explains why nothing has been working."

Knowing your state is the first piece. The second is knowing exactly what to do about it. That is what the call is for.

30 minutes. Free. No pitch.

Book here: https://bodyrecode.au/book

If the timing is not right, no problem. The link will be there when you are ready.

Kade
Body Recode`,
      },
    },
  ]

  if (existing) {
    // Update existing steps to latest copy
    await supabase.from('be_workflow_steps').delete().eq('workflow_id', existing.id)
    await supabase.from('be_workflow_steps').insert(steps.map(s => ({ ...s, workflow_id: existing.id })))
    return NextResponse.json({ updated: true, id: existing.id })
  }

  // Create workflow
  const { data: workflow, error } = await supabase
    .from('be_workflows')
    .insert({
      coach_id: user.id,
      name: 'Scorecard — Follow-up Sequence',
      trigger_type: 'form_submitted',
      trigger_config: { form: 'scorecard' },
      is_active: true,
    })
    .select()
    .single()

  if (error || !workflow) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }

  await supabase.from('be_workflow_steps').insert(steps.map(s => ({ ...s, workflow_id: workflow.id })))

  return NextResponse.json({ created: true, id: workflow.id })
}
