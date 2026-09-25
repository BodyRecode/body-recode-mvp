/**
 * ONE DOOR OUT FOR ANYTHING SENT TO A CLIENT.
 *
 * Kade, 25 Sep 2026: "so we should make a wrapper around the mails so change
 * one change all?" Yes, and the reason is the day we had just had. There are
 * 166 direct calls to the mail provider in this codebase and no wrapper around
 * any of them, so every rule about client email is a rule somebody has to
 * REMEMBER at 166 sites. Today alone that produced:
 *
 *   - every coaching email signed by Kade, whoever the coach was, because the
 *     signature read three constants in a file rather than the client's coach
 *   - replies going to Kade rather than to the coach responsible for the client
 *   - a BCC rule that had to be applied by hand and was missed on the one send
 *     Kade most wanted to see
 *
 * A rule with 166 copies is a rule with one copy and 165 gaps.
 *
 * WHAT THIS ENFORCES, so that none of it is remembered again:
 *
 *   1. THE NAME AND THE REPLY-TO are the client's own coach. Never the global
 *      config, which is Kade.
 *   2. THE SIGNATURE is their coach's, with a monogram rather than somebody
 *      else's face when they have not set a photo.
 *   3. THE COACH IS COPIED, per Kade 19 Sep: "what goes to a client goes to my
 *      inbox also to confirm".
 *   4. UNRESOLVED MERGE TAGS BLOCK THE SEND. Kim received an SMS reading
 *      "{{name}}" with a dead link on 16 September; the SMS sender was fixed
 *      that day and email never was. The same fault, one channel over.
 *   5. A SUPPRESSED ADDRESS IS NOT SENT TO. Unsubscribe means unsubscribe.
 *   6. IT IS LOGGED, so the client's file shows what they were actually sent.
 *
 * Marketing and funnel email does NOT belong here: those genuinely are from
 * Kade, to people who are not anybody's client yet.
 */

import { Resend } from 'resend'
import type { SupabaseClient } from '@supabase/supabase-js'
import { COACH_BCC, darkEmailShell } from './email-shell'
import { darkEmailSignature } from './email-signature'
import { coachEmailIdentity } from './coach-identity'
import { isSuppressed } from './unsubscribe'
import { logClientCommunication, type ClientCommunicationKind } from './client-communications'

export type SendClientEmailResult =
  | { ok: true; skipped?: 'suppressed' }
  | { ok: false; error: string }

export interface SendClientEmailOpts {
  admin: SupabaseClient
  /** Who it is about. Their coach is resolved from this. */
  clientId: string
  to: string
  subject: string
  /**
   * The body only: no shell, no signature. Both are added here, which is what
   * makes "change one, change all" true rather than aspirational.
   */
  body: string
  /** For the client's own record. Typed, so a new send cannot invent a label
   *  the client's file does not know how to show. */
  kind: ClientCommunicationKind
  previewText?: string
  /** Set false for the rare send a coach should not be copied on. */
  copyCoach?: boolean
  meta?: Record<string, unknown>
}

/** Anything that looks like a merge tag nobody filled in. */
const UNRESOLVED = /\{\{\s*[\w.]+\s*\}\}|\$\{[\w.]+\}/

export async function sendClientEmail(opts: SendClientEmailOpts): Promise<SendClientEmailResult> {
  const { admin, clientId, to, subject, body, kind, previewText, copyCoach = true, meta } = opts

  if (!process.env.RESEND_API_KEY) return { ok: false, error: 'RESEND_API_KEY missing' }
  if (!to?.trim()) return { ok: false, error: 'no recipient' }

  // 4. Nothing with an unfilled placeholder in it leaves the building.
  const unresolved = subject.match(UNRESOLVED) ?? body.match(UNRESOLVED)
  if (unresolved) {
    return { ok: false, error: `unresolved placeholder in the email: ${unresolved[0]}` }
  }

  // 5. Unsubscribe means unsubscribe.
  if (await isSuppressed(to)) return { ok: true, skipped: 'suppressed' }

  // 1 + 2. Their coach, not the global config.
  const who = await coachEmailIdentity(admin, clientId)
  const html = darkEmailShell(`${body}\n${darkEmailSignature(who.signature)}`, previewText ? { previewText } : undefined)

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: who.from,
      replyTo: who.replyTo,
      to,
      // 3. The coach sees what their client was sent.
      ...(copyCoach ? { bcc: COACH_BCC } : {}),
      subject,
      html,
    })
    if (error) return { ok: false, error: error.message }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }

  // 6. On the record.
  await logClientCommunication(admin, {
    clientId,
    kind,
    subject,
    toAddress: to,
    meta: meta ?? {},
  }).catch(() => { /* a send that happened must not be reported as failed */ })

  return { ok: true }
}
