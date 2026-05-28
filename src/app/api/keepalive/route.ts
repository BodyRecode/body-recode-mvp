import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Keep-alive ping for the Supabase project (klotlednmxhywimztozm).
// Pro tier doesn't auto-pause, but this gives us a heartbeat probe across the
// main tables, mirrors the pattern used in the Studio of Ten platform, and
// also serves as an external health-check endpoint we can hit if we ever
// suspect the DB is unreachable.

export async function GET(request: Request) {
  const auth = request.headers.get('authorization') ?? ''
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const admin = createAdminClient()

  const probes = [
    admin.from('leads').select('*', { count: 'exact', head: true }),
    admin.from('clients').select('*', { count: 'exact', head: true }),
    admin.from('training_plans').select('*', { count: 'exact', head: true }),
    admin.from('weekly_checkins').select('*', { count: 'exact', head: true }),
    admin.from('intake_invitations').select('*', { count: 'exact', head: true }),
  ]

  const results = await Promise.all(probes)
  const errors = results.map((r) => r.error?.message).filter(Boolean)

  return NextResponse.json({
    ok: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    counts: {
      leads: results[0].count ?? null,
      clients: results[1].count ?? null,
      training_plans: results[2].count ?? null,
      weekly_checkins: results[3].count ?? null,
      intake_invitations: results[4].count ?? null,
    },
    timestamp: new Date().toISOString(),
  })
}
