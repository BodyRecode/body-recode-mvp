/**
 * Whose name and face go on a client's document.
 *
 * THE PROBLEM KADE ASKED ABOUT, 25 Sep 2026: "the coach section will need to be
 * specific to the coach using the software, it won't be me on all of them".
 *
 * He is right, and it was worse than a missing feature: the read FELL BACK TO
 * HIM. The note at the end of every client's read was signed "Kade Dunstone"
 * with his photograph beside it, whoever the coach actually was, because the
 * component defaulted to him and nothing ever passed anything else.
 *
 * NOTHING NEW HAD TO BE BUILT. Every coach already has a row in tenant_config
 * holding their name, first name, photo, credentials and location — the
 * white-label work put it there. The read simply never asked.
 *
 * THE PHOTO NEVER FALLS BACK. A coach with no photo gets their initials, not
 * somebody else's face. Getting the name wrong is embarrassing; putting another
 * person's photograph on a document signed in their name is worse.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { coach as tenantCoach } from '@/config/tenant'

export interface CoachIdentity {
  fullName: string
  firstName: string
  /** Null when they have not set one. The document shows initials instead. */
  photoUrl: string | null
  credentials: string | null
}

function initialsOf(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export function coachInitials(name: string): string {
  return initialsOf(name) || '?'
}

/** The coach who owns this client, as their client should see them. */
export async function coachIdentityForClient(
  admin: SupabaseClient,
  clientId: string,
): Promise<CoachIdentity> {
  const fallback: CoachIdentity = {
    fullName: tenantCoach().fullName,
    firstName: tenantCoach().firstName,
    photoUrl: tenantCoach().photoUrl || null,
    credentials: tenantCoach().credentials || null,
  }

  try {
    const { data: client } = await admin
      .from('clients').select('coach_id').eq('id', clientId).maybeSingle()
    const coachId = client?.coach_id as string | undefined
    if (!coachId) return fallback

    const { data: tenant } = await admin
      .from('tenant_config').select('coach').eq('coach_id', coachId).maybeSingle()
    const c = tenant?.coach as Record<string, string> | undefined
    if (!c?.fullName) return fallback

    return {
      fullName: c.fullName,
      firstName: c.firstName || c.fullName.split(' ')[0],
      // Empty string is "not set", and not set means initials rather than the
      // owner's face. See the note at the top of this file.
      photoUrl: c.photoUrl?.trim() ? c.photoUrl : null,
      credentials: c.credentials?.trim() ? c.credentials : null,
    }
  } catch {
    return fallback
  }
}

/**
 * Everything one email needs to go out in the right person's name.
 *
 * Resolved ONCE at the send, rather than each builder reaching for the global
 * config — which is how every coaching email ended up signed by Kade. A send
 * site becomes: resolve, then spread.
 *
 *   const who = await coachEmailIdentity(admin, client.id)
 *   resend.emails.send({ from: who.from, replyTo: who.replyTo, ... })
 *   ...darkEmailSignature(who.signature)
 */
export async function coachEmailIdentity(admin: SupabaseClient, clientId: string) {
  const who = await coachIdentityForClient(admin, clientId)
  const { fromCoach } = await import('./email-shell')

  // Their coach's address, so a reply lands with the person responsible for
  // them. This is the half that breaks something real if it is wrong: a client
  // answering a question about their own body should not reach a stranger.
  const replyTo = await coachReplyTo(admin, clientId)

  return {
    from: fromCoach({ firstName: who.firstName }),
    replyTo,
    signature: { fullName: who.fullName, photoUrl: who.photoUrl, credentials: who.credentials },
    firstName: who.firstName,
    fullName: who.fullName,
  }
}

/** The coach's own address, or the tenant's when they have not got one. */
export async function coachReplyTo(admin: SupabaseClient, clientId: string): Promise<string> {
  const { brand } = await import('@/config/tenant')
  try {
    const { data: client } = await admin
      .from('clients').select('coach_id').eq('id', clientId).maybeSingle()
    const coachId = client?.coach_id as string | undefined
    if (!coachId) return brand().replyToEmail

    const { data: tenant } = await admin
      .from('tenant_config').select('coach, brand').eq('coach_id', coachId).maybeSingle()
    const c = tenant?.coach as Record<string, string> | undefined
    const b = tenant?.brand as Record<string, string> | undefined
    return c?.email?.trim() || b?.replyToEmail?.trim() || brand().replyToEmail
  } catch {
    return brand().replyToEmail
  }
}
