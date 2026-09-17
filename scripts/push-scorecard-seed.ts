/**
 * Push the scorecard sequence copy from src/lib/scorecard-sequence.ts to the
 * LIVE be_workflow_steps rows, then verify with scripts/verify-scorecard-seed.ts.
 *
 * The seed file is the single definition (feedback_sequence_seed_live); this is
 * the direction "file -> live", for when the copy is edited in code rather than
 * in the builder UI.
 */
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import { scorecardSteps } from '../src/lib/scorecard-sequence'

const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split('\n')
  .filter(l => l.includes('=') && !l.startsWith('#'))
  .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] }))

const WORKFLOW_ID = '964d207e-34c1-4c54-be4a-0e49b171d366'

async function main() {
  const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!)
  for (const step of scorecardSteps()) {
    if (step.type !== 'action') continue
    const { error } = await s.from('be_workflow_steps')
      .update({ config: step.config })
      .eq('workflow_id', WORKFLOW_ID)
      .eq('position', step.position)
    console.log(`${step.position}  ${error ? `ERROR ${error.message}` : 'updated'}`)
  }
}

main()
