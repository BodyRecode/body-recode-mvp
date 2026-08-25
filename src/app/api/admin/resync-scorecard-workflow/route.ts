import { scorecardSteps } from '@/lib/scorecard-sequence'
import { NextResponse, NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isCoachUser, forbidden, requireCoachOrAdminSecret } from '@/lib/api-auth'
import { brand } from "@/config/tenant";

// GET /api/admin/resync-scorecard-workflow
// Visit this URL in the browser while logged in — reads your user ID from
// the session, resyncs the workflow, then redirects back to automations.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!(await isCoachUser(user))) return forbidden()
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

// One definition, in src/lib/scorecard-sequence.ts. This route's own copy had
// gone stale against the live rows, which made "Re-sync" a button that quietly
// replaced current emails with retired ones.
const STEPS = scorecardSteps()

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
  const gate = await requireCoachOrAdminSecret(request)
  if (!gate.ok) return gate.response

  const body = await request.json().catch(() => ({}))
  const coachId: string | null = body.coachId ?? null
  const result = await runResync(coachId)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json(result)
}
