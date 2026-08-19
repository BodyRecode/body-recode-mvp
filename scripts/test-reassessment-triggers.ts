import { buildReassessmentDigest, type DigestRow } from '@/lib/reassessment-digest'
import { isOverdue, classifyReason } from '@/lib/reassessment-triggers'

const now = new Date('2026-08-19T00:00:00Z')
const mk = (o: Partial<DigestRow>): DigestRow => ({
  id: o.id ?? 'x', client_id: 'c', reason: (o.reason ?? 'multi_notch_drop') as never,
  trigger_class: (o.trigger_class ?? 'interpretive') as never,
  recommended_depth: (o.recommended_depth ?? 'delta') as never,
  message: o.message ?? 'msg', anchor: 'a', status: 'open',
  fired_at: o.fired_at ?? now.toISOString(), resolved_at: null, resolution_note: null,
  progress_check_id: null, notified_at: o.notified_at ?? null, client_name: o.client_name ?? 'Test',
})
let pass = 0, fail = 0
const t = (name: string, cond: boolean) => { cond ? pass++ : fail++; console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${name}`) }

t('empty input sends nothing', buildReassessmentDigest([], now) === null)
t('all-notified non-overdue sends nothing',
  buildReassessmentDigest([mk({ notified_at: '2026-08-18T00:00:00Z' })], now) === null)

const fresh = buildReassessmentDigest([mk({ client_name: 'Ana' })], now)!
t('fresh trigger produces a digest', !!fresh && fresh.newCount === 1 && fresh.overdueCount === 0)
t('fresh subject has no overdue wording', !fresh.subject.includes('overdue'))
t('client name rendered', fresh.html.includes('Ana'))

const old = mk({ id: 'o', fired_at: '2026-08-05T00:00:00Z', notified_at: '2026-08-06T00:00:00Z', client_name: 'Bo' })
t('8-day-old open trigger is overdue', isOverdue(old, now))
const od = buildReassessmentDigest([old], now)!
t('overdue resurfaces despite being notified', od.overdueCount === 1 && od.newCount === 0)
t('overdue subject says overdue', od.subject.includes('overdue'))

const both = buildReassessmentDigest([old, mk({ id: 'n', client_name: 'Cy' })], now)!
t('mixed digest counts both', both.overdueCount === 1 && both.newCount === 1)
t('mixed returns both ids', both.triggerIds.length === 2)

t('block_end is deterministic', classifyReason('block_end') === 'deterministic')
t('twelve_week_cap is deterministic', classifyReason('twelve_week_cap') === 'deterministic')
t('multi_notch_drop is interpretive', classifyReason('multi_notch_drop') === 'interpretive')
t('sustained_instability is interpretive', classifyReason('sustained_instability') === 'interpretive')
t('resolved trigger never overdue', !isOverdue({ status: 'dismissed', fired_at: '2026-01-01T00:00:00Z' } as never, now))

console.log(`\n  ${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
