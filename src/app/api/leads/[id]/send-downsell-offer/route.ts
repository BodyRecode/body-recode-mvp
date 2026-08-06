import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendDownsellOffer } from '@/lib/send-downsell-offer'
import { requireCoach } from '@/lib/api-auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireCoach()
  if (!gate.ok) return gate.response

  const { id } = await params
  const admin = createAdminClient()

  const { data: lead } = await admin
    .from('leads')
    .select('id, name, email')
    .eq('id', id)
    .maybeSingle()

  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  if (!lead.email) return NextResponse.json({ error: 'No email address' }, { status: 400 })

  const result = await sendDownsellOffer(id, lead, admin)

  if (!result.sent) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ sent: true })
}
