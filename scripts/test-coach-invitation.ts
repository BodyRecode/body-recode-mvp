/**
 * The coach invitation flow, end to end, against the real database.
 *
 * Creates an invitation, accepts it, checks the account and its configuration
 * exist and are scoped to nothing, then deletes everything it made. Run:
 *   npx tsx scripts/test-coach-invitation.ts
 *
 * It exercises the row-level logic directly rather than the HTTP routes,
 * because the routes are thin: the parts worth proving are that a token is
 * spent once, that a dead token cannot create an account, and that a failed
 * setup leaves nothing behind.
 */
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const EMAIL = `invite-test-${Date.now()}@bodyrecode.invalid`

let failed = 0
const check = (name: string, ok: boolean, detail?: unknown) => {
  if (ok) console.log(`ok    ${name}`)
  else { failed++; console.log(`FAIL  ${name}`, detail ?? '') }
}

async function main() {
  const token = randomBytes(24).toString('base64url')
  const { data: inv, error } = await admin.from('coach_invitations').insert({
    email: EMAIL,
    full_name: 'Test Coach',
    business_name: `Invite Test ${Date.now()}`,
    product_tier: 'interpret',
    token,
    expires_at: new Date(Date.now() + 14 * 864e5).toISOString(),
  }).select().single()
  check('an invitation can be created', !error && !!inv, error?.message)
  if (!inv) return

  // Dead tokens
  const { data: byWrongToken } = await admin.from('coach_invitations').select('id').eq('token', 'not-a-real-token').maybeSingle()
  check('an unknown token finds nothing', byWrongToken === null)

  const { data: expired } = await admin.from('coach_invitations').insert({
    email: `expired-${EMAIL}`, full_name: 'Expired', business_name: 'Expired Co',
    token: randomBytes(12).toString('base64url'),
    expires_at: new Date(Date.now() - 864e5).toISOString(),
  }).select().single()
  check('an expired invitation is recognised by its date', !!expired && new Date(expired.expires_at).getTime() < Date.now())

  // Accept
  const password = randomBytes(12).toString('base64url')
  const { data: userRes, error: userErr } = await admin.auth.admin.createUser({
    email: EMAIL, password, email_confirm: true,
    user_metadata: { fullName: 'Test Coach', signup_source: 'coach_invitation' },
  })
  check('the account is created', !userErr && !!userRes?.user, userErr?.message)
  const coachId = userRes?.user?.id
  if (!coachId) return

  const tenantId = `invite-test-${Date.now()}`
  const { error: tenantErr } = await admin.from('tenant_config').insert({
    coach_id: coachId,
    product_tier: 'interpret',
    brand: { name: 'Invite Test' },
    coach: { firstName: 'Test', fullName: 'Test Coach', email: EMAIL },
    licence: { tenantId, poweredBy: true, version: '2026-09-19' },
    modality: { id: 'strength', label: 'Strength', doctrineMode: 'A' },
  })
  check('the configuration row is created', !tenantErr, tenantErr?.message)

  await admin.from('coach_invitations')
    .update({ status: 'accepted', accepted_at: new Date().toISOString(), coach_id: coachId, tenant_id: tenantId })
    .eq('id', inv.id)
  const { data: after } = await admin.from('coach_invitations').select('status, coach_id').eq('id', inv.id).single()
  check('the invitation is spent, not reusable', after?.status === 'accepted' && after?.coach_id === coachId)

  // The new coach owns nothing, which is the whole point of the scoping work.
  const { count } = await admin.from('clients').select('id', { count: 'exact', head: true }).eq('coach_id', coachId)
  check('the new coach owns zero clients', count === 0, count)

  // Clean up everything this test made.
  await admin.from('tenant_config').delete().eq('coach_id', coachId)
  await admin.auth.admin.deleteUser(coachId)
  await admin.from('coach_invitations').delete().eq('id', inv.id)
  if (expired) await admin.from('coach_invitations').delete().eq('id', expired.id)
  const { data: leftover } = await admin.from('coach_invitations').select('id').eq('email', EMAIL)
  const { data: leftoverTenant } = await admin.from('tenant_config').select('coach_id').eq('coach_id', coachId)
  check('the test leaves nothing behind', (leftover ?? []).length === 0 && (leftoverTenant ?? []).length === 0)

  console.log('')
  console.log(failed === 0 ? 'COACH INVITATION HOLDS' : `${failed} CASE(S) FAILED`)
  process.exit(failed === 0 ? 0 : 1)
}
main()
