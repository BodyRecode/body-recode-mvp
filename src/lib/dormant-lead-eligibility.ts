/**
 * Who is actually eligible for the dormant lead reactivation.
 *
 * Built 2026-08-12. The pool is every lead sitting at `new_check_in` who has
 * never moved, which was 84 of 136. But that raw list is not a send list, and
 * the difference matters when the first thing it does is email 84 real people:
 *
 *   - Seven of them are test records, including Kade's own two addresses. He
 *     would have emailed himself twice and texted the CAPI test accounts.
 *   - One test record has body state "Depleted" rather than "Depleted State",
 *     which would break the state lookup and send a broken read.
 *   - Eighteen have no body state at all, so there is no read to send them.
 *     A hollow version is worse than nothing.
 *   - And one was a former CLIENT sitting on an old lead status. The sequence
 *     would have caught her at send time, but she should never have been on the
 *     list. Converted leads are now the first thing excluded.
 *
 * Everything here is a hard exclusion. Nothing is a warning.
 */
import type { StateName } from '@/lib/fat-map-profile'

export const VALID_STATES: StateName[] = ['Depleted State', 'Transitioning State', 'Ready State']

/** Addresses that must never receive a sequence, however the list is built. */
const BLOCKED_EMAIL_PATTERNS = [
  /@bodyrecode\.au$/i,      // internal, including Kade's own
  /@bodyrecode\.test$/i,    // CAPI test harness
  /@example\.(com|org)$/i,
  /\btest\b/i,              // test-program-ready@, capitest-…
  /^kade[.+@]/i,            // kade@, kade.dunstone@, kade+challengetest@
]

const BLOCKED_NAME_PATTERNS = [/\btest\b/i, /^capitest/i]

export interface DormantCandidate {
  id: string
  name: string | null
  email: string | null
  scorecard_body_state: string | null
  scorecard_score: number | null
  scorecard_profile: string | null
  scorecard_profile_confidence: string | null
  storage_direction: string | null
  active: boolean | null
  sms_opted_out_at: string | null
  /** Set once they became a client. They must never see a cold re-engagement. */
  converted_to_client_id: string | null
}

export type Ineligible =
  | 'already_a_client'
  | 'no_email'
  | 'internal_or_test'
  | 'inactive'
  | 'no_body_state'
  | 'invalid_body_state'

export function ineligibleReason(lead: DormantCandidate): Ineligible | null {
  // First, because it is the most embarrassing one to get wrong. A lead can be
  // converted and still be sitting on an old status, which is how a former
  // client turned up in the first dry run of a cold reactivation sequence.
  if (lead.converted_to_client_id) return 'already_a_client'

  const email = lead.email?.trim()
  if (!email) return 'no_email'

  if (BLOCKED_EMAIL_PATTERNS.some(re => re.test(email))) return 'internal_or_test'
  if (lead.name && BLOCKED_NAME_PATTERNS.some(re => re.test(lead.name as string))) return 'internal_or_test'

  if (lead.active === false) return 'inactive'

  if (!lead.scorecard_body_state) return 'no_body_state'
  if (!VALID_STATES.includes(lead.scorecard_body_state as StateName)) return 'invalid_body_state'

  return null
}

export const INELIGIBLE_LABELS: Record<Ineligible, string> = {
  already_a_client: 'Already converted to a client',
  no_email: 'No email address',
  internal_or_test: 'Internal or test record',
  inactive: 'Marked inactive',
  no_body_state: 'No body state, so there is no read to send',
  invalid_body_state: 'Body state is not one of the three valid values',
}
