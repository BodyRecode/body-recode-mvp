/**
 * Eighteen client reads were published carrying the words we use ABOUT a client
 * rather than TO them: "your body is currently in a Remediation state".
 *
 * WHY THIS IS A WORD SWAP AND NOT A REGENERATION. Regenerating would rewrite a
 * document the client has already read, possibly discussed with their coach,
 * and the engine has moved on since some of these were written, so the new one
 * could say something materially different. Swapping the word changes what they
 * are called and nothing else about what they were told.
 *
 * IT IS NOT A BLIND FIND AND REPLACE. "in a Remediation state" swaps cleanly.
 * "You're in Remediation" does not: "you're in Depleted" is not a sentence. The
 * phrasings are handled separately so the grammar survives.
 *
 * DRY RUN BY DEFAULT. Pass --write to apply.
 */

import { readFileSync } from 'fs'
import { join } from 'path'
for (const line of readFileSync(join(process.cwd(), '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
import { createClient } from '@supabase/supabase-js'

const PUBLIC: Record<string, string> = {
  Remediation: 'Depleted', Optimisation: 'Transitioning', 'Post-Optimisation': 'Ready',
}
const FIELDS = ['cr_where_you_are', 'cr_what_your_body_is_telling_us', 'cr_what_were_focusing_on_first', 'cr_what_were_not_doing_yet', 'cr_coach_note']
const NAMES = 'Post-Optimisation|Remediation|Optimisation'

function convert(text: string): string {
  let out = text
  // "in a Remediation state" / "a Remediation state" -> the same shape, their word
  out = out.replace(new RegExp(`\\b(${NAMES})(\\s+state)`, 'g'), (_m, n, s) => PUBLIC[n] + s)
  // "a state we call Remediation" -> "... we call Depleted"
  out = out.replace(new RegExp(`\\b(call(?:ed)?\\s+)(${NAMES})\\b`, 'gi'), (_m, c, n) => c + PUBLIC[n])
  // "in Remediation" with no "state" after it -> "in a Depleted state", or it
  // reads as "in Depleted", which is not a sentence.
  out = out.replace(new RegExp(`\\bin\\s+(${NAMES})\\b(?!\\s+state)`, 'g'), (_m, n) => `in a ${PUBLIC[n]} state`)
  // anything left standing alone
  out = out.replace(new RegExp(`\\b(${NAMES})\\b`, 'g'), (_m, n) => PUBLIC[n])
  // The internal names for the documents themselves.
  out = out.replace(/\bCFFS\b/g, 'your coach’s version of your read').replace(/\bCFWS\b/g, 'your weekly read')
  out = out.replace(/\bIndeterminate\b/g, 'not yet clear')
  return out
}

async function main() {
  const write = process.argv.includes('--write')
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await admin
    .from('cffs')
    .select(`id, client_id, ${FIELDS.join(', ')}, clients!inner(name, email)`)
    .not('client_reading_published_at', 'is', null)

  let reads = 0, edits = 0
  for (const row of (data ?? []) as unknown as Record<string, unknown>[]) {
    const who = (row.clients as { name: string; email: string })
    const patch: Record<string, string> = {}
    for (const f of FIELDS) {
      const before = (row[f] as string | null) ?? ''
      if (!before) continue
      const after = convert(before)
      if (after === before) continue
      patch[f] = after
      edits++
      for (const s of before.split(/(?<=\.)\s+/)) {
        if (!new RegExp(`\\b(${NAMES}|CFFS|CFWS|Indeterminate)\\b`).test(s)) continue
        console.log(`\n${who.name}  ·  ${f}`)
        console.log(`  was:  ${s.trim()}`)
        console.log(`  now:  ${convert(s).trim()}`)
      }
    }
    if (Object.keys(patch).length === 0) continue
    reads++
    if (write) {
      const { error } = await admin.from('cffs').update(patch).eq('id', row.id as string)
      if (error) console.log(`  FAILED ${who.name}: ${error.message}`)
    }
  }
  console.log(`\n${edits} passages across ${reads} published reads.`)
  console.log(write ? 'Applied.' : 'DRY RUN. Nothing changed. Pass --write to apply.\n')
}
main().catch(e => { console.error(e); process.exit(1) })
