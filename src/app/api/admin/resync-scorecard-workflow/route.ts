import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/admin/resync-scorecard-workflow
// Uses the admin client (bypasses RLS) to upsert the scorecard follow-up workflow.
// Safe to call any time — always replaces steps with the latest copy.

const WORKFLOW_NAME = 'Scorecard — Follow-up Sequence'

const STEPS = [
  {
    position: 1, type: 'action', action_type: 'send_email',
    config: {
      subject: 'Your Body State result',
      body: `Hi {{first_name}},

Your scorecard result: {{scorecard_score}}/15. Body state: {{scorecard_state}}.

That result tells you one specific thing: which state your body is currently in.

That state determines what works. It also determines what makes things worse. Most people apply the same approach regardless of their state. That is why most people stay stuck.

If you want to understand exactly what is driving your result and what needs to change first, book a free 30-minute call. We go through your scorecard together, identify the specific bottleneck, and map out the first steps.

Book here: https://bodyrecode.au/book

---

Want the written breakdown first? The Body Decode Report ($37) covers what your {{scorecard_state}} result means biologically, what is actively working against you right now, and what needs to change first.

Get your report here: https://bodyrecode.au/get-report

Kade
Body Recode`,
    },
  },
  { position: 2, type: 'wait', action_type: null, config: { unit: 'days', amount: '2' } },
  {
    position: 3, type: 'action', action_type: 'send_email',
    config: {
      subject: 'What your {{scorecard_state}} result actually means',
      body: `Hi {{first_name}},

Your score was {{scorecard_score}}/15. Body state: {{scorecard_state}}.

Most people look at that result and think they need to train harder or eat less. That is usually the wrong call.

Your body state is a biological signal. It tells you how your body is currently handling load, how well it is recovering, and how much capacity it has to respond right now. The right prescription depends entirely on that state.

The Body Decode Report goes through exactly what {{scorecard_state}} means for your training, your nutrition, and your fat loss. It is written specifically to your result, not a generic guide.

$37. Delivered to your inbox within minutes.

Get your report here: https://bodyrecode.au/get-report

Kade
Body Recode`,
    },
  },
  { position: 4, type: 'wait', action_type: null, config: { unit: 'days', amount: '2' } },
  {
    position: 5, type: 'action', action_type: 'send_email',
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
  { position: 6, type: 'wait', action_type: null, config: { unit: 'days', amount: '4' } },
  {
    position: 7, type: 'action', action_type: 'send_email',
    config: {
      subject: 'The prescription problem',
      body: `Hi {{first_name}},

Most coaching programs give everyone the same plan. Same training, same nutrition, same timeline. Your body state does not factor into it at all.

Your scorecard came back as {{scorecard_state}}. That is a specific biological pattern, not a label. It tells me how your body is handling load, how well it is recovering, and how much capacity it has to adapt right now.

A program built for a Ready state will not work for a Depleted state. That is not a motivation problem. That is a prescription problem.

That is exactly what the call addresses. Building the approach around your actual state, not a generic template.

Book here: https://bodyrecode.au/book

Kade
Body Recode`,
    },
  },
  { position: 8, type: 'wait', action_type: null, config: { unit: 'days', amount: '5' } },
  {
    position: 9, type: 'action', action_type: 'send_email',
    config: {
      subject: 'Last one from me, {{first_name}}',
      body: `Hi {{first_name}},

Last email from me on this.

Your scorecard result is still there whenever you want to act on it. The call is still available. The report is still there if you want the written breakdown first.

No follow-up after this.

Book a call: https://bodyrecode.au/book
Get the report: https://bodyrecode.au/get-report

Kade
Body Recode`,
    },
  },
]

export async function POST(request: Request) {
  const admin = createAdminClient()
  const body = await request.json().catch(() => ({}))
  const coachId: string | null = body.coachId ?? null

  // Fetch ALL matching workflows — duplicates may exist from prior failed seeds
  const { data: allMatching, error: findError } = await admin
    .from('be_workflows')
    .select('id')
    .eq('name', WORKFLOW_NAME)
    .eq('trigger_type', 'form_submitted')
    .order('created_at', { ascending: true })

  if (findError) {
    return NextResponse.json({ error: findError.message }, { status: 500 })
  }

  let workflowId: string

  if (allMatching && allMatching.length > 0) {
    // Keep the oldest, delete the rest
    workflowId = allMatching[0].id
    const duplicateIds = allMatching.slice(1).map(w => w.id)
    if (duplicateIds.length > 0) {
      await admin.from('be_workflows').delete().in('id', duplicateIds)
    }
    // Also stamp coach_id if we have it and it's currently null
    const update: Record<string, unknown> = { is_active: true }
    if (coachId) update.coach_id = coachId
    await admin.from('be_workflows').update(update).eq('id', workflowId)
  } else {
    // Create fresh
    const { data: created, error: createError } = await admin
      .from('be_workflows')
      .insert({
        name: WORKFLOW_NAME,
        trigger_type: 'form_submitted',
        trigger_config: { form: 'scorecard' },
        is_active: true,
        ...(coachId ? { coach_id: coachId } : {}),
      })
      .select('id')
      .single()

    if (createError || !created) {
      return NextResponse.json({ error: createError?.message ?? 'Failed to create workflow' }, { status: 500 })
    }
    workflowId = created.id
  }

  // Replace steps with latest copy
  await admin.from('be_workflow_steps').delete().eq('workflow_id', workflowId)
  const { error: stepsError } = await admin
    .from('be_workflow_steps')
    .insert(STEPS.map(s => ({ ...s, workflow_id: workflowId })))

  if (stepsError) {
    return NextResponse.json({ error: stepsError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, workflowId, action: allMatching && allMatching.length > 0 ? 'updated' : 'created' })
}
