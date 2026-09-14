import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachUser, forbidden } from '@/lib/api-auth'
import { generateAndStoreProgressRead, ProgressReadError } from '@/lib/progress-read-generate'

// Pro + fluid compute ceiling, as generate-cffs. A Progress Read carries more
// than a Foundational Read (the previous read, the comparison, the weeks since).
export const maxDuration = 800
const SAVE_MARGIN_MS = 30_000

/**
 * Generates a Progress Read from a submitted near-full Progress Check and stores
 * it as a DRAFT. Nothing reaches the client: the coach reads it and decides.
 */
export async function POST(request: NextRequest) {
  const startedAt = Date.now()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const body = await request.json().catch(() => null)
  const progressCheckId = body?.progress_check_id
  if (typeof progressCheckId !== 'string') return NextResponse.json({ error: 'progress_check_id required' }, { status: 400 })

  try {
    const admin = createAdminClient()
    const result = await generateAndStoreProgressRead(admin, progressCheckId, maxDuration * 1000 - (Date.now() - startedAt) - SAVE_MARGIN_MS)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    if (err instanceof ProgressReadError) return NextResponse.json({ error: err.message }, { status: err.status })
    console.error('[generate-progress-read]', err)
    return NextResponse.json({ error: 'Something went wrong generating the Progress Read.' }, { status: 500 })
  }
}
