import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isCoachEmail } from '@/lib/coach-auth'
import { validateDoctrineParameters } from '@/lib/doctrine-parameters-validator'
import { generateLivePreview } from '@/lib/doctrine-parameters-live-preview'
import type { PreviewInput } from '@/lib/doctrine-parameters-preview'

export const maxDuration = 60

/**
 * POST /api/tenant/doctrine-parameters/preview/live
 * Body: { doctrineParameters: PreviewInput }
 *
 * Runs one Anthropic call using the coach's tuning applied to a fixed
 * stub weekly check-in. Returns the generated interpretation / reframe /
 * next_focus fields with terminology substitutions applied + partner
 * banned-phrase hits + platform banned-phrase hits + latency + token
 * usage.
 *
 * Costs ~$0.001/click (Haiku, ~1500 in + ~500 out). Runs the same
 * validator as the deterministic preview + save endpoints; an invalid
 * config returns 400 without spending an API call.
 *
 * Complements /preview (deterministic, free, fast) with a real
 * generation the coach can eyeball for voice/tuning correctness.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isCoachEmail(user.email)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = (await req.json().catch(() => ({}))) as {
    doctrineParameters?: PreviewInput
  }
  const params = body.doctrineParameters ?? {}

  const validation = validateDoctrineParameters(params)
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  try {
    const result = await generateLivePreview(params)
    return NextResponse.json({ result })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[doctrine-parameters/preview/live] error:', msg)
    return NextResponse.json({ error: `Live preview failed: ${msg}` }, { status: 500 })
  }
}
