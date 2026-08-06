import { NextResponse } from 'next/server'
import { requireCoach } from '@/lib/api-auth'

const TOKEN = process.env.VERCEL_API_TOKEN
const PROJECT_ID = process.env.VERCEL_PERFORMANCE_PROJECT_ID
const TEAM_ID = process.env.VERCEL_TEAM_ID

export async function GET(request: Request) {
  const gate = await requireCoach()
  if (!gate.ok) return gate.response

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

  const [overviewRes, timeseriesRes] = await Promise.all([
    fetch(`${base}/overview?${params}`, { headers, next: { revalidate: 300 } }),
    fetch(`${base}/timeseries?${params}`, { headers, next: { revalidate: 300 } }),
  ])

  if (!overviewRes.ok) {
    const err = await overviewRes.json()
    return NextResponse.json({ error: err?.error?.message ?? 'Vercel API error' }, { status: 502 })
  }

  const [overview, timeseries] = await Promise.all([
    overviewRes.json(),
    timeseriesRes.ok ? timeseriesRes.json() : { data: { groups: { all: [] } } },
  ])

  const daily: { date: string; views: number; visitors: number }[] =
    (timeseries?.data?.groups?.all ?? []).map((d: { key: string; total: number; devices: number }) => ({
      date: d.key,
      views: d.total,
      visitors: d.devices,
    }))

  return NextResponse.json({ overview, daily })
}
