/**
 * The paste parser for bulk client import. Run:
 *   npx tsx scripts/test-bulk-import-parse.ts
 *
 * The cases are the shapes people actually paste: a spreadsheet column pair, a
 * copied table with tabs, a header row, names with no email, phone numbers
 * mixed in, and the email-first order some exports use.
 */
import { parseClientList } from '../src/app/api/clients/bulk-import/route'

let failed = 0
const check = (name: string, ok: boolean, detail?: unknown) => {
  if (ok) console.log(`ok    ${name}`)
  else { failed++; console.log(`FAIL  ${name}`, JSON.stringify(detail)) }
}

let r = parseClientList('Sarah Johnson, sarah@example.com\nTom Blake, tom@example.com')
check('comma separated, two clients', r.rows.length === 2 && r.rows[0].name === 'Sarah Johnson' && r.rows[1].email === 'tom@example.com', r.rows)

r = parseClientList('Sarah Johnson\tsarah@example.com\nTom Blake\ttom@example.com')
check('tab separated, as pasted from a spreadsheet', r.rows.length === 2 && r.rows[0].email === 'sarah@example.com', r.rows)

r = parseClientList('Name,Email\nSarah Johnson,sarah@example.com')
check('a header row is not turned into a client', r.rows.length === 1 && r.rows[0].name === 'Sarah Johnson', r.rows)

r = parseClientList('sarah@example.com, Sarah Johnson')
check('email first still works', r.rows.length === 1 && r.rows[0].name === 'Sarah Johnson' && r.rows[0].email === 'sarah@example.com', r.rows)

r = parseClientList('Sarah Johnson, sarah@example.com, +61 400 111 222')
check('a phone number is picked up, not mistaken for a name', r.rows[0].phone === '+61 400 111 222' && r.rows[0].name === 'Sarah Johnson', r.rows)

r = parseClientList('Sarah Johnson')
check('a name with no email is still added', r.rows.length === 1 && r.rows[0].email === null, r.rows)

r = parseClientList('Sarah Johnson, sarah@example.com\n\n\nTom Blake, tom@example.com\n')
check('blank lines are ignored', r.rows.length === 2, r.rows)

r = parseClientList('   \n  ')
check('an empty paste produces nothing', r.rows.length === 0, r.rows)

r = parseClientList('sarah@example.com')
check('an email with no name is reported rather than silently dropped', r.rows.length === 0 && r.skipped.length === 1, r)

r = parseClientList('Sarah Johnson; sarah@example.com')
check('semicolons work too', r.rows.length === 1 && r.rows[0].email === 'sarah@example.com', r.rows)

console.log('')
console.log(failed === 0 ? 'PARSER HOLDS' : `${failed} CASE(S) FAILED`)
process.exit(failed === 0 ? 0 : 1)
