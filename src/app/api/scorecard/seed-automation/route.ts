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
        subject: 'Your Body State Scorecard result',
        body: `Hi {{first_name}},

Thanks for completing the Body State Scorecard.

Your result tells you which state your body is currently operating in — and more importantly, why your training and fat loss may not be responding the way you expect.

The next step is your Performance Check-In.

It takes 3 minutes, it is free, and it gives you a full picture of what your body actually needs right now.

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
        subject: 'Did you run your Check-In?',
        body: `Hi {{first_name}},

Just following up on your Scorecard result.

A lot of people find that seeing their body state in black and white is the moment things start to make sense. But the scorecard is just the starting point.

The Performance Check-In is where you find out exactly what is holding your body back — and what to do about it.

It is free and takes 3 minutes: https://bodyrecode.au/performance-check-in

Kade
Body Recode`,
      },
    },
  ]

  await supabase.from('be_workflow_steps').insert(steps)

  return NextResponse.json({ created: true, id: workflow.id })
}
