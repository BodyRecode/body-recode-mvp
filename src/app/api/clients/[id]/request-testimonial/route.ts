// POST /api/clients/[id]/request-testimonial
//
// The client id is in the PATH, which is what the ownership gate in the
// middleware matches on, so a coach cannot ask a client who is not theirs.
// See src/middleware.ts gate 4a and npm run test:coach-isolation.

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { requestTestimonial } from '@/lib/coach-testimonials'
import { sendTestimonialAsk } from '@/lib/testimonial-email'

export async function POST(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await createServerSupabaseClient()
  const { data: { user } } = await session.auth.getUser()
  if (!user) return NextResponse.json({ error: 'auth_required' }, { status: 401 })

  const { id } = await ctx.params
  const made = await requestTestimonial(id)
  if (!made.ok) return NextResponse.json({ error: made.error }, { status: 400 })

  // Asking twice should not send twice. The first link is still live.
  if (made.alreadyAsked) {
    return NextResponse.json({ ok: true, alreadyAsked: true })
  }

  const sent = await sendTestimonialAsk(made.id)
  if (!sent.ok) return NextResponse.json({ error: sent.error }, { status: 400 })
  return NextResponse.json({ ok: true, alreadyAsked: false })
}
