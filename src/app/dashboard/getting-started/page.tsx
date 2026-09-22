import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Check } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireCoachScope, coachFilter } from '@/lib/coach-scope'
import { PageHeader, PageBody, SectionHead } from '@/components/dashboard/ui'
import { BRAND } from '@/lib/brand-tokens'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Setup' }

/**
 * Setup, for a coach on the interpretation product.
 *
 * 22 September 2026, rebuilt. Kade asked what setup should actually involve,
 * and the honest answer is NOTHING TO CONFIGURE, which is why the page it
 * replaces was wrong in almost every line.
 *
 * WHAT IT USED TO ASK FOR, and why each is wrong for a pilot coach:
 *
 *   Your brand shell       white-label. The pilot is Body Recode branded only
 *   Voice + coaching       presets for yoga, powerlifting, rehab, and tuning
 *                          for "programme and nutrition generation". That is
 *                          PRESCRIPTION, which this product does not include
 *   Stripe Connect         the pilot is free
 *   SMS number             not in the pilot
 *   Custom domain          white-label. Out
 *
 * Five of seven steps were for a product they are not buying, and the first
 * thing the product said to a new coach was "here are five things you have not
 * done" about work that was never theirs. It also called them STUDENTS, said
 * "she completes intake" on a deliberately universal product, described "her
 * first block" which is prescription, and carried an eyebrow reading "the
 * Collective", a partner programme a pilot coach is not in.
 *
 * THERE IS GENUINELY NOTHING TO SET UP. No branding, no payments, no domain,
 * no SMS, no prescription to tune, and a coach's own name reaches a client
 * nowhere. So this is not a configuration checklist. It is the FIRST CLIENT'S
 * JOURNEY, which is the thing the pilot exists to prove, and every step reads
 * its own state from real rows rather than from a box somebody ticked.
 *
 * IT RETIRES ITSELF. Once the loop has run once the page has nothing left to
 * say, so it says so and points at the work instead of sitting there for ever
 * announcing that you are all set.
 */
export default async function SetupPage() {
  const scope = await requireCoachScope()
  if (!scope) redirect('/login')
  const admin = createAdminClient()
  const filter = coachFilter(scope)

  let q = admin.from('clients').select('id, name').is('ended_at', null)
  if (filter) q = q.eq('coach_id', filter)
  const { data: clients } = await q
  const ids = (clients ?? []).map(c => c.id as string)

  const [intakes, reads, checkins] = ids.length
    ? await Promise.all([
        admin.from('intakes').select('client_id').in('client_id', ids).not('submitted_at', 'is', null),
        admin.from('cffs').select('client_id, client_reading_email_sent_at').in('client_id', ids).eq('is_archived', false),
        admin.from('weekly_checkin_feedback').select('weekly_checkin_id').in('client_id', ids).limit(1),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }]

  const haveClient = ids.length > 0
  const haveIntake = (intakes.data ?? []).length > 0
  const haveSentRead = (reads.data ?? []).some(r => r.client_reading_email_sent_at)
  const haveReadCheckin = (checkins.data ?? []).length > 0

  const steps = [
    {
      title: 'Add your first client',
      done: haveClient,
      href: '/dashboard/clients/new',
      action: 'Add a client',
      why: 'A name and an email. You get a link to send them, and nothing happens until they use it.',
      state: haveClient ? `${ids.length} on your book` : null,
    },
    {
      title: 'They finish the assessment',
      done: haveIntake,
      href: '/dashboard/coaching',
      action: 'See who has started',
      why: 'This is the long one, and it is the whole basis of the read. Nothing to do at your end except wait for it.',
      state: haveIntake ? `${(intakes.data ?? []).length} finished` : haveClient ? 'Waiting on them' : null,
    },
    {
      title: 'Generate their read, and send it',
      done: haveSentRead,
      href: '/dashboard/today',
      action: 'Open Today',
      why: 'The assessment comes back as a written interpretation. You read it first, then publish it to them.',
      state: haveSentRead ? 'Sent' : haveIntake ? 'Ready to generate' : null,
    },
    {
      title: 'Read their first weekly check-in',
      done: haveReadCheckin,
      href: '/dashboard/checkins',
      action: 'Open Check Ins',
      why: 'Every week they report, and it is read against where they started rather than against a target. This is the loop the product runs on.',
      state: haveReadCheckin ? 'Done' : haveSentRead ? 'Waiting on their first' : null,
    },
  ]

  const done = steps.filter(s => s.done).length
  const allDone = done === steps.length

  return (
    <PageBody>
      <PageHeader
        eyebrow="Setup"
        title={allDone ? 'Nothing left to set up' : 'Your first client'}
        subtitle={allDone
          ? 'The loop has run end to end. This page has nothing left to tell you, so it will stop showing up.'
          : 'There is nothing to configure. The only setup that matters is getting one client all the way through, which is what these four steps are.'}
        metric={allDone ? undefined : { value: `${done}/4`, label: 'done' }}
      />

      <SectionHead title={allDone ? 'What you did' : 'The four steps'} />

      {steps.map((s, i) => (
        <div
          key={s.title}
          className="grid gap-4 items-start py-5 border-b"
          style={{ gridTemplateColumns: '28px 1fr max-content', borderColor: BRAND.darkLineSoft, opacity: s.done ? 0.62 : 1 }}
        >
          <span
            className="mt-[3px] w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0"
            style={s.done
              ? { background: BRAND.darkInk, color: BRAND.darkWell }
              : { border: `1px solid ${BRAND.darkLine}`, color: BRAND.darkInkSoft }}
          >
            {s.done ? <Check size={13} strokeWidth={3} /> : i + 1}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[20px] font-bold tracking-[-0.028em] leading-tight" style={{ color: BRAND.darkInk }}>
                {s.title}
              </span>
              {s.state && (
                <span className="text-[10px] font-extrabold uppercase rounded-full px-2 py-[2.5px]"
                  style={{ letterSpacing: '0.1em', color: BRAND.darkInkSoft, background: 'rgba(250,250,248,0.07)' }}>
                  {s.state}
                </span>
              )}
            </div>
            <p className="text-[13.5px] leading-[1.55] mt-1.5 max-w-[620px]" style={{ color: BRAND.darkInkMuted }}>
              {s.why}
            </p>
          </div>
          <div className="text-right shrink-0">
            {!s.done && (
              <Link href={s.href} className="inline-block text-[12.5px] font-bold rounded-lg px-3.5 py-[7px]"
                style={{ background: BRAND.darkInk, color: BRAND.darkWell }}>
                {s.action}
              </Link>
            )}
          </div>
        </div>
      ))}

      <p className="text-[12.5px] mt-7 max-w-[620px]" style={{ color: BRAND.darkInkFaint }}>
        {allDone
          ? 'Everything else lives on Today, which shows you who needs you and why.'
          : 'No branding, no payments, no domain to wire. The pilot runs on Body Recode, and the read is the product.'}
      </p>
    </PageBody>
  )
}
