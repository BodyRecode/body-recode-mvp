import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachUser, forbidden } from '@/lib/api-auth'

// GET /api/content/reel-status?output_id=xxx
// Checks HeyGen for render status, updates output row when ready
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const output_id = request.nextUrl.searchParams.get('output_id')
  if (!output_id) return NextResponse.json({ error: 'output_id required' }, { status: 400 })

  const heygenKey = process.env.HEYGEN_API_KEY
  if (!heygenKey) return NextResponse.json({ error: 'HeyGen not configured' }, { status: 503 })

  // Get the output row to find heygen_video_id
  const { data: output } = await supabase
    .from('be_content_outputs')
    .select('heygen_video_id, video_status, video_url')
    .eq('id', output_id)
    .eq('coach_id', user.id)
    .single()

  if (!output) return NextResponse.json({ error: 'Output not found' }, { status: 404 })

  // Already resolved
  if (output.video_status === 'ready' || output.video_status === 'failed') {
    return NextResponse.json({ video_status: output.video_status, video_url: output.video_url })
  }

  if (!output.heygen_video_id) {
    return NextResponse.json({ video_status: output.video_status ?? 'not_started' })
  }

  // Poll HeyGen
  const statusResponse = await fetch(
    `https://api.heygen.com/v1/video_status.get?video_id=${output.heygen_video_id}`,
    { headers: { 'x-api-key': heygenKey } }
  )

  if (!statusResponse.ok) {
    return NextResponse.json({ error: 'HeyGen status check failed' }, { status: 502 })
  }

  const { data: statusData } = await statusResponse.json()
  const heygenStatus: string = statusData?.status
  const videoUrl: string | null = statusData?.video_url ?? null

  const adminSupabase = createAdminClient()

  if (heygenStatus === 'completed' && videoUrl) {
    await adminSupabase
      .from('be_content_outputs')
      .update({ video_status: 'ready', video_url: videoUrl })
      .eq('id', output_id)

    return NextResponse.json({ video_status: 'ready', video_url: videoUrl })
  }

  if (heygenStatus === 'failed') {
    await adminSupabase
      .from('be_content_outputs')
      .update({ video_status: 'failed' })
      .eq('id', output_id)

    return NextResponse.json({ video_status: 'failed' })
  }

  return NextResponse.json({ video_status: 'rendering' })
}
