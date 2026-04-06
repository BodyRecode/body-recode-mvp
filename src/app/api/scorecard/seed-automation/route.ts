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

  if (existing) {
    return NextResponse.json({ message: 'Already exists', id: existing.id })
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

  // Create steps
  const steps = [
    {
      workflow_id: workflow.id,
      position: 1,
      type: 'action',
      action_type: 'send_email',
      config: {
        subject: 'Your Body State result',
        body: `Hi {{first_name}},

Your Scorecard result tells you one specific thing: which state your body is currently operating in.

That state determines what works and what makes things worse. Most people apply the same approach regardless of their state. That is the reason most people stay stuck.

The next step is your Performance Check-In.

It takes 3 minutes, it is free, and it identifies what is specifically holding your body back right now based on how you are actually functioning.

Run it here: https://bodyrecode.au/performance-check-in

Kade
Body Recode`,
      },
    },
    {
      workflow_id: workflow.id,
      position: 2,
      type: 'wait',
      action_type: null,
      config: { unit: 'days', value: 2 },
    },
    {
      workflow_id: workflow.id,
      position: 3,
      type: 'action',
      action_type: 'send_email',
      config: {
        subject: 'Your Scorecard result, followed up',
        body: `Hi {{first_name}},

Following up on your Scorecard result.

The most common thing I hear after someone takes it: "That finally explains why nothing has been working."

The Scorecard identifies your state. The Performance Check-In builds on it. It asks the specific questions that show what is limiting your body right now and what to do about it.

Free and takes 3 minutes: https://bodyrecode.au/performance-check-in

If now is not the right time, no problem. The link will be there when you are ready.

Kade
Body Recode`,
      },
    },
  ]

  await supabase.from('be_workflow_steps').insert(steps)

  return NextResponse.json({ created: true, id: workflow.id })
}
