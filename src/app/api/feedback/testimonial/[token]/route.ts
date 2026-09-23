// The client's own link. No session: they are not signed in, the token IS the
// authorisation, and it only ever reaches one row.

import { NextRequest, NextResponse } from 'next/server'
import { testimonialAsk, submitTestimonial, declineTestimonial } from '@/lib/coach-testimonials'

export async function GET(_request: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params
  const r = await testimonialAsk(token)
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 404 })
  return NextResponse.json(r)
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params
  const body = await request.json().catch(() => ({}))

  if (body.decline === true) {
    const d = await declineTestimonial(token)
    if (!d.ok) return NextResponse.json({ error: d.error }, { status: 400 })
    return NextResponse.json({ ok: true, declined: true })
  }

  const publishAs = ['first_name', 'first_last_initial', 'anonymous'].includes(body.publishAs)
    ? body.publishAs
    : 'first_last_initial'

  const r = await submitTestimonial(token, String(body.text ?? ''), publishAs)
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 })
  return NextResponse.json({ ok: true })
}
