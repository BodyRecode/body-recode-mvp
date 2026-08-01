import type { SupabaseClient } from '@supabase/supabase-js'
import { suppressEmail, unsuppressEmail } from '@/lib/unsubscribe'

/**
 * Freeze a coaching engagement without ending it.
 *
 * Sibling to offboardClient (src/lib/offboard-client.ts). Same effective
 * lockout: portal-guard.ts sees frozen_at and redirects, every client-facing
 * cron treats a frozen client as "no contact". None of the finality: no token
 * rotation, no retention date, no end reason, no auth ban. Unfreeze restores
 * everything in one write.
 *
 * Use when the client is coming back: holiday, saving up, injury recovery. For
 * a real end, use offboardClient instead.
 *
 * Stripe subscription cancellation is handled by the API route
 * (/api/clients/[id]/freeze), not this function. This function owns the app
 * state; the route composes Stripe on top.
 */
export interface FreezeInput {
  clientId: string
  notes?: string | null
  frozenBy?: string | null
  email?: string | null
}

export interface FreezeResult {
  ok: boolean
  steps: { step: string; done: boolean; detail?: string }[]
  error?: string
}

export async function freezeClient(
  admin: SupabaseClient,
  input: FreezeInput,
): Promise<FreezeResult> {
  const { clientId, notes, frozenBy } = input
  const steps: FreezeResult['steps'] = []
  const now = new Date()

  const { data: client } = await admin
    .from('clients')
    .select('id, name, email, ended_at, frozen_at')
    .eq('id', clientId)
    .maybeSingle()

  if (!client) return { ok: false, steps, error: 'Client not found' }
  if (client.ended_at) {
    return { ok: false, steps, error: `Cannot freeze: engagement ended on ${String(client.ended_at).slice(0, 10)}. Use reinstate instead.` }
  }
  if (client.frozen_at) {
    return { ok: false, steps, error: `Already frozen since ${String(client.frozen_at).slice(0, 10)}.` }
  }
  const email = (input.email ?? client.email ?? '').trim()

  const { error: clientErr } = await admin
    .from('clients')
    .update({
      active: false,
      frozen_at: now.toISOString(),
      frozen_by: frozenBy ?? null,
      freeze_notes: notes?.trim() || null,
    })
    .eq('id', clientId)
  steps.push({ step: 'Client marked frozen (portal locked, crons skip)', done: !clientErr, detail: clientErr?.message })
  if (clientErr) return { ok: false, steps, error: clientErr.message }

  if (email) {
    try {
      await suppressEmail(email, 'manual', `freeze: ${now.toISOString().slice(0, 10)}`)
      steps.push({ step: 'Email suppressed (belt-and-braces)', done: true })
    } catch (e: unknown) {
      steps.push({ step: 'Email suppressed (belt-and-braces)', done: false, detail: e instanceof Error ? e.message : String(e) })
    }
  } else {
    steps.push({ step: 'Email suppressed (belt-and-braces)', done: false, detail: 'no email on file' })
  }

  return { ok: true, steps }
}

export interface UnfreezeInput {
  clientId: string
  email?: string | null
}

export async function unfreezeClient(
  admin: SupabaseClient,
  input: UnfreezeInput,
): Promise<FreezeResult> {
  const { clientId } = input
  const steps: FreezeResult['steps'] = []

  const { data: client } = await admin
    .from('clients')
    .select('id, name, email, ended_at, frozen_at')
    .eq('id', clientId)
    .maybeSingle()

  if (!client) return { ok: false, steps, error: 'Client not found' }
  if (client.ended_at) {
    return { ok: false, steps, error: 'Cannot unfreeze an offboarded client. Reinstate via the offboard flow.' }
  }
  if (!client.frozen_at) {
    return { ok: false, steps, error: 'Client is not frozen.' }
  }
  const email = (input.email ?? client.email ?? '').trim()

  const { error: clientErr } = await admin
    .from('clients')
    .update({
      active: true,
      frozen_at: null,
      frozen_by: null,
      freeze_notes: null,
    })
    .eq('id', clientId)
  steps.push({ step: 'Freeze cleared (portal restored, crons resume)', done: !clientErr, detail: clientErr?.message })
  if (clientErr) return { ok: false, steps, error: clientErr.message }

  if (email) {
    try {
      await unsuppressEmail(email)
      steps.push({ step: 'Email unsuppressed', done: true })
    } catch (e: unknown) {
      steps.push({ step: 'Email unsuppressed', done: false, detail: e instanceof Error ? e.message : String(e) })
    }
  } else {
    steps.push({ step: 'Email unsuppressed', done: false, detail: 'no email on file' })
  }

  return { ok: true, steps }
}
