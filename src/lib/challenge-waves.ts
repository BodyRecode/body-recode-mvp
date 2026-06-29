// Wave-tiered founding-member cap for the Funnel B Challenge launch.
//
// Strategy: real urgency via honest wave caps (not fake scarcity).
// Wave 1 = founding 50. Wave 2 = +25. Wave 3 = +25. Wave 4+ = evergreen.
//
// Operational control:
//   - CHALLENGE_CURRENT_WAVE env var (default '1') controls which wave is
//     currently open. Kade flips this in Vercel to advance waves.
//   - When the current wave's cap is hit, /api/challenge/enroll auto-rejects
//     with status='wave_full' and the /challenge LP shows the waitlist form
//     for the next wave.
//   - To advance: set CHALLENGE_CURRENT_WAVE=2 in Vercel + redeploy. The
//     accumulated wave-2 waitlist gets the wave-2-open broadcast email.
//
// See:
//   - SQL: sql/2026-06-29_challenge_wave_cap.sql
//   - Feature Registry: "Wave-Tiered Founding Member Cap 2026-06-29"
//   - Auto-memory: project_funnel_b_wave_cap_strategy

import type { SupabaseClient } from '@supabase/supabase-js'

export interface WaveConfig {
  number: number
  cap: number | null // null = evergreen, no cap
  label: string
}

// Locked wave plan. Edit here if the strategy changes.
export const CHALLENGE_WAVES: WaveConfig[] = [
  { number: 1, cap: 50, label: 'Founding Members' },
  { number: 2, cap: 25, label: 'Wave 2' },
  { number: 3, cap: 25, label: 'Wave 3' },
  { number: 4, cap: null, label: 'Open Enrolment' },
]

export interface WaveStatus {
  current: WaveConfig
  taken: number
  remaining: number | null // null = evergreen
  isFull: boolean
  isEvergreen: boolean
  nextWave: WaveConfig | null
}

export function getCurrentWaveNumber(): number {
  const raw = process.env.CHALLENGE_CURRENT_WAVE?.trim() ?? '1'
  const n = parseInt(raw, 10)
  if (Number.isNaN(n) || n < 1) return 1
  // Clamp to defined waves; anything beyond the last defined wave is evergreen.
  return Math.min(n, CHALLENGE_WAVES.length)
}

export function getWaveConfig(waveNumber: number): WaveConfig {
  return CHALLENGE_WAVES.find(w => w.number === waveNumber)
    ?? CHALLENGE_WAVES[CHALLENGE_WAVES.length - 1]
}

export async function getWaveStatus(admin: SupabaseClient): Promise<WaveStatus> {
  const current = getWaveConfig(getCurrentWaveNumber())
  const isEvergreen = current.cap === null

  if (isEvergreen) {
    return {
      current,
      taken: 0,
      remaining: null,
      isFull: false,
      isEvergreen: true,
      nextWave: null,
    }
  }

  // Count active enrolments in the current wave
  const { count } = await admin
    .from('challenge_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('wave', current.number)
    .eq('status', 'active')

  const taken = count ?? 0
  const cap = current.cap as number
  const remaining = Math.max(0, cap - taken)
  const isFull = taken >= cap

  const nextWave = CHALLENGE_WAVES.find(w => w.number === current.number + 1) ?? null

  return {
    current,
    taken,
    remaining,
    isFull,
    isEvergreen: false,
    nextWave,
  }
}

// Public-facing helper used by /api/challenge/enroll to gate new enrolments.
// Returns the wave number to assign, OR null if doors are closed.
export async function reserveWaveSlot(admin: SupabaseClient): Promise<{ ok: true; wave: number } | { ok: false; reason: 'wave_full'; status: WaveStatus }> {
  const status = await getWaveStatus(admin)
  if (status.isEvergreen) return { ok: true, wave: status.current.number }
  if (!status.isFull) return { ok: true, wave: status.current.number }
  return { ok: false, reason: 'wave_full', status }
}
