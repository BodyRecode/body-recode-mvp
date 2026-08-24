import { NextResponse } from 'next/server'
import { appUrl } from '@/lib/app-url'

// Retired 24 Aug 2026. See src/lib/scorecard-report-retired.ts.
//
// Unlike the two checkout routes this is a GET a person can land on from an old
// email or a bookmark, so it redirects to the scorecard rather than returning a
// 410 they cannot do anything with.
export async function GET() {
  return NextResponse.redirect(`${appUrl()}/scorecard`, { status: 302 })
}
