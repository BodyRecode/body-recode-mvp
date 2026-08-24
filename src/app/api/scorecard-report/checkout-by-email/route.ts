import { NextResponse } from 'next/server'
import { REPORT_RETIRED } from '@/lib/scorecard-report-retired'

// Retired 24 Aug 2026. See src/lib/scorecard-report-retired.ts.
export async function POST() {
  return NextResponse.json(REPORT_RETIRED, { status: 410 })
}
