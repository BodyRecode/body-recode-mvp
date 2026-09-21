/**
 * Stamp that she has actually opened a read.
 *
 * 21 September 2026. Until now the system recorded when the email was SENT and
 * treated that as the end of the story. Sent is not read. A coach asking "did
 * she take this in" had nothing to look at, and in a pilot that is the whole
 * question.
 *
 * FIRST OPEN ONLY, on purpose. A count of visits is surveillance of a woman
 * reading something about her own body, and it answers a question nobody needs.
 * "She has seen it" carries all the value. "She has read it eleven times" is us
 * watching her.
 *
 * Never throws and never blocks the page. A client opening her own read must
 * never see an error because a timestamp could not be written.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export type ReadKind = 'cffs' | 'cfws' | 'progress_reads'

export async function markReadOpened(
  admin: SupabaseClient,
  kind: ReadKind,
  rowId: string,
): Promise<void> {
  if (!rowId) return
  try {
    // is null keeps it to the first open without needing to read the row first.
    await admin
      .from(kind)
      .update({ client_opened_at: new Date().toISOString() })
      .eq('id', rowId)
      .is('client_opened_at', null)
  } catch {
    // Deliberately silent. See the note above.
  }
}

/** "Opened Tuesday", or the honest absence of it, for a coach to read. */
export function describeOpened(openedAt: string | null | undefined, sentAt?: string | null): string {
  if (openedAt) {
    return `Opened ${new Date(openedAt).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' })}`
  }
  if (sentAt) return 'Sent, not opened yet'
  return 'Not sent yet'
}
