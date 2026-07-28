'use server'

import { readUnsubscribeToken, suppressEmail, unsuppressEmail } from '@/lib/unsubscribe'

/**
 * Server actions behind the unsubscribe page's buttons.
 *
 * Both take the signed token rather than a raw address so the page can never
 * be used to unsubscribe (or resubscribe) an arbitrary third party by editing
 * a form field.
 */

export async function unsubscribeAction(token: string): Promise<{ ok: boolean }> {
  const email = readUnsubscribeToken(token)
  if (!email) return { ok: false }
  await suppressEmail(email, 'unsubscribe_link', 'unsubscribe page')
  return { ok: true }
}

export async function resubscribeAction(token: string): Promise<{ ok: boolean }> {
  const email = readUnsubscribeToken(token)
  if (!email) return { ok: false }
  await unsuppressEmail(email)
  return { ok: true }
}
