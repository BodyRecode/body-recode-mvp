import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireCoachScope } from '@/lib/coach-scope'
import { buildIntakeInviteEmail } from '@/lib/intake-invite-email'
import { fromCoach, COACH_BCC } from '@/lib/email-shell'
import { appUrl } from '@/lib/app-url'

/**
 * Add many clients at once, and optionally invite them.
 *
 * WHY (19 September 2026, Kade's question): a coach joining the pilot with 30
 * existing clients had one route in, which was the single-client form, thirty
 * times. That is the kind of first hour that ends a pilot. A coach never types
 * a client's details anyway, only a name and an email, because everything else
 * comes from the client's own intake, so the whole job is a list.
 *
 * The rules that make this safe to run twice:
 *   - a client already on this coach's list, matched on email, is SKIPPED, not
 *     duplicated and not overwritten
 *   - every row is reported back by name with what happened to it
 *   - a row that fails does not stop the rest
 *   - an invitation is created for every new client, but the email only goes
 *     out if asked for, so a coach can import quietly and invite later
 */

const MAX_ROWS = 200

interface ParsedRow {
  name: string
  email: string | null
  phone: string | null
  line: number
}

/**
 * Accepts what people actually paste: comma, tab or semicolon separated, with
 * or without a header row, name first or email first.
 */
export function parseClientList(text: string): { rows: ParsedRow[]; skipped: string[] } {
  const rows: ParsedRow[] = []
  const skipped: string[] = []
  const lines = text.split(/\r?\n/)

  lines.forEach((raw, i) => {
    const line = raw.trim()
    if (!line) return
    const parts = line.split(/\t|,|;/).map(p => p.trim()).filter(Boolean)
    if (parts.length === 0) return

    // A header row names itself; skip it rather than creating a client called "Name".
    const lower = parts.map(p => p.toLowerCase())
    if (i === 0 && lower.some(p => p === 'name' || p === 'full name' || p === 'client') && lower.some(p => p.includes('email'))) return

    const emailPart = parts.find(p => p.includes('@') && p.includes('.'))
    const namePart = parts.find(p => p !== emailPart && !/^[+\d\s()-]{6,}$/.test(p))
    const phonePart = parts.find(p => p !== emailPart && p !== namePart && /^[+\d\s()-]{6,}$/.test(p))

    if (!namePart) {
      skipped.push(`Line ${i + 1}: could not find a name in "${line.slice(0, 60)}"`)
      return
    }
    rows.push({ name: namePart, email: emailPart ?? null, phone: phonePart ?? null, line: i + 1 })
  })

  return { rows, skipped }
}

export async function POST(req: NextRequest) {
  const scope = await requireCoachScope()

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const text = String(body.text ?? '')
  const sendInvites = body.sendInvites === true
  const dryRun = body.dryRun === true
  if (!text.trim()) return NextResponse.json({ error: 'Paste a list first' }, { status: 400 })

  const { rows, skipped } = parseClientList(text)
  if (rows.length === 0) return NextResponse.json({ error: 'Nothing in that list looked like a client', skipped }, { status: 400 })
  if (rows.length > MAX_ROWS) {
    return NextResponse.json({ error: `That is ${rows.length} rows. Do it in batches of ${MAX_ROWS} or fewer.` }, { status: 400 })
  }

  const admin = createAdminClient()

  // Existing clients for THIS coach only, so a name on another coach's list is
  // irrelevant here.
  const { data: existing } = await admin
    .from('clients')
    .select('id, email')
    .eq('coach_id', scope.coachId)
  const existingEmails = new Set(
    (existing ?? []).map(c => (c.email as string | null)?.trim().toLowerCase()).filter(Boolean) as string[],
  )

  const results: Array<{ name: string; email: string | null; outcome: string; intakeUrl?: string }> = []

  for (const row of rows) {
    const emailKey = row.email?.toLowerCase() ?? null
    if (emailKey && existingEmails.has(emailKey)) {
      results.push({ name: row.name, email: row.email, outcome: 'already on your list, skipped' })
      continue
    }

    if (dryRun) {
      results.push({ name: row.name, email: row.email, outcome: 'would be added' })
      continue
    }

    const { data: client, error: clientError } = await admin
      .from('clients')
      .insert({ coach_id: scope.coachId, name: row.name, email: row.email, phone: row.phone, active: true })
      .select('id')
      .single()

    if (clientError || !client) {
      results.push({ name: row.name, email: row.email, outcome: `could not be added (${clientError?.message ?? 'unknown error'})` })
      continue
    }
    if (emailKey) existingEmails.add(emailKey)

    const { data: invitation } = await admin
      .from('intake_invitations')
      .insert({ client_id: client.id })
      .select('token')
      .single()

    const intakeUrl = invitation ? `${appUrl()}/intake/${invitation.token}` : undefined

    if (sendInvites && row.email && intakeUrl) {
      try {
        const { subject, html } = buildIntakeInviteEmail({
          firstName: row.name.split(/\s+/)[0],
          intakeUrl,
          mode: 'first_time',
        })
        const resend = new Resend(process.env.RESEND_API_KEY)
        const { error: sendError } = await resend.emails.send({
          from: fromCoach(),
          to: row.email,
          bcc: COACH_BCC,
          subject,
          html,
        })
        results.push({
          name: row.name,
          email: row.email,
          outcome: sendError ? 'added, but the intake email did not send' : 'added and invited',
          intakeUrl,
        })
      } catch {
        results.push({ name: row.name, email: row.email, outcome: 'added, but the intake email did not send', intakeUrl })
      }
    } else {
      results.push({
        name: row.name,
        email: row.email,
        outcome: row.email ? 'added, not yet invited' : 'added, no email address so it cannot be invited',
        intakeUrl,
      })
    }
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    added: results.filter(r => r.outcome.startsWith('added') || r.outcome === 'would be added').length,
    skippedExisting: results.filter(r => r.outcome.includes('already on your list')).length,
    results,
    unparsed: skipped,
  })
}
