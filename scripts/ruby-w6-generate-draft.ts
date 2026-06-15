// One-off: generate Ruby's Week 6 check-in feedback draft for review.
// Does NOT save or send. Prints the three fields to stdout for Kade to
// read and approve. After approval, a sibling script persists + sends.

// Inline .env.local loader (no dotenv dep needed for one-off scripts).
import { readFileSync } from 'fs'
import { resolve } from 'path'
const envText = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
  if (!m) continue
  if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

import { createAdminClient } from '../src/lib/supabase/admin'
import { generateFeedbackDraft } from '../src/lib/weekly-checkin-feedback-generate'

const CHECKIN_ID = 'ee1b27c2-e55a-4c32-9520-1e28cd6d96ac'

async function main() {
  const admin = createAdminClient()
  const result = await generateFeedbackDraft(admin, CHECKIN_ID)

  if (!result.ok) {
    console.error('FAILED:', result.error)
    if (result.leaks?.length) console.error('Leaks:', result.leaks.join(', '))
    process.exit(1)
  }

  const { draft, attempts } = result
  console.log(JSON.stringify({
    attempts,
    interpretation: draft.interpretation,
    reframe: draft.reframe,
    next_focus: draft.next_focus,
  }, null, 2))
}

main().catch(err => {
  console.error('Script crashed:', err)
  process.exit(1)
})
