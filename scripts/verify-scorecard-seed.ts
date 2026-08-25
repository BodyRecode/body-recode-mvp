/**
 * Proves src/lib/scorecard-sequence.ts regenerates the LIVE be_workflow_steps
 * rows exactly. If this fails, the nightly health check will report drift and
 * its suggested Re-sync will overwrite whichever copy is newer.
 */
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import { scorecardSteps } from '../src/lib/scorecard-sequence'

const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split('\n')
  .filter(l => l.includes('=') && !l.startsWith('#'))
  .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] }))

async function main() {
  const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: live } = await s.from('be_workflow_steps')
    .select('position,type,action_type,config')
    .eq('workflow_id', '964d207e-34c1-4c54-be4a-0e49b171d366')
    .order('position')

  const code = scorecardSteps()
  let bad = 0
  console.log(`live ${live?.length} steps · code ${code.length} steps`)
  if (live?.length !== code.length) { console.log('*** STEP COUNT DIFFERS'); bad++ }

  for (const c of code) {
    const l = (live ?? []).find(x => x.position === c.position)
    if (!l) { console.log(`  ${c.position}  *** MISSING LIVE ROW`); bad++; continue }
    const fields = c.type === 'wait' ? ['unit', 'amount'] : ['subject', 'body']
    const diffs = fields.filter(f => (c.config as Record<string, unknown>)[f] !== (l.config as Record<string, unknown>)[f])
    const label = c.type === 'wait' ? `wait ${(c.config as { amount?: string }).amount}d` : String((c.config as { subject?: string }).subject).slice(0, 46)
    if (diffs.length) { bad++; console.log(`  ${c.position}  *** DIFFERS on ${diffs.join(', ')}  ${label}`) }
    else console.log(`  ${c.position}  match   ${label}`)
  }
  console.log(bad === 0 ? '\nSEED MATCHES LIVE' : `\n${bad} DIFFERENCES`)
}
main()
