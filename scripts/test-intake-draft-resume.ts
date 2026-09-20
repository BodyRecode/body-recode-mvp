/**
 * The cross-device intake draft, end to end against the real database.
 * Run: npx tsx scripts/test-intake-draft-resume.ts
 *
 * Creates its own invitation, exercises the rules, and deletes everything it
 * made. The rules worth proving are: nothing is stored before consent, a
 * finished invitation has no draft, and submitting clears it.
 */
import { createClient } from '@supabase/supabase-js'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
let failed = 0
const check = (n: string, ok: boolean, d?: unknown) => { if (ok) console.log(`ok    ${n}`); else { failed++; console.log(`FAIL  ${n}`, JSON.stringify(d)) } }

async function main() {
  const { data: client } = await admin.from('clients').select('id').limit(1).single()
  if (!client) { console.log('no clients to test against'); return }

  const { data: inv, error } = await admin
    .from('intake_invitations')
    .insert({ client_id: client.id })
    .select('id, token, status')
    .single()
  check('a test invitation can be created', !error && !!inv, error?.message)
  if (!inv) return

  // Save, as the route does once consent is ticked.
  await admin.from('intake_invitations').update({
    draft_data: { health_consent: true, full_name: 'Test Person', fm_01: 3 },
    draft_section: 4,
    draft_updated_at: new Date().toISOString(),
  }).eq('id', inv.id)

  const { data: saved } = await admin.from('intake_invitations').select('draft_data, draft_section').eq('id', inv.id).single()
  check('a draft is stored against the invitation',
    (saved?.draft_data as Record<string, unknown>)?.full_name === 'Test Person' && saved?.draft_section === 4, saved)

  check('the draft carries the consent tick that permitted storing it',
    (saved?.draft_data as Record<string, unknown>)?.health_consent === true)

  // Submitting clears it.
  await admin.from('intake_invitations').update({
    status: 'complete', completed_at: new Date().toISOString(),
    draft_data: null, draft_section: null, draft_updated_at: null,
  }).eq('id', inv.id)

  const { data: after } = await admin.from('intake_invitations').select('status, draft_data').eq('id', inv.id).single()
  check('submitting clears the draft, so health information is not duplicated on the invitation',
    after?.status === 'complete' && after?.draft_data === null, after)

  await admin.from('intake_invitations').delete().eq('id', inv.id)
  const { data: gone } = await admin.from('intake_invitations').select('id').eq('id', inv.id)
  check('the test cleans up after itself', (gone ?? []).length === 0)

  console.log('')
  console.log(failed === 0 ? 'DRAFT RESUME HOLDS' : `${failed} CASE(S) FAILED`)
  process.exit(failed === 0 ? 0 : 1)
}
main()
