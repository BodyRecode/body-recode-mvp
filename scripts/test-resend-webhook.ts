/**
 * The Resend webhook writes to the database from a public endpoint, so the
 * signature check is the only thing standing in front of it.
 *
 *   npx tsx scripts/test-resend-webhook.ts
 */
import crypto from 'crypto'
import { verifySvixSignature } from '../src/app/api/webhooks/resend/route'

let passed = 0, failed = 0
const check = (name: string, cond: boolean) => {
  if (cond) { passed++; console.log(`  PASS  ${name}`) } else { failed++; console.log(`  FAIL  ${name}`) }
}

const secret = 'whsec_' + Buffer.from('a-test-signing-secret-of-some-length').toString('base64')
const body = JSON.stringify({ type: 'email.bounced', data: { email_id: 'abc', to: ['kim@example.com'] } })
const id = 'msg_2abc'
const now = String(Math.floor(Date.now() / 1000))
const sign = (sec: string, i: string, t: string, b: string) =>
  'v1,' + crypto.createHmac('sha256', Buffer.from(sec.replace(/^whsec_/, ''), 'base64')).update(`${i}.${t}.${b}`).digest('base64')

console.log('\nRESEND WEBHOOK SIGNATURE')
check('a correctly signed request is accepted', verifySvixSignature(secret, id, now, body, sign(secret, id, now, body)))
check('a tampered body is rejected', !verifySvixSignature(secret, id, now, body + ' ', sign(secret, id, now, body)))
check('a different signing secret is rejected',
  !verifySvixSignature(secret, id, now, body, sign('whsec_' + Buffer.from('another-secret-entirely').toString('base64'), id, now, body)))
check('a replayed message id is rejected', !verifySvixSignature(secret, 'msg_other', now, body, sign(secret, id, now, body)))
const old = String(Math.floor(Date.now() / 1000) - 60 * 60)
check('an hour-old timestamp is rejected even when correctly signed', !verifySvixSignature(secret, id, old, body, sign(secret, id, old, body)))
check('garbage in the signature header is rejected', !verifySvixSignature(secret, id, now, body, 'not-a-signature'))
check('an empty signature header is rejected', !verifySvixSignature(secret, id, now, body, ''))
check('multiple signatures are accepted when one matches',
  verifySvixSignature(secret, id, now, body, `v1,ZmFrZQ== ${sign(secret, id, now, body)}`))

console.log(`\n${passed} passed, ${failed} failed\n`)
process.exit(failed > 0 ? 1 : 0)
