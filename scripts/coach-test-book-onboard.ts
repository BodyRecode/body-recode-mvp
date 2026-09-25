/**
 * Walks a seeded test client through onboarding so the ONGOING portal can be
 * looked at.
 *
 * WHY. The test book seeds published reads but no agreement, health
 * declaration, intake or baseline — so every seeded client sits on the day-one
 * checklist forever, and the portal a real client actually lives in, for weeks
 * and months, could not be seen by anybody. Judging the portal on the
 * onboarding screen is how you end up redesigning something that works.
 *
 * It sets the records that make onboarding complete. Nothing here invents
 * clinical content: the read was already seeded.
 *
 *   npx tsx scripts/coach-test-book-onboard.ts                  all of them
 *   npx tsx scripts/coach-test-book-onboard.ts "Sarah Reid"     just one
 *   npx tsx scripts/coach-test-book-onboard.ts --undo           back to day one
 */

import { readFileSync } from 'fs'
import { join } from 'path'
for (const line of readFileSync(join(process.cwd(), '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
import { createClient } from '@supabase/supabase-js'

async function main() {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const undo = process.argv.includes('--undo')
  const only = process.argv.slice(2).find(a => !a.startsWith('--')) ?? null

  let q = admin.from('clients').select('id, name, email, onboarding_token').like('email', '%testbook%')
  const { data: clients } = await q
  const targets = (clients ?? []).filter(c => !only || c.name === only)
  if (targets.length === 0) { console.log('No seeded clients matched. Run npm run coach:test-book first.'); return }

  for (const c of targets) {
    if (undo) {
      await admin.from('clients').update({
        agreement_accepted_at: null, agreement_accepted_name: null,
        health_declaration_submitted_at: null, bloodwork_arranged_at: null,
      }).eq('id', c.id)
      await admin.from('baselines').delete().eq('client_id', c.id)
      await admin.from('intake_invitations').delete().eq('client_id', c.id)
      console.log(`  back to day one   ${c.name}`)
      continue
    }

    const when = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()

    await admin.from('clients').update({
      agreement_accepted_at: when,
      agreement_accepted_name: c.name,
      health_declaration_submitted_at: when,
      bloodwork_arranged_at: when,
    }).eq('id', c.id)

    const { data: inv } = await admin.from('intake_invitations')
      .select('id').eq('client_id', c.id).eq('kind', 'foundational').maybeSingle()
    if (inv) {
      await admin.from('intake_invitations').update({ status: 'complete' }).eq('id', inv.id)
    } else {
      await admin.from('intake_invitations').insert({
        client_id: c.id, kind: 'foundational', status: 'complete',
        token: crypto.randomUUID(), created_at: when,
      })
    }

    const { count } = await admin.from('baselines')
      .select('id', { count: 'exact', head: true }).eq('client_id', c.id)
    if (!count) {
      await admin.from('baselines').insert({ client_id: c.id, created_at: when })
    }

    console.log(`  onboarded         ${c.name}`)
    console.log(`                    /portal/${c.onboarding_token}`)
  }
}
main().catch(e => { console.error(e); process.exit(1) })
