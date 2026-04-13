import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSms, formatPhone } from '@/lib/twilio'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json()
  const { phone, message } = body

  if (!phone || !message) {
    return NextResponse.json({ error: 'Phone and message are required' }, { status: 400 })
  }

  try {
    await sendSms({
      to: formatPhone(phone),
      message,
    })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[Test SMS] Failed:', err)
    return NextResponse.json({ error: err.message ?? 'Failed to send SMS' }, { status: 500 })
  }
}
