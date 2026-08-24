// The scorecard findings, live.
//
// Kade, 25 Aug 2026, about "Across 86 women we have scored" on the performance
// homepage: "should we remove the number as this will always be changing?"
//
// The number should not be removed. It is checkable and specific, and vague
// precision ("hundreds of women") is exactly what makes coaching copy sound like
// everyone else's. But a hardcoded number goes stale, and the marketing site has
// no database access of its own, so it cannot know.
//
// THE HALF-FIX IS WORSE THAN EITHER. A live count attached to a hardcoded finding
// gives fresh-looking evidence for a claim nobody re-checked. So this returns the
// count AND the section averages together, and the copy reads both from here.
//
// Same computation as scripts/state-of-the-data.ts. Public because it is the
// number we put on a billboard, and aggregate only: no lead is identifiable.
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SECTION_LABELS } from '@/lib/companion-content'

export const revalidate = 3600

export async function GET() {
  try {
    const db = createAdminClient()
    const { data, error } = await db
      .from('leads')
      .select('scorecard_score, scorecard_section_scores')
      .not('scorecard_score', 'is', null)
      .limit(5000)
    if (error) throw new Error(error.message)

    const rows = data ?? []
    const totals = new Map<string, { sum: number; n: number }>()
    for (const l of rows) {
      const s = l.scorecard_section_scores as Record<string, unknown> | null
      if (!s || typeof s !== 'object') continue
      for (const [name, raw] of Object.entries(s)) {
        const v = Number(raw)
        if (!Number.isFinite(v)) continue
        const cur = totals.get(name) ?? { sum: 0, n: 0 }
        cur.sum += v; cur.n += 1
        totals.set(name, cur)
      }
    }

    // worst first, which is the order the argument is made in
    const sections = [...totals.entries()]
      // the DB stores section CODES, 01 to 05. Nobody outside the system knows
      // what "03" is, and this feeds public copy.
      .map(([code, c]) => ({
        code,
        name: SECTION_LABELS[code] ?? code,
        avg: Number((c.sum / c.n).toFixed(2)),
        n: c.n,
      }))
      .sort((a, b) => a.avg - b.avg)

    return NextResponse.json({
      n: rows.length,
      sections,
      lowestTwo: sections.slice(0, 2).map(s => s.name),
      highest: sections[sections.length - 1] ?? null,
      // so a consumer can tell a live answer from a fallback
      source: 'live',
    }, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } })
  } catch (e) {
    return NextResponse.json({ error: String(e), source: 'error' }, { status: 500 })
  }
}
