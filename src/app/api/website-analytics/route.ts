import { NextResponse } from 'next/server'

const TOKEN = process.env.VERCEL_API_TOKEN
const PROJECT_ID = process.env.VERCEL_PERFORMANCE_PROJECT_ID
const TEAM_ID = process.env.VERCEL_TEAM_ID

export async function GET(request: Request) {
  if (!TOKEN || !PROJECT_ID || !TEAM_ID) {
    return NextResponse.json({ error: 'Missing Vercel credentials' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') ?? '30')

  const now = new Date()
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  const fromStr = from.toISOString().split('T')[0]
  const toStr = now.toISOString().split('T')[0]

  const headers = { Authorization: `Bearer ${TOKEN}` }
  const base = `https://vercel.com/api/web-analytics`
  const params = new URLSearchParams({ teamId: TEAM_ID, projectId: PROJECT_ID, from: fromStr, to: toStr })

  const [overviewRes, pagesRes, referrersRes] = await Promise.all([
    fetch(`${base}/overview?${params}`, { headers, next: { revalidate: 300 } }),
    fetch(`${base}/pages?${params}&limit=10`, { headers, next: { revalidate: 300 } }),
    fetch(`${base}/referrers?${params}&limit=10`, { headers, next: { revalidate: 300 } }),
  ])

  if (!overviewRes.ok) {
    const err = await overviewRes.json()
    return NextResponse.json({ error: err?.error?.message ?? 'Vercel API error' }, { status: 502 })
  }

  const [overview, pages, referrers] = await Promise.all([
    overviewRes.json(),
    pagesRes.ok ? pagesRes.json() : { data: [] },
    referrersRes.ok ? referrersRes.json() : { data: [] },
  ])

  return NextResponse.json({ overview, pages: pages.data ?? [], referrers: referrers.data ?? [] })
}
