import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: lead } = await supabase
    .from('leads')
    .select('followup_email_ids')
    .eq('id', id)
    .single()

  const emailIds = lead?.followup_email_ids as string[] | null
  if (!emailIds || emailIds.length === 0) {
    return NextResponse.json({ cancelled: 0 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  let cancelled = 0

  for (const emailId of emailIds) {
    try {
      await resend.emails.cancel(emailId)
      cancelled++
    } catch (e) {
      // Email may have already sent — not an error
      console.warn('Could not cancel email', emailId, e)
    }
  }

  // Clear the IDs so the button doesn't show again
  await supabase
    .from('leads')
    .update({ followup_email_ids: null })
    .eq('id', id)

  return NextResponse.json({ cancelled })
}
