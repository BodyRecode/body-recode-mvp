import Link from 'next/link'
import { requireCoachScope } from '@/lib/coach-scope'
import { coachTestimonials } from '@/lib/coach-testimonials'
import { PageHeader, SectionHead, PageBody } from '@/components/dashboard/ui'
import { BRAND } from '@/lib/brand-tokens'
import CopyQuote from './copy-quote'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Testimonials' }

/**
 * What this page is for: a coach who has been asked "does this actually work"
 * and has nothing to hand over but their own opinion.
 *
 * Is it doing it: it holds the words their own clients wrote, already carrying
 * the permission to use them and already named the way the client chose, so
 * there is nothing to check before using one.
 *
 * WHAT IT DELIBERATELY DOES NOT DO: publish anything anywhere. A button that
 * pushes a quote to a website is a button that publishes a real person's words
 * on a misclick. Copying it out is the right amount of friction.
 */
export default async function TestimonialsPage() {
  const scope = await requireCoachScope()
  const rows = await coachTestimonials(scope)

  const received = rows.filter(r => r.state === 'received')
  const waiting = rows.filter(r => r.state === 'waiting')
  const declined = rows.filter(r => r.state === 'declined')

  return (
    <PageBody>
      <PageHeader
        eyebrow="In their words"
        title="Testimonials"
        subtitle={rows.length === 0
          ? 'Nothing asked for yet. Open a client and ask them, and what they write lands here.'
          : `${received.length} you can use${waiting.length > 0 ? `, ${waiting.length} still with the client` : ''}.`}
        metric={received.length > 0 ? { value: received.length, label: 'ready to use' } : undefined}
      />

      {rows.length === 0 && (
        <div className="br-card px-6 py-8">
          <p className="text-[13.5px] leading-relaxed max-w-[620px]" style={{ color: BRAND.darkInkMuted }}>
            The ask sits on a client&apos;s own file. They write a few lines and choose how they want to be
            named, and only then does anything appear here. Nothing is usable until they have said it can be.
          </p>
        </div>
      )}

      {received.length > 0 && (
        <div>
          <SectionHead title="Yours to use" count={received.length} />
          {received.map(t => (
            <div key={t.id} className="py-5 border-b" style={{ borderColor: BRAND.darkLineSoft }}>
              <p className="text-[16px] leading-[1.6] max-w-[760px]" style={{ color: BRAND.darkInk }}>
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3 flex-wrap mt-3">
                <span className="text-[12.5px] font-semibold" style={{ color: BRAND.darkInkMuted }}>
                  &mdash; {t.attribution}
                </span>
                <span className="text-[11px]" style={{ color: BRAND.darkInkFaint }}>
                  their choice of name
                </span>
                <CopyQuote text={t.asPublished ?? ''} />
                <Link
                  href={`/dashboard/clients/${t.clientId}`}
                  className="text-[11px] underline underline-offset-4"
                  style={{ color: BRAND.darkInkFaint }}
                >
                  {t.clientName}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {waiting.length > 0 && (
        <div>
          <SectionHead title="Still with them" count={waiting.length} />
          <p className="text-[12.5px] mt-2 mb-1" style={{ color: BRAND.darkInkSoft }}>
            Asked, not answered. Nothing chases them, on purpose: a compliment you had to ask for twice is
            not worth publishing.
          </p>
          {waiting.map(t => (
            <div key={t.id} className="flex items-baseline gap-3 py-3 border-b" style={{ borderColor: BRAND.darkLineSoft }}>
              <Link href={`/dashboard/clients/${t.clientId}`} className="text-[13.5px] font-semibold hover:underline" style={{ color: BRAND.darkInk }}>
                {t.clientName}
              </Link>
              <span className="flex-1 border-b border-dotted" style={{ borderColor: BRAND.darkLineSoft }} aria-hidden />
              <span className="text-[11px] tabular-nums" style={{ color: BRAND.darkInkFaint }}>
                asked {new Date(t.askedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          ))}
        </div>
      )}

      {declined.length > 0 && (
        <div className="pb-12">
          <SectionHead title="They said no" count={declined.length} />
          <p className="text-[12.5px] mt-2" style={{ color: BRAND.darkInkSoft }}>
            Recorded so nobody asks them again. It is not a reflection on the work.
          </p>
        </div>
      )}
    </PageBody>
  )
}
