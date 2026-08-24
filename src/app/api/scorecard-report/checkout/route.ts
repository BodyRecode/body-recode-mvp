import { NextResponse } from 'next/server'
import { brand } from '@/config/tenant'
import { REPORT_RETIRED } from '@/lib/scorecard-report-retired'

// The $37 Body Decode Report was retired on 24 Aug 2026. See
// src/lib/scorecard-report-retired.ts for why, and for what deliberately stays.
//
// The route is kept rather than deleted because the scorecard on
// performance.bodyrecode.au posted here cross-origin. A deleted route gives a
// stale cached page a 404 with no explanation; this gives it a 410 it can read.

const CORS = {
  'Access-Control-Allow-Origin': brand().performanceDomain,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function POST() {
  return NextResponse.json(REPORT_RETIRED, { status: 410, headers: CORS })
}
