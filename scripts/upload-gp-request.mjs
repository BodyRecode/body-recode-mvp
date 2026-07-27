/**
 * Publish a client's "Blood Test Request - For My GP" PDF to their portal.
 *
 * The GP request is the personal half of the two-doc bloodwork split: the
 * general education pack ("Understanding your baseline bloodwork") is
 * gender-gated and shared, while this one names the client and reflects their
 * own history. It is written by hand in
 * ~/Dropbox/01_BODY_RECODE/10_CLIENT_RECORDS/<Name>/ and built to PDF with
 * the BR ops pipeline (_pdf_build/build-br-ops-pdf.sh).
 *
 * This script is the last step: it uploads that PDF to the private
 * library-assets bucket at gp-requests/<client_id>.pdf. The portal probes
 * that path — the file existing IS what makes the card appear in the client's
 * Health Markers section, so there is nothing to flip in the database.
 *
 * Usage:
 *   node --env-file=.env.local scripts/upload-gp-request.mjs <client-email> <path-to-pdf>
 *
 * Example:
 *   node --env-file=.env.local scripts/upload-gp-request.mjs \
 *     dragonkindred@optusnet.com.au \
 *     ~/Dropbox/01_BODY_RECODE/10_CLIENT_RECORDS/Vicki_Snowdon/Blood_Test_Request_for_GP.pdf
 *
 * To un-publish, delete gp-requests/<client_id>.pdf from the bucket.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'

const [email, pdfPath] = process.argv.slice(2)

if (!email || !pdfPath) {
  console.error('Usage: node --env-file=.env.local scripts/upload-gp-request.mjs <client-email> <path-to-pdf>')
  process.exit(1)
}

const resolved = pdfPath.startsWith('~') ? pdfPath.replace(/^~/, process.env.HOME) : pdfPath
if (!existsSync(resolved)) {
  console.error(`PDF not found: ${resolved}`)
  process.exit(1)
}

const buf = readFileSync(resolved)
if (buf.subarray(0, 4).toString('ascii') !== '%PDF') {
  console.error(`Not a PDF (missing %PDF header): ${resolved}`)
  process.exit(1)
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

const { data: client, error: clientErr } = await admin
  .from('clients')
  .select('id, name, email')
  .ilike('email', email)
  .maybeSingle()

if (clientErr) {
  console.error('Lookup failed:', clientErr.message)
  process.exit(1)
}
if (!client) {
  console.error(`No client found with email: ${email}`)
  process.exit(1)
}

const path = `gp-requests/${client.id}.pdf`
const { error: uploadErr } = await admin.storage
  .from('library-assets')
  .upload(path, buf, { contentType: 'application/pdf', upsert: true })

if (uploadErr) {
  console.error('Upload failed:', uploadErr.message)
  process.exit(1)
}

console.log(`Published GP request for ${client.name} (${client.email})`)
console.log(`  ${Math.round(buf.length / 1024)}KB -> library-assets/${path}`)
console.log('  It now appears in their portal under Health Markers.')
