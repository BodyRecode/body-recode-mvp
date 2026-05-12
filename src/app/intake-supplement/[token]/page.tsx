import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import SupplementForm from './supplement-form'

/**
 * Supplementary intake form. Asks only the questions added to the intake
 * AFTER the client originally submitted. Currently five fields:
 *
 *   1. medications              (longitudinal -> clients.medications)
 *   2. dietary_restrictions     (per-intake  -> intakes.dietary_restrictions)
 *   3. dietary_preferences      (per-intake  -> intakes.dietary_preferences)
 *   4. typical_day_eating       (per-intake  -> intakes.typical_day_eating)
 *   5. eating_context           (per-intake  -> intakes.eating_context, optional)
 *
 * The form is single-page (no multi-section wizard). Token must be on a
 * supplementary invitation, status pending. Pre-fills from the existing
 * intake row if any of the fields are already populated (e.g. if the
 * client was sent the form twice).
 */
export default async function SupplementaryIntakePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const admin = createAdminClient()

  // Validate the invitation. Must be supplementary + pending.
  const { data: invitation } = await admin
    .from('intake_invitations')
    .select('id, client_id, status, kind')
    .eq('token', token)
    .eq('kind', 'supplementary')
    .maybeSingle()

  if (!invitation) return notFound()

  if (invitation.status === 'complete') {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-200 flex items-center justify-center px-6 py-12">
        <div className="max-w-md text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-teal.png" alt="Body Recode" className="h-10 w-auto mx-auto mb-8" />
          <h1 className="text-2xl font-semibold text-white mb-3">Thanks, this is already in.</h1>
          <p className="text-stone-400 text-sm leading-relaxed">
            You have already submitted this follow-up intake. Nothing more to do. Kade has your updated answers.
          </p>
        </div>
      </div>
    )
  }

  // Fetch the client + their most recent intake so we can pre-fill any
  // fields that already have answers (rare, but possible if the client
  // was previously asked or the coach typed something in).
  const { data: client } = await admin
    .from('clients')
    .select('id, name, medications')
    .eq('id', invitation.client_id)
    .single()

  if (!client) return notFound()

  const { data: latestIntake } = await admin
    .from('intakes')
    .select('id, dietary_restrictions, dietary_preferences, typical_day_eating, eating_context')
    .eq('client_id', invitation.client_id)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <SupplementForm
      token={token}
      clientName={client.name}
      initial={{
        medications: client.medications ?? '',
        dietary_restrictions: latestIntake?.dietary_restrictions ?? '',
        dietary_preferences: latestIntake?.dietary_preferences ?? '',
        typical_day_eating: latestIntake?.typical_day_eating ?? '',
        eating_context: latestIntake?.eating_context ?? '',
      }}
    />
  )
}
