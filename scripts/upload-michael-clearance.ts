// One-off: upload Michael's signed medical clearance PDF on his behalf.
// Mirrors what /api/portal/upload-clearance would do if Michael uploaded via portal.
// Does NOT approve — Kade approves via the dashboard so the email/audit-log fires cleanly.
//
// Run with: set -a && source .env.local && set +a && npx tsx scripts/upload-michael-clearance.ts

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const CLIENT_ID = 'adab9ab4-e678-4879-92e5-d962d6593ca4'
const PDF_PATH = join(
  homedir(),
  'Dropbox/01_BODY_RECODE/10_CLIENT_RECORDS/Michael_Mailloux/01_Medical_Clearance/Michael_Mailloux_Medical_Clearance.pdf'
)

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing env')
    process.exit(1)
  }

  const supabase = createClient(url, key)

  const { data: existing, error: fetchErr } = await supabase
    .from('clients')
    .select('id, name, email, medical_clearance_required, medical_clearance_submitted_at, medical_clearance_received_at, medical_clearance_doc_url')
    .eq('id', CLIENT_ID)
    .single()

  if (fetchErr || !existing) {
    console.error('Client not found:', fetchErr)
    process.exit(1)
  }

  if (!existing.medical_clearance_required) {
    console.error('Refusing: clearance is not flagged as required for this client.')
    process.exit(1)
  }
  if (existing.medical_clearance_received_at) {
    console.error('Refusing: clearance already approved on', existing.medical_clearance_received_at)
    process.exit(1)
  }
  if (existing.medical_clearance_submitted_at) {
    console.error('Already submitted on', existing.medical_clearance_submitted_at, '— refusing to overwrite. Existing doc path:', existing.medical_clearance_doc_url)
    process.exit(1)
  }

  const buffer = readFileSync(PDF_PATH)
  const path = `${CLIENT_ID}/${Date.now()}_clearance.pdf`

  console.log('Uploading', PDF_PATH, '(', buffer.length, 'bytes) →', path)

  const { error: uploadError } = await supabase.storage
    .from('clearance-docs')
    .upload(path, buffer, { contentType: 'application/pdf', upsert: false })

  if (uploadError) {
    console.error('Upload failed:', uploadError)
    process.exit(1)
  }

  const { error: updateError } = await supabase
    .from('clients')
    .update({
      medical_clearance_doc_url: path,
      medical_clearance_submitted_at: new Date().toISOString(),
    })
    .eq('id', CLIENT_ID)

  if (updateError) {
    console.error('Client update failed:', updateError)
    process.exit(1)
  }

  console.log('✓ PDF uploaded and submitted_at set.')
  console.log('Next: approve via dashboard to fire the approval email + unlock portal:')
  console.log('  https://app.bodyrecode.au/dashboard/clients/' + CLIENT_ID + '/medical-clearance')
}

main()
