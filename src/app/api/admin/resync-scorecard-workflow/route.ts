import { NextResponse, NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { brand } from "@/config/tenant";

// GET /api/admin/resync-scorecard-workflow
// Visit this URL in the browser while logged in — reads your user ID from
// the session, resyncs the workflow, then redirects back to automations.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const coachId = user?.id ?? null

  await runResync(coachId)
  redirect('/dashboard/business/automations')
}

// POST /api/admin/resync-scorecard-workflow
// Uses the admin client (bypasses RLS) to upsert the scorecard follow-up workflow.
// Safe to call any time — always replaces steps with the latest copy.

const WORKFLOW_NAME = 'Scorecard - Follow-up Sequence'
// Match both old (em-dash) and new (hyphen) names so an existing workflow
// gets renamed in place rather than orphaned alongside a duplicate.
const WORKFLOW_NAME_LEGACY = 'Scorecard — Follow-up Sequence'

const STEPS = [
  {
    position: 1, type: 'action', action_type: 'send_email',
    config: {
      subject: 'Why your body has stopped responding, {{first_name}}',
      body: `Hi {{first_name}},

You just took the scorecard. Result: {{scorecard_score}}/15. Body state: {{scorecard_state}}.

That number is the starting point, not the answer. It tells you which of three states your body is currently in. It does not tell you why fat loss has stalled, what specifically is making things worse, or what to fix first.

The Body Decode Report does.

It is a written breakdown of the specific physiology behind your {{scorecard_state}} score, the fat-storage pattern your body is locked in, what is quietly making it worse, and the exact order to unstick it. Written specifically to your result. Not a generic guide.

$37. Delivered in 5 minutes. Yours to keep.

Get your report: ${brand().marketingDomain}/get-report

If you would rather talk it through first, you can book a free 15-minute strategy call: ${brand().marketingDomain}/book

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

Most people in your situation think they need to train harder or eat less. That is usually the wrong call.

When a body has stopped responding to effort, the issue is rarely the effort itself. It is the prescription. Pushing harder against a body that is already resisting is what got it stuck in the first place.

The Body Decode Report walks through what {{scorecard_state}} actually means for your training, your nutrition, your recovery, and most importantly, why fat loss has stalled. It is written to your specific result. It tells you what to stop immediately, and the order to fix what is left.

$37. Delivered in 5 minutes.

Get your report: ${brand().marketingDomain}/get-report

Kade
Body Recode`,
    },
  },
  { position: 4, type: 'wait', action_type: null, config: { unit: 'days', amount: '2' } },
  {
    position: 5, type: 'action', action_type: 'send_email',
    config: {
      subject: 'Re: your scorecard',
      body: `Hi {{first_name}},

Following up on your scorecard.

The most common thing I hear after someone takes it: "That finally explains why nothing has been working."

Knowing your state is the first piece. Knowing what to do about it is the second. That is what the call is for.

15 minutes. Free. No pitch. We go through your scorecard together, identify the specific bottleneck, and map out what to do first.

Book here: ${brand().marketingDomain}/book

If you would rather have the breakdown in writing first, the report is at ${brand().marketingDomain}/get-report.

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

Most coaching programs give everyone the same plan. Same training, same nutrition, same timeline. Your body state does not factor in at all.

Your scorecard came back as {{scorecard_state}}. That is a specific biological pattern, not a label. It tells me how your body is handling load, how well it is recovering, and how much capacity it has to respond right now.

A program built for a Ready state will make a Depleted state worse. That is not a motivation problem. It is a prescription problem.

The fastest way to address it is the call. 15 minutes, free, no pitch. We map out what your specific state needs first, and what to stop immediately.

Book here: ${brand().marketingDomain}/book

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

Your scorecard result is still there whenever you want to act on it. Two doors based on your {{scorecard_state}} score:

1. Body Decode Report ($37). Written breakdown of your result, the fat pattern you are locked in, and the order to fix it. Best if you want to act on it yourself.

2. Free 15-minute call. Best if you would rather talk it through first.

Get the report: ${brand().marketingDomain}/get-report
Book the call: ${brand().marketingDomain}/book

No follow-up after this.

Kade
Body Recode`,
    },
  },
]

async function runResync(coachId: string | null): Promise<{ ok: boolean; error?: string; workflowId?: string; action?: string }> {
  const admin = createAdminClient()

  // Fetch ALL matching workflows — duplicates may exist from prior failed seeds.
  // Match both old em-dash name and new hyphen name so we don't orphan an existing
  // workflow when the rename rolls out.
  const { data: allMatching, error: findError } = await admin
    .from('be_workflows')
    .select('id, name')
    .in('name', [WORKFLOW_NAME, WORKFLOW_NAME_LEGACY])
    .eq('trigger_type', 'form_submitted')
    .order('created_at', { ascending: true })

  if (findError) {
    return { ok: false, error: findError.message }
  }

  let workflowId: string

  if (allMatching && allMatching.length > 0) {
    // Keep the oldest, delete the rest
    workflowId = allMatching[0].id
    const duplicateIds = allMatching.slice(1).map(w => w.id)
    if (duplicateIds.length > 0) {
      await admin.from('be_workflows').delete().in('id', duplicateIds)
    }
    // Stamp coach_id if we have it and it's currently null. Also rename if it's
    // still on the old em-dash name.
    const update: Record<string, unknown> = { is_active: true, name: WORKFLOW_NAME }
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
      return { ok: false, error: createError?.message ?? 'Failed to create workflow' }
    }
    workflowId = created.id
  }

  // Replace steps with latest copy
  await admin.from('be_workflow_steps').delete().eq('workflow_id', workflowId)
  const { error: stepsError } = await admin
    .from('be_workflow_steps')
    .insert(STEPS.map(s => ({ ...s, workflow_id: workflowId })))

  if (stepsError) {
    return { ok: false, error: stepsError.message }
  }

  return { ok: true, workflowId, action: allMatching && allMatching.length > 0 ? 'updated' : 'created' }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const coachId: string | null = body.coachId ?? null
  const result = await runResync(coachId)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json(result)
}
