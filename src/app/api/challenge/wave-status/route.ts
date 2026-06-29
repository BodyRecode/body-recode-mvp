// Public endpoint: returns the current Challenge wave status so the /challenge
// LP can render the right form (live enrolment if wave is open + has spots,
// or waitlist for next wave if current wave is full).
//
// No auth — public read. See src/lib/challenge-waves.ts for wave config.

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWaveStatus } from '@/lib/challenge-waves'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = createAdminClient()
  const status = await getWaveStatus(admin)
  return NextResponse.json({
    current: {
      number: status.current.number,
      label: status.current.label,
      cap: status.current.cap,
    },
    taken: status.taken,
    remaining: status.remaining,
    isFull: status.isFull,
    isEvergreen: status.isEvergreen,
    nextWave: status.nextWave ? {
      number: status.nextWave.number,
      label: status.nextWave.label,
      cap: status.nextWave.cap,
    } : null,
  }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
