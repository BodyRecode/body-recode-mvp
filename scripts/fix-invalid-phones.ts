// Repair phone numbers already stored in an unsendable form.
//
// The enrol form validated only `phone.trim()`, and formatPhone() prefixed a
// '+' to whatever digits it was handed. A dropped leading zero became
// +438672578 - not an Australian number - and every SMS to it failed silently
// with Twilio error 21211 for a month.
//
// Run: npx tsx --env-file=.env.local scripts/fix-invalid-phones.ts [--fix]
import { createClient } from '@supabase/supabase-js'
import { normalisePhone } from '../src/lib/phone'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const FIX = process.argv.includes('--fix')

async function main() {
  const { data, error } = await db.from('leads').select('id, name, phone, phone_e164')
  if (error) { console.log('ERROR', error.message); return }

  const broken: { id: string; name: string; from: string; to: string | null; why: string }[] = []
  for (const l of data ?? []) {
    const raw = (l.phone_e164 || l.phone || '').trim()
    if (!raw) continue
    const r = normalisePhone(raw)
    if (r.ok && r.e164 === raw) continue           // already clean
    broken.push({
      id: l.id, name: l.name ?? '?', from: raw,
      to: r.ok ? r.e164 : null,
      why: r.ok ? (r.corrected ? 'missing leading zero' : 'reformatted') : r.error,
    })
  }

  console.log(`Leads with a phone: ${(data ?? []).filter(l => l.phone || l.phone_e164).length}`)
  console.log(`Not in valid E.164: ${broken.length}\n`)
  for (const b of broken) {
    console.log(`  ${b.name.padEnd(24)} ${b.from.padEnd(16)} -> ${b.to ?? 'UNFIXABLE'}   ${b.why}`)
    if (FIX && b.to) {
      await db.from('leads').update({ phone_e164: b.to, phone: b.to }).eq('id', b.id)
    }
  }
  const fixable = broken.filter(b => b.to).length
  console.log(`\n${FIX ? 'Repaired' : 'Would repair'} ${fixable}. Unfixable (need Kade to ask them): ${broken.length - fixable}`)
  if (!FIX && fixable) console.log('Re-run with --fix to apply.')
}
main()
