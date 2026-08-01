/**
 * Tests for the short-lived PDF render token.
 *   npm run test:pdf-token
 */
process.env.CRON_SECRET ||= 'test-secret-for-signing'
import { createPdfAccessToken, verifyPdfAccessToken } from '../src/lib/pdf-access-token'

let failed = 0, passed = 0
const check = (n: string, c: boolean, d?: string) => {
  if (c) { passed++; console.log(`  PASS  ${n}`) } else { failed++; console.log(`  FAIL  ${n}${d ? `\n        ${d}` : ''}`) }
}

const PATH = '/dashboard/clients/abc-123/foundational-reading-preview'
const OTHER = '/dashboard/clients/xyz-999/foundational-reading-preview'

console.log('\nPDF ACCESS TOKEN')
const t = createPdfAccessToken(PATH)
check('a fresh token verifies for its own path', verifyPdfAccessToken(t, PATH))
check('it does NOT verify for another client\'s path', !verifyPdfAccessToken(t, OTHER))
check('rubbish is rejected', !verifyPdfAccessToken('nonsense', PATH))
check('empty is rejected', !verifyPdfAccessToken('', PATH) && !verifyPdfAccessToken(null, PATH))
check('a tampered signature is rejected', !verifyPdfAccessToken(t.split('.')[0] + '.deadbeef', PATH))
check('a tampered expiry is rejected', !verifyPdfAccessToken('99999999999.' + t.split('.')[1], PATH))

const past = new Date(Date.now() - 120_000)
check('a token expires', !verifyPdfAccessToken(createPdfAccessToken(PATH, past), PATH))
check('and is valid just before expiry',
  verifyPdfAccessToken(createPdfAccessToken(PATH, new Date(Date.now() - 30_000)), PATH))

console.log(`\n${passed} passed, ${failed} failed\n`)
process.exit(failed > 0 ? 1 : 0)
