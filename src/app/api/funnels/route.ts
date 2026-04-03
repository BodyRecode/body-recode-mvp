import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json()
  if (!body.name || !body.slug) {
    return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
  }

  // Create funnel
  const { data: funnel, error } = await supabase
    .from('be_funnels')
    .insert({
      coach_id: user.id,
      name: body.name,
      slug: body.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      is_active: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Create the landing page record
  const { error: pageError } = await supabase
    .from('be_funnel_pages')
    .insert({
      funnel_id: funnel.id,
      position: 1,
      type: 'landing',
      title: body.name,
      content: {
        headline: body.headline ?? '',
        subheadline: body.subheadline ?? '',
        body: body.body ?? '',
        cta_label: body.cta_label ?? 'Book a Free Call',
        redirect_to: body.redirect_to ?? 'book',
      },
    })

  if (pageError) return NextResponse.json({ error: pageError.message }, { status: 500 })

  return NextResponse.json(funnel)
}
