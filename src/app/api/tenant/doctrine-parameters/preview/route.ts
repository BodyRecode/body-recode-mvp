import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isCoachEmail } from '@/lib/coach-auth'
import { validateDoctrineParameters } from '@/lib/doctrine-parameters-validator'
import { buildPreview, type PreviewInput } from '@/lib/doctrine-parameters-preview'

/**
 * POST /api/tenant/doctrine-parameters/preview
 * Body: { doctrineParameters: PreviewInput }
 *
 * Returns a deterministic preview of what the supplied Mode A+ config
 * WOULD do if saved: per-generator PARTNER TUNING blocks, a demo of
 * terminology substitution applied to a sample paragraph, and any
 * banned-phrase hits on a demo sentence.
 *
 * No LLM call - fast, free, deterministic. Runs the same validator as
 * the save endpoint, so a config that would fail to save also fails to
 * preview (with the same error message the coach will see on Save).
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

  const preview = buildPreview(params)
  return NextResponse.json({ preview })
}
