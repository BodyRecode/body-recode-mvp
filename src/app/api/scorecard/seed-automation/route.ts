import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { brand } from "@/config/tenant";

// POST /api/scorecard/seed-automation
// Creates the scorecard follow-up email automation if it doesn't already exist

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  // Check if already exists. Match by both old (em-dash) and new (hyphen) names so an
  // existing workflow gets updated in place rather than orphaned alongside a duplicate.
  const { data: existing } = await supabase
    .from('be_workflows')
    .select('id, name')
    .eq('coach_id', user.id)
    .in('name', ['Scorecard - Follow-up Sequence', 'Scorecard — Follow-up Sequence'])
    .maybeSingle()

  const steps = [
    {
      position: 1,
      type: 'action',
      action_type: 'send_email',
      config: {
        subject: 'Why your body has stopped responding, {{first_name}}',
        body: `Hi {{first_name}},

You just took the scorecard. Result: {{scorecard_score}}/15. Body state: {{scorecard_state}}.

That number is the starting point, not the answer. It tells you which of three states your body is currently in. It does not tell you why fat loss has stalled, what specifically is making things worse, or what to fix first.

The Body Decode Report does.

It is a written breakdown of the specific physiology behind your {{scorecard_state}} score, the fat-storage pattern your body is locked in, what is quietly making it worse, and the exact order to unstick it. Written specifically to your result. Not a generic guide.

$37. Delivered in 5 minutes. Yours to keep.

Get your report: ${brand().marketingDomain}/get-report

If you would rather talk it through first, you can book a free 15-minute strategy call: https://bodyrecode.au/book

Kade
Body Recode`,
      },
    },
    {
      position: 2,
      type: 'wait',
      action_type: null,
      config: { unit: 'days', amount: '2' },
    },
    {
      position: 3,
      type: 'action',
      action_type: 'send_email',
      config: {
        subject: 'What your {{scorecard_state}} result actually means',
        body: `Hi {{first_name}},

Your score was {{scorecard_score}}/15. Body state: {{scorecard_state}}.

Most people in your situation think they need to train harder or eat less. That is usually the wrong call.

When a body has stopped responding to effort, the issue is rarely the effort itself. It is the prescription. Pushing harder against a body that is already resisting is what got it stuck in the first place.

The Body Decode Report walks through what {{scorecard_state}} actually means for your training, your nutrition, your recovery, and most importantly, why fat loss has stalled. It is written to your specific result. It tells you what to stop immediately, and the order to fix what is left.

$37. Delivered in 5 minutes.

Get your report: ${brand().marketingDomain}/get-report

Kade
Body Recode`,
      },
    },
    {
      position: 4,
      type: 'wait',
      action_type: null,
      config: { unit: 'days', amount: '2' },
    },
    {
      position: 5,
      type: 'action',
      action_type: 'send_email',
      config: {
        subject: 'Re: your scorecard',
        body: `Hi {{first_name}},

Following up on your scorecard.

The most common thing I hear after someone takes it: "That finally explains why nothing has been working."

Knowing your state is the first piece. Knowing what to do about it is the second. That is what the call is for.

15 minutes. Free. No pitch. We go through your scorecard together, identify the specific bottleneck, and map out what to do first.

Book here: ${brand().marketingDomain}/book

If you would rather have the breakdown in writing first, the report is at https://bodyrecode.au/get-report.

Kade
Body Recode`,
      },
    },
    {
      position: 6,
      type: 'wait',
      action_type: null,
      config: { unit: 'days', amount: '4' },
    },
    {
      position: 7,
      type: 'action',
      action_type: 'send_email',
      config: {
        subject: 'The prescription problem',
        body: `Hi {{first_name}},

Most coaching programs give everyone the same plan. Same training, same nutrition, same timeline. Your body state does not factor in at all.

Your scorecard came back as {{scorecard_state}}. That is a specific biological pattern, not a label. It tells me how your body is handling load, how well it is recovering, and how much capacity it has to respond right now.

A program built for a Ready state will make a Depleted state worse. That is not a motivation problem. It is a prescription problem.

The fastest way to address it is the call. 15 minutes, free, no pitch. We map out what your specific state needs first, and what to stop immediately.

Book here: ${brand().marketingDomain}/book

Kade
Body Recode`,
      },
    },
    {
      position: 8,
      type: 'wait',
      action_type: null,
      config: { unit: 'days', amount: '5' },
    },
    {
      position: 9,
      type: 'action',
      action_type: 'send_email',
      config: {
        subject: 'Last one from me, {{first_name}}',
        body: `Hi {{first_name}},

Last email from me on this.

Your scorecard result is still there whenever you want to act on it. Two doors based on your {{scorecard_state}} score:

1. Body Decode Report ($37). Written breakdown of your result, the fat pattern you are locked in, and the order to fix it. Best if you want to act on it yourself.

2. Free 15-minute call. Best if you would rather talk it through first.

Get the report: ${brand().marketingDomain}/get-report
Book the call: https://bodyrecode.au/book

No follow-up after this.

Kade
Body Recode`,
      },
    },
  ]

  if (existing) {
    // Update existing steps to latest copy. Also rename if it's still on the old em-dash name.
    if (existing.name !== 'Scorecard - Follow-up Sequence') {
      await supabase.from('be_workflows').update({ name: 'Scorecard - Follow-up Sequence' }).eq('id', existing.id)
    }
    await supabase.from('be_workflow_steps').delete().eq('workflow_id', existing.id)
    await supabase.from('be_workflow_steps').insert(steps.map(s => ({ ...s, workflow_id: existing.id })))
    return NextResponse.json({ updated: true, id: existing.id })
  }

  // Create workflow
  const { data: workflow, error } = await supabase
    .from('be_workflows')
    .insert({
      coach_id: user.id,
      name: 'Scorecard - Follow-up Sequence',
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
