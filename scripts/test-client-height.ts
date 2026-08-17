/**
 * Tests for height resolution.
 *
 *   npm run test:height
 *
 * The rule under test: height lives on the baseline (as measured, per capture)
 * AND on the client record (the standing figure, which is the only source that
 * exists for a client who has never submitted a baseline). Most recent wins,
 * baseline on a tie, and an implausible value is refused rather than passed to
 * a BMR equation.
 */
import { resolveHeightCm, toHeightCm, heightPromptLine } from '../src/lib/client-height'

let failed = 0, passed = 0
function check(name: string, cond: boolean, detail?: string) {
  if (cond) { passed++; console.log(`  PASS  ${name}`) }
  else { failed++; console.log(`  FAIL  ${name}${detail ? `\n        ${detail}` : ''}`) }
}

console.log('\nCOERCION')
{
  check('postgres numeric string coerces', toHeightCm('172.50') === 172.5)
  check('number passes through', toHeightCm(172) === 172)
  check('null stays null', toHeightCm(null) === null)
  check('empty string stays null', toHeightCm('') === null)
  check('nonsense stays null', toHeightCm('abc') === null)
  // The unit error this is really guarding against.
  check('feet typed as 5.9 is refused', toHeightCm(5.9) === null)
  check('inches typed as 69 is refused', toHeightCm(69) === null)
  check('millimetres typed as 1720 is refused', toHeightCm(1720) === null)
}

console.log('\nNEITHER SOURCE')
{
  const r = resolveHeightCm({})
  check('null height', r.heightCm === null)
  check('no source', r.source === null)
  check('prompt line says an estimate is not possible', /not possible/.test(heightPromptLine(r)))
  check('prompt line forbids guessing', /rather than guessing/.test(heightPromptLine(r)))
}

console.log('\nONE SOURCE ONLY')
{
  // The case that motivated the whole change: no baseline on file at all.
  const clientOnly = resolveHeightCm({
    clientHeightCm: 178, clientHeightRecordedAt: '2026-08-17T00:00:00Z', clientHeightSource: 'coach',
  })
  check('client record alone is used', clientOnly.heightCm === 178 && clientOnly.source === 'client_record')
  check('provenance names the coach', /coach/.test(clientOnly.label ?? ''))

  const baselineOnly = resolveHeightCm({ baselineHeightCm: '165', baselineCapturedAt: '2026-05-10T00:00:00Z' })
  check('baseline alone is used', baselineOnly.heightCm === 165 && baselineOnly.source === 'baseline')
  check('provenance names the capture date', /2026-05-10/.test(baselineOnly.label ?? ''))

  // A baseline captured before the height field existed holds null, so the
  // client record must win rather than the resolver returning nothing.
  const staleBaseline = resolveHeightCm({
    clientHeightCm: 178, clientHeightRecordedAt: '2026-08-17T00:00:00Z', clientHeightSource: 'coach',
    baselineHeightCm: null, baselineCapturedAt: '2026-05-10T00:00:00Z',
  })
  check('null baseline height does not beat a real client height', staleBaseline.heightCm === 178)
}

console.log('\nBOTH SOURCES — MOST RECENT WINS')
{
  const clientNewer = resolveHeightCm({
    clientHeightCm: 178, clientHeightRecordedAt: '2026-08-17T00:00:00Z',
    baselineHeightCm: 165, baselineCapturedAt: '2026-05-10T00:00:00Z',
  })
  check('newer client record wins', clientNewer.heightCm === 178 && clientNewer.source === 'client_record')

  const baselineNewer = resolveHeightCm({
    clientHeightCm: 178, clientHeightRecordedAt: '2026-05-01T00:00:00Z',
    baselineHeightCm: 165, baselineCapturedAt: '2026-08-10T00:00:00Z',
  })
  check('newer baseline wins', baselineNewer.heightCm === 165 && baselineNewer.source === 'baseline')

  const tie = resolveHeightCm({
    clientHeightCm: 178, clientHeightRecordedAt: '2026-08-10T00:00:00Z',
    baselineHeightCm: 165, baselineCapturedAt: '2026-08-10T00:00:00Z',
  })
  check('a tape measure beats a recollection on a tie', tie.source === 'baseline')

  const undatedClient = resolveHeightCm({
    clientHeightCm: 178, clientHeightRecordedAt: null,
    baselineHeightCm: 165, baselineCapturedAt: '2026-05-10T00:00:00Z',
  })
  check('a dated baseline beats an undated client record', undatedClient.source === 'baseline')

  const undatedBaseline = resolveHeightCm({
    clientHeightCm: 178, clientHeightRecordedAt: '2026-05-10T00:00:00Z',
    baselineHeightCm: 165, baselineCapturedAt: null,
  })
  check('a dated client record beats an undated baseline', undatedBaseline.source === 'client_record')
}

console.log('\nIMPLAUSIBLE VALUES NEVER REACH A BMR')
{
  // If a bad value ever landed in either column, the good one must still win
  // rather than the bad one being preferred for being newer.
  const r = resolveHeightCm({
    clientHeightCm: 5.9, clientHeightRecordedAt: '2026-08-17T00:00:00Z',
    baselineHeightCm: 165, baselineCapturedAt: '2026-05-10T00:00:00Z',
  })
  check('an implausible newer value is discarded, not preferred', r.heightCm === 165 && r.source === 'baseline')

  const both = resolveHeightCm({ clientHeightCm: 5.9, baselineHeightCm: 1720 })
  check('two implausible values give null, not a guess', both.heightCm === null)
}

console.log('\nPROMPT LINE')
{
  const r = resolveHeightCm({ baselineHeightCm: 165, baselineCapturedAt: '2026-05-10T00:00:00Z' })
  const line = heightPromptLine(r)
  check('states the number', /165cm/.test(line), line)
  check('states the provenance', /baseline/.test(line), line)
}

console.log(`\n${passed} passed, ${failed} failed\n`)
process.exit(failed > 0 ? 1 : 0)
