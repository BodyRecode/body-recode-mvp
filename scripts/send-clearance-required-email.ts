// One-off backfill: send the "medical clearance required" client email to
// any clients flagged before the auto-email shipped (2026-05-12).
//
// Usage:
//   npx tsx scripts/send-clearance-required-email.ts <clientId>
//
// Safety:
//   - Refuses to send if medical_clearance_required is not true
//   - Refuses to send if medical_clearance_received_at is already set
//   - Refuses to re-send if a 'medical_clearance_required' row already exists
//     in client_communications for this client (override with --force)
//   - Prints the resolved client and exits non-zero on any guard failure

// Env loaded by caller: `set -a && source .env.local && set +a && npx tsx ...`
import { createClient } from '@supabase/supabase-js'
import { sendMedicalClearanceRequiredEmail } from '../src/lib/medical-clearance-required-email'

async function main() {
  const clientId = process.argv[2]
  const force = process.argv.includes('--force')
  if (!clientId) {
    console.error('Usage: tsx scripts/send-clearance-required-email.ts <clientId> [--force]')
    process.exit(1)
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env')
    process.exit(1)
  }

  const admin = createClient(url, key)

  const { data: client, error } = await admin
    .from('clients')
    .select('id, name, email, onboarding_token, medical_clearance_required, medical_clearance_received_at')
    .eq('id', clientId)
    .maybeSingle()

  if (error || !client) {
    console.error('Client not found:', error)
    process.exit(1)
  }

  console.log('Resolved client:', {
    id: client.id,
    name: client.name,
    email: client.email,
    onboarding_token: client.onboarding_token,
    medical_clearance_required: client.medical_clearance_required,
    medical_clearance_received_at: client.medical_clearance_received_at,
  })

  if (!client.medical_clearance_required) {
    console.error('Refusing: medical_clearance_required is not true.')
    process.exit(1)
  }
  if (client.medical_clearance_received_at) {
    console.error('Refusing: clearance already approved.')
    process.exit(1)
  }
  if (!client.email || !client.onboarding_token) {
    console.error('Refusing: missing email or onboarding_token.')
    process.exit(1)
  }

  if (!force) {
    const { data: prior } = await admin
      .from('client_communications')
      .select('id, sent_at')
      .eq('client_id', client.id)
      .eq('kind', 'medical_clearance_required')
      .limit(1)
    if (prior && prior.length > 0) {
      console.error('Refusing: a clearance-required email was already logged for this client at',
        prior[0].sent_at, '— pass --force to re-send.')
      process.exit(1)
    }
  }

  const sent = await sendMedicalClearanceRequiredEmail({
    admin,
    client: {
      id: client.id,
      name: client.name ?? '',
      email: client.email,
      onboarding_token: client.onboarding_token,
    },
    trigger: 'manual_backfill',
  })

  if (!sent) {
    console.error('Helper returned false. Check RESEND_API_KEY and client email/token.')
    process.exit(1)
  }

  console.log('✓ Sent clearance-required email to', client.email)
}

main().catch(e => { console.error(e); process.exit(1) })
